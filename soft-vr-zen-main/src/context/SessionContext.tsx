/**
 * SessionContext — shared real-time session + stress state
 * consumed by Dashboard, Monitoring, VR Therapy, and Reports.
 */
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

export type StressState = "calm" | "mild" | "escalated" | "initializing" | "idle";

export interface ModalityStatus {
  audio:  "idle" | "active" | "error";
  physio: "idle" | "active" | "error";
  body:   "idle" | "active" | "error";
  vr:     "connected" | "disconnected";
}

export interface FusedPrediction {
  stress_state:        StressState;
  fused_score:         number;
  confidence:          number;
  audio_score:         number;
  physio_score:        number;
}

export interface TimelinePoint {
  t:     number; // ms since session start
  score: number;
  state: StressState;
}

export interface SessionSummary {
  session_id:    string;
  duration_s:    number;
  avg_score:     number;
  max_score:     number;
  peak_state:    StressState;
  calm_pct:      number;
  mild_pct:      number;
  escalated_pct: number;
  windows_sent:  number;
  timeline:      TimelinePoint[];
}

interface SessionCtx {
  /* session lifecycle */
  isActive:       boolean;
  sessionId:      string | null;
  sessionStart:   number;
  startSession:   () => Promise<void>;
  stopSession:    () => Promise<void>;
  launchVR:       () => Promise<{ success: boolean; message: string }>;
  stopVR:         () => Promise<{ success: boolean; message: string }>;

  /* live data */
  prediction:     FusedPrediction;
  modality:       ModalityStatus;
  timeline:       TimelinePoint[];
  windowsSent:    number;
  isCapturing:    boolean;

  /* post-session */
  summary:        SessionSummary | null;

  /* loading */
  loading:        boolean;
}

const DEFAULT_PREDICTION: FusedPrediction = {
  stress_state: "idle",
  fused_score:  0,
  confidence:   0,
  audio_score:  0,
  physio_score: 0,
};

const DEFAULT_MODALITY: ModalityStatus = {
  audio:  "idle",
  physio: "idle",
  body:   "idle",
  vr:     "disconnected",
};

const SessionContext = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isActive,     setIsActive]     = useState(false);
  const [sessionId,    setSessionId]    = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number>(0);
  const [prediction,   setPrediction]   = useState<FusedPrediction>(DEFAULT_PREDICTION);
  const [modality,     setModality]     = useState<ModalityStatus>(DEFAULT_MODALITY);
  const [timeline,     setTimeline]     = useState<TimelinePoint[]>([]);
  const [windowsSent,  setWindowsSent]  = useState(0);
  const [isCapturing,  setIsCapturing]  = useState(false);
  const [summary,      setSummary]      = useState<SessionSummary | null>(null);
  const [loading,      setLoading]      = useState(false);

  const wsRef        = useRef<WebSocket | null>(null);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyzerRef  = useRef<any>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef    = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const bufferRef    = useRef<number[][]>([]);
  const lastSentRef  = useRef<number>(0);
  const isActiveRef  = useRef(false);
  const startRef     = useRef<number>(0);
  const timelineRef  = useRef<TimelinePoint[]>([]);

  const SEQ_LEN  = 32;
  const NUM_MFCC = 40;
  const STRIDE   = 5;

  /* ── WebSocket connection ──────────────────────────── */
  const connectWS = useCallback(() => {
    // Close any existing connection before creating a new one.
    // This prevents a stale WS from firing onmessage after a session restart.
    if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
      wsRef.current.onmessage = null;
      wsRef.current.close();
    }
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/stress");
    wsRef.current = ws;

    ws.onopen = () => {
      setModality(m => ({ ...m, vr: "connected" }));
    };

    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        const elapsed = Date.now() - startRef.current;
        if (elapsed < 3000) return; // warmup gate

        const pred: FusedPrediction = {
          stress_state: d.stress_state ?? "idle",
          fused_score:  d.fused_score  ?? 0,
          confidence:   d.confidence   ?? 0,
          audio_score:  d.audio_score  ?? 0,
          physio_score: d.physio_score ?? 0,
        };
        setPrediction(pred);

        const pt: TimelinePoint = { t: elapsed, score: pred.fused_score, state: pred.stress_state };
        timelineRef.current = [...timelineRef.current.slice(-120), pt];
        setTimeline([...timelineRef.current]);
      } catch { /* ignore */ }
    };

    ws.onerror  = () => setModality(m => ({ ...m, vr: "disconnected" }));
    ws.onclose  = () => setModality(m => ({ ...m, vr: "disconnected" }));
  }, []);

  /* ── Audio capture ─────────────────────────────────── */
  const startAudio = useCallback(async () => {
    try {
      const { default: Meyda } = await import("meyda");
      const stream  = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx    = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      (Meyda as any).numberOfMFCCCoefficients = NUM_MFCC;
      const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: ctx, source, bufferSize: 512,
        featureExtractors: ["mfcc"], numberOfMFCCCoefficients: NUM_MFCC, sampleRate: ctx.sampleRate,
      });
      analyzerRef.current = analyzer;
      analyzer.start();

      const processor = ctx.createScriptProcessor(512, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = async () => {
        if (!isActiveRef.current) return;
        const mfcc = analyzer.get("mfcc");
        if (!mfcc || mfcc.length < 1) return;

        let frame = Array.from(mfcc as number[]);
        if (frame.length < NUM_MFCC) frame = [...frame, ...new Array(NUM_MFCC - frame.length).fill(0)];
        bufferRef.current.push(frame.slice(0, NUM_MFCC));

        if (bufferRef.current.length >= SEQ_LEN) {
          const now = Date.now();
          if (now - lastSentRef.current < 200) {
            bufferRef.current = bufferRef.current.slice(-(SEQ_LEN - STRIDE));
            return;
          }
          lastSentRef.current = now;
          const window = bufferRef.current.slice(-SEQ_LEN);
          try {
            const res = await fetch("http://127.0.0.1:8000/audio_sequence", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sequence: window }),
            });
            if (res.ok) {
              setWindowsSent(n => n + 1);
              setModality(m => ({ ...m, audio: "active" }));
            }
          } catch { setModality(m => ({ ...m, audio: "error" })); }
          bufferRef.current = bufferRef.current.slice(-(SEQ_LEN - STRIDE));
        }
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      setIsCapturing(true);
      setModality(m => ({ ...m, audio: "active" }));
    } catch {
      setModality(m => ({ ...m, audio: "error" }));
    }
  }, []);

  const stopAudio = useCallback(() => {
    analyzerRef.current?.stop();
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    analyzerRef.current = processorRef.current = sourceRef.current = audioCtxRef.current = streamRef.current = null;
    bufferRef.current = [];
    lastSentRef.current = 0;
    setIsCapturing(false);
  }, []);

  /* ── Physio simulation (1 Hz) ──────────────────────── */
  const physioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPhysio = useCallback(() => {
    setModality(m => ({ ...m, physio: "active" }));
    physioTimerRef.current = setInterval(() => {
      /* Physio pipeline runs independently in the backend;
         we just update modality status to show it's active. */
    }, 1000);
  }, []);

  const stopPhysio = useCallback(() => {
    if (physioTimerRef.current) clearInterval(physioTimerRef.current);
    setModality(m => ({ ...m, physio: "idle" }));
  }, []);

  /* ── Session lifecycle ─────────────────────────────── */
  const startSession = useCallback(async () => {
    setLoading(true);
    setSummary(null);
    timelineRef.current = [];
    setTimeline([]);
    setWindowsSent(0);
    try {
      const res  = await fetch("http://127.0.0.1:8000/session/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "PT-001" }),
      });
      if (!res.ok) throw new Error("Failed to create session on backend");
      const data = await res.json();
      setSessionId(data.session_id ?? null);

      // Launch VR after session is confirmed on the backend.
      // Fire-and-forget: a VR launch failure does not abort the session.
      fetch("http://127.0.0.1:8000/launch-vr", { method: "POST" })
        .catch(() => console.warn("[Session] /launch-vr request failed — VR may not be built yet."));
    } catch (error) {
      setLoading(false);
      throw new Error("Backend unavailable. Cannot start session.");
    }

    const now = Date.now();
    setSessionStart(now);
    startRef.current = now;
    isActiveRef.current = true;
    setIsActive(true);
    setPrediction({ ...DEFAULT_PREDICTION, stress_state: "initializing" });
    setModality({ audio: "idle", physio: "idle", body: "idle", vr: "disconnected" });

    connectWS();
    await startAudio();
    startPhysio();
    setLoading(false);
  }, [connectWS, startAudio, startPhysio]);

  const stopSession = useCallback(async () => {
    isActiveRef.current = false;
    setIsActive(false);

    stopAudio();
    stopPhysio();
    wsRef.current?.close();

    try { await fetch("http://127.0.0.1:8000/session/end", { method: "POST" }); }
    catch { /* ignore */ }

    // Close VR after session ends. Fire-and-forget.
    fetch("http://127.0.0.1:8000/close-vr", { method: "POST" })
      .catch(() => console.warn("[Session] /close-vr request failed."));

    /* Build summary from timeline */
    const tl    = timelineRef.current;
    const dur   = tl.length > 0 ? (tl[tl.length - 1].t) / 1000 : 0;
    const avg   = tl.length > 0 ? tl.reduce((a, p) => a + p.score, 0) / tl.length : 0;
    const max   = tl.length > 0 ? Math.max(...tl.map(p => p.score)) : 0;
    const calm  = tl.filter(p => p.state === "calm").length / Math.max(tl.length, 1);
    const mild  = tl.filter(p => p.state === "mild").length / Math.max(tl.length, 1);
    const esc   = tl.filter(p => p.state === "escalated").length / Math.max(tl.length, 1);
    const peak  = esc > 0.2 ? "escalated" : mild > 0.5 ? "mild" : "calm";

    setSummary({
      session_id:    sessionId ?? "N/A",
      duration_s:    dur,
      avg_score:     avg,
      max_score:     max,
      peak_state:    peak,
      calm_pct:      calm * 100,
      mild_pct:      mild * 100,
      escalated_pct: esc * 100,
      windows_sent:  windowsSent,
      timeline:      tl,
    });

    setPrediction(DEFAULT_PREDICTION);
    setModality(DEFAULT_MODALITY);
    setIsCapturing(false);
  }, [stopAudio, stopPhysio, sessionId, windowsSent]);

  const launchVR = useCallback(async () => {
    try {
      const res  = await fetch("http://127.0.0.1:8000/launch-vr", { method: "POST" });
      const data = await res.json();
      return { success: !!data.success, message: data.message ?? "Unknown response." };
    } catch {
      return { success: false, message: "Could not reach the backend. Ensure the server is running." };
    }
  }, []);

  const stopVR = useCallback(async () => {
    try {
      const res  = await fetch("http://127.0.0.1:8000/close-vr", { method: "POST" });
      const data = await res.json();
      return { success: !!data.success, message: data.message ?? "Unknown response." };
    } catch {
      return { success: false, message: "Could not reach the backend. Ensure the server is running." };
    }
  }, []);

  const ctx: SessionCtx = {
    isActive, sessionId, sessionStart, startSession, stopSession, launchVR, stopVR,
    prediction, modality, timeline, windowsSent, isCapturing, summary, loading,
  };

  return <SessionContext.Provider value={ctx}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
