/**
 * useRealtimeAudio.ts — Real-Time MFCC Streaming Hook
 *
 * Pipeline:  Mic → Meyda Analyzer → 40-coeff MFCC → 32-frame FIFO → POST /audio_sequence
 *
 * Key design decisions:
 *   - bufferSize=512 for faster frame rate (~86 Hz at 44.1 kHz)
 *   - numberOfMFCCCoefficients=40 forces Meyda to output exactly 40
 *   - Slice guard: if Meyda returns >40, we trim; if <40, we skip
 *   - isActiveRef + isCapturingRef prevent stale-closure bugs
 *   - useEffect deps are [isActive] ONLY — no start/stop loop
 */

import { useRef, useState, useCallback, useEffect } from "react";
import Meyda from "meyda";
import { pushAudioSequence } from "../services/api";

// ─── Constants (must match backend model) ─────────────────────────────────────
const SEQ_LEN     = 32;   // frames in the sliding window
const NUM_MFCC    = 40;   // MFCC coefficients per frame
const STRIDE      = 5;    // send every N new frames → keep 27
const BUFFER_SIZE = 512;  // Meyda analyzer buffer (samples)

export interface AudioResult {
  stress_score: number;
  predicted_class: number;
  probabilities: number[];
  confidence: number;
}

export function useRealtimeAudio({ isActive }: { isActive: boolean }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastResult, setLastResult]   = useState<AudioResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [windowsSent, setWindowsSent] = useState(0);

  // Refs for values that must be readable inside closures without re-renders
  const isCapturingRef = useRef(false);
  const isActiveRef    = useRef(isActive);
  const bufferRef      = useRef<number[][]>([]);
  const lastSentRef    = useRef(0); // Step 4: throttle — ms timestamp of last successful send

  // Audio node refs for cleanup
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyzerRef  = useRef<any>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef    = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);

  // Keep isActiveRef in sync with prop
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // ── Start capture ──────────────────────────────────────────────────────────
  const startCapture = useCallback(async () => {
    // ISSUE 4: prevent multiple captures
    if (isCapturingRef.current) {
      console.log("[useRealtimeAudio] Already capturing — skipping start");
      return;
    }
    isCapturingRef.current = true;
    setError(null);

    try {
      if (!Meyda) {
        console.error("[useRealtimeAudio] Meyda not loaded");
        isCapturingRef.current = false;
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // ISSUE 1: Force exactly 40 MFCC coefficients — MUST set on module globally
      // Meyda's createMeydaAnalyzer config doesn't reliably propagate this to get()
      (Meyda as any).numberOfMFCCCoefficients = NUM_MFCC;

      const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: audioCtx,
        source: source,
        bufferSize: BUFFER_SIZE,
        featureExtractors: ["mfcc"],
        numberOfMFCCCoefficients: NUM_MFCC,
        sampleRate: audioCtx.sampleRate,
      });
      analyzerRef.current = analyzer;
      analyzer.start();

      // ScriptProcessor drives the frame clock
      const processor = audioCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = async () => {
        try {
          // ISSUE 5: skip processing when session is inactive
          if (!isActiveRef.current) return;

          const mfcc = analyzer.get("mfcc");

          // ISSUE 2: flexible validation — accept anything ≥ 1 coeff
          if (!mfcc || mfcc.length < 1) {
            console.warn("⚠️ No MFCC data");
            return;
          }

          // Pad or trim to exactly NUM_MFCC (40)
          let rawFrame = Array.from(mfcc as number[]);
          if (rawFrame.length < NUM_MFCC) {
            // Pad with zeros
            rawFrame = [...rawFrame, ...new Array(NUM_MFCC - rawFrame.length).fill(0)];
          }
          const frame = rawFrame.slice(0, NUM_MFCC);

          // ISSUE 6: debug logs
          console.log("🎙 MFCC length:", mfcc.length);

          bufferRef.current.push(frame);
          console.log("📦 Buffer size:", bufferRef.current.length);

          if (bufferRef.current.length >= SEQ_LEN) {
            // Step 4: throttle — skip if last send was < 200ms ago
            const now = Date.now();
            if (now - lastSentRef.current < 200) {
              // Still slide the buffer to stay current
              bufferRef.current = bufferRef.current.slice(-(SEQ_LEN - STRIDE));
              return;
            }
            lastSentRef.current = now;

            const window = bufferRef.current.slice(-SEQ_LEN);
            console.log("🚀 Sending MFCC window:", window.length);

            // Step 5: handle fetch errors cleanly
            try {
              const result = await pushAudioSequence(window);
              if (result) setLastResult(result as any);
              setWindowsSent(prev => prev + 1);
              console.log("✅ MFCC window sent:", window.length);
            } catch (err) {
              console.error("❌ Fetch failed:", err);
            }

            // STRIDE = 5 → keep last 27 frames
            bufferRef.current = bufferRef.current.slice(-(SEQ_LEN - STRIDE));
          }
        } catch (err) {
          console.error("Audio processing error:", err);
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsCapturing(true);
      console.log("[useRealtimeAudio] ✅ Capture started — streaming MFCC to /audio_sequence");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      setError(msg);
      isCapturingRef.current = false;
      console.error("[useRealtimeAudio] Error:", err);
    }
  }, []); // no deps — refs handle all mutable state

  // ── Stop capture ───────────────────────────────────────────────────────────
  const stopCapture = useCallback(() => {
    try {
      if (analyzerRef.current) {
        analyzerRef.current.stop();
      }
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      streamRef.current?.getTracks().forEach(t => t.stop());

      analyzerRef.current  = null;
      processorRef.current = null;
      sourceRef.current    = null;
      audioCtxRef.current  = null;
      streamRef.current    = null;

      bufferRef.current = [];
      isCapturingRef.current = false;
      lastSentRef.current = 0; // reset throttle on stop
      setWindowsSent(0);
      setIsCapturing(false);
      console.log("[useRealtimeAudio] Capture stopped.");
    } catch (err) {
      console.error("[useRealtimeAudio] Stop error:", err);
    }
  }, []); // no deps

  // ISSUE 3: Auto start/stop — deps are [isActive] ONLY
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isActive) return;

    const start = async () => {
      try {
        await startCapture();
      } catch (e) {
        console.error(e);
      }
    };

    start();

    return () => {
      stopCapture();
    };
  }, [isActive]);

  return {
    isCapturing,
    startCapture,
    stopCapture,
    lastResult,
    error,
    windowsSent,
  };
}

// ─── Legacy export ───────────────────────────────────────────────────────────
export { useRealtimeAudio as default };
