import { useNavigate } from "react-router-dom";
import { Activity, Mic, Brain, Camera, Cpu, Wifi, WifiOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import {
  StressGauge, Sparkline, StressBadge, LiveDot,
  SectionHeading, stressLabel, stressColor, ModalityRow,
} from "@/components/clinical/ClinicalUI";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Play, Square } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Monitoring() {
  const navigate = useNavigate();
  const {
    isActive, startSession, stopSession, loading,
    prediction, modality, timeline, windowsSent, isCapturing,
    launchVR, stopVR,
  } = useSession();

  const handleLaunchVR = async () => {
    const result = await launchVR();
    toast({
      title: result.success ? "VR Application" : "VR Launch Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  const handleStopVR = async () => {
    const result = await stopVR();
    toast({
      title: result.success ? "VR Application" : "VR Stop Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  const scores = timeline.map(p => p.score);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Monitoring Session</h1>
          <p className="text-sm text-muted-foreground">Live AI inference pipeline — multimodal stress detection</p>
        </div>
        <div className="flex items-center gap-3">
          {isActive && <LiveDot active color="bg-green-500" />}
          {isActive && <span className="text-sm font-semibold text-green-600">LIVE</span>}
          {!isActive ? (
            <Button onClick={async () => {
              try {
                await startSession();
              } catch (e) {
                /* Error is handled/thrown from Context, can show a toast if needed */
              }
            }} disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg h-9 px-4 font-semibold">
              {loading ? "Starting…" : "Start Session"}
            </Button>
          ) : (
            <Button variant="destructive" onClick={async () => {
              await stopSession();
              navigate("/dashboard");
            }} className="rounded-lg h-9 px-4 font-semibold">
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* ── Pipeline overview row ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Audio */}
        <div className="rounded-xl border border-border bg-card p-4 modality-audio flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Mic className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Audio Analysis</p>
            <p className="text-sm font-medium text-foreground mt-1">CNN + LSTM</p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <LiveDot active={modality.audio === "active"} color="bg-purple-500" />
            <span className={`text-xs font-semibold ${modality.audio === "active" ? "text-purple-600" : "text-slate-400"}`}>
              {modality.audio === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Physio */}
        <div className="rounded-xl border border-border bg-card p-4 modality-physio flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">Physiological Analysis</p>
            <p className="text-sm font-medium text-foreground mt-1">MLP</p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <LiveDot active={modality.physio === "active"} color="bg-cyan-500" />
            <span className={`text-xs font-semibold ${modality.physio === "active" ? "text-cyan-600" : "text-slate-400"}`}>
              {modality.physio === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Face */}
        <div className="rounded-xl border border-border bg-card p-4 modality-body flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Camera className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Facial Analysis</p>
            <p className="text-sm font-medium text-foreground mt-1">DeepFace</p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <LiveDot active={modality.body === "active"} color="bg-green-500" />
            <span className={`text-xs font-semibold ${modality.body === "active" ? "text-green-600" : "text-slate-400"}`}>
              {modality.body === "active" ? "Active" : "Coming Soon"}
            </span>
          </div>
        </div>

        {/* Fusion */}
        <div className="rounded-xl border border-border bg-card p-4 modality-fusion flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Fusion Engine</p>
            <p className="text-sm font-medium text-foreground mt-1">Deep Fusion Network</p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <LiveDot active={isActive} color="bg-blue-500" />
            <span className={`text-xs font-semibold ${isActive ? "text-blue-600" : "text-slate-400"}`}>
              {isActive ? "Running" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Current Stress State */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <SectionHeading>CURRENT STRESS STATE</SectionHeading>
            <div className="mt-6 mb-8 text-center">
              <div className="inline-flex items-center justify-center mb-4">
                {prediction.stress_state === "calm" && (
                  <div className="relative flex items-center justify-center w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-teal-100 animate-pulse opacity-60" />
                    <div className="absolute inset-2 rounded-full bg-teal-50 border border-teal-200/50" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-teal-300 to-teal-400 shadow-sm" />
                  </div>
                )}
                {prediction.stress_state === "mild" && (
                  <div className="relative flex items-center justify-center w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-amber-100 animate-pulse opacity-60" />
                    <div className="absolute inset-2 rounded-full bg-amber-50 border border-amber-200/50" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 shadow-sm" />
                  </div>
                )}
                {prediction.stress_state === "escalated" && (
                  <div className="relative flex items-center justify-center w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-rose-100 animate-pulse opacity-60" />
                    <div className="absolute inset-2 rounded-full bg-rose-50 border border-rose-200/50" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-rose-300 to-rose-400 shadow-sm" />
                  </div>
                )}
                {(prediction.stress_state === "idle" || !prediction.stress_state) && (
                  <div className="relative flex items-center justify-center w-24 h-24">
                    <div className="absolute inset-2 rounded-full bg-slate-50 border border-slate-200/50" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 shadow-sm" />
                  </div>
                )}
              </div>
              <h2 className={`text-3xl font-bold ${stressColor(prediction.stress_state)}`}>
                {prediction.stress_state === "calm" ? "Calm" : prediction.stress_state === "mild" ? "Mild Stress" : prediction.stress_state === "escalated" ? "Elevated Stress" : "Idle"}
              </h2>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <SectionHeading>Adaptive VR Environment</SectionHeading>
              <div className="mt-4 space-y-3">
                {prediction.stress_state === "calm" && (
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>Full Audience</li>
                    <li>Normal Lighting</li>
                    <li>Standard Public Speaking Scene</li>
                  </ul>
                )}
                {prediction.stress_state === "mild" && (
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>Rear Audience Reduced</li>
                    <li>Slightly Dimmed Lighting</li>
                    <li>Supportive Public Speaking Environment</li>
                  </ul>
                )}
                {prediction.stress_state === "escalated" && (
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>Reduced Audience Density</li>
                    <li>Warm Lighting</li>
                    <li>Maximum Support Environment</li>
                  </ul>
                )}
                {(prediction.stress_state === "idle" || !prediction.stress_state) && (
                  <div className="text-sm text-muted-foreground">Waiting for session...</div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <SectionHeading>System Status</SectionHeading>
              <div className="mt-4 space-y-3">
                {!isActive ? (
                  <div className="text-sm font-medium text-slate-400">
                    Waiting for Session
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <LiveDot active={modality.audio === "active"} color="bg-green-500" />
                      <span className="text-sm font-medium text-foreground">Audio Pipeline</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <LiveDot active={modality.physio === "active"} color="bg-green-500" />
                      <span className="text-sm font-medium text-foreground">Physiological Pipeline</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <LiveDot active={isActive} color="bg-green-500" />
                      <span className="text-sm font-medium text-foreground">Fusion Engine</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Device health */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <SectionHeading>Device Health</SectionHeading>
            <ModalityRow
              icon={<Mic className="w-4 h-4" />}
              label="Microphone"
              status={isCapturing ? "active" : "idle"}
              detail={isCapturing ? "Capturing at 512 samples/frame" : "Inactive"}
              accent="modality-audio"
            />
            <ModalityRow
              icon={<Camera className="w-4 h-4" />}
              label="Camera"
              status={isCapturing ? "active" : "idle"}
              detail={isCapturing ? "Capturing video stream" : "Inactive"}
              accent="modality-body"
            />
            <ModalityRow
              icon={<Cpu className="w-4 h-4" />}
              label="Inference Engine"
              status={isActive ? "active" : "idle"}
              detail={isActive ? "PyTorch CPU · FastAPI" : "Backend offline"}
              accent="modality-fusion"
            />
            <ModalityRow
              icon={modality.vr === "connected" ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              label="Unity WebSocket"
              status={modality.vr === "connected" ? "active" : "idle"}
              detail={modality.vr === "connected" ? "ws://127.0.0.1:8000/ws/vr" : "VR client not connected"}
              accent="modality-fusion"
            />
          </div>
        </div>

        {/* Timeline + live log */}
        <div className="lg:col-span-2 space-y-4">

          {/* Timeline chart */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeading>Real-Time Stress Timeline</SectionHeading>
              {isActive && (
                <span className="text-xs text-muted-foreground">
                  Last {Math.min(scores.length, 120)} predictions
                </span>
              )}
            </div>
            <div className="h-28">
              {scores.length > 0 ? (
                <Sparkline data={scores} color={
                  prediction.stress_state === "escalated" ? "#ef4444"
                  : prediction.stress_state === "mild"    ? "#f59e0b"
                  : "#22c55e"
                } />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  {isActive ? "Collecting data…" : "No active session"}
                </div>
              )}
            </div>

            {/* State distribution */}
            {timeline.length > 0 && (() => {
              const n    = timeline.length;
              const calm = Math.round(timeline.filter(p => p.state === "calm").length / n * 100);
              const mild = Math.round(timeline.filter(p => p.state === "mild").length / n * 100);
              const esc  = Math.round(timeline.filter(p => p.state === "escalated").length / n * 100);
              return (
                <div className="flex gap-2 mt-4">
                  {[
                    { label: "Calm",          pct: calm, cls: "bg-green-500" },
                    { label: "Mild Stress",   pct: mild, cls: "bg-amber-400" },
                    { label: "Elevated",      pct: esc,  cls: "bg-red-500"   },
                  ].map(({ label, pct, cls }) => (
                    <div key={label} className="flex-1 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-center">
                      <div className={`w-2 h-2 rounded-full ${cls} mx-auto mb-1`} />
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground">{pct}%</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Live event log */}
          <div className="rounded-xl border border-border bg-card p-5">
            <SectionHeading>Inference Log</SectionHeading>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {isActive ? "Awaiting first inference…" : "Start a session to see live inferences"}
                </p>
              ) : (
                [...timeline].reverse().slice(0, 20).map((pt, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      pt.state === "calm"     ? "bg-green-500" :
                      pt.state === "mild"     ? "bg-amber-400" : "bg-red-500"
                    }`} />
                    <span className="text-xs text-muted-foreground font-mono w-16 flex-shrink-0">
                      {Math.round(pt.t / 1000)}s
                    </span>
                    <span className="text-xs font-medium text-foreground flex-1">{stressLabel(pt.state)}</span>
                    <span className="text-xs font-mono text-muted-foreground">{(pt.score * 100).toFixed(1)}</span>
                  </div>
                ))
              )}
            </div>
            </div>
            
            {/* Compact VR Controls */}
            <div className="rounded-xl border border-border bg-card p-5 mt-6">
              <SectionHeading>VR Controls</SectionHeading>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs text-muted-foreground block mb-1">Environment</span>
                  <span className="text-sm font-semibold text-foreground">Public Speaking</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs text-muted-foreground block mb-1">Audience</span>
                  <span className="text-sm font-semibold text-foreground">Adaptive</span>
                </div>
                <Button
                  onClick={handleLaunchVR}
                  disabled={!isActive}
                  className="w-full h-full bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Launch VR
                </Button>
                <Button
                  onClick={handleStopVR}
                  disabled={!isActive}
                  variant="destructive"
                  className="w-full h-full font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" /> Stop VR
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
