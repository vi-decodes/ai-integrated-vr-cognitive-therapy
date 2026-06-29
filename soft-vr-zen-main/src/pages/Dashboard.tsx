import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Activity, Server, Radio, Brain, Play, Square, FileText, Monitor, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const { isActive, sessionId, sessionStart, modality, prediction, startSession, stopSession, launchVR, stopVR, loading } = useSession();
  const navigate = useNavigate();

  const handleStartSession = async () => {
    try {
      await startSession();
      navigate("/monitoring");
    } catch (error: any) {
      toast({
        title: "Session Creation Failed",
        description: error.message || "Unable to start a new therapy session.",
        variant: "destructive",
      });
    }
  };

  const handleEndSession = async () => {
    await stopSession();
    toast({
      title: "Session Ended",
      description: "The therapy session has been successfully concluded.",
    });
  };

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

  const StatusIndicator = ({ status, label, icon: Icon }: { status: string, label: string, icon: any }) => {
    const isGood = status === "active" || status === "connected" || status === "ready";
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isGood ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isGood ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
          <span className="text-sm font-medium capitalize">{status}</span>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">System Overview</h1>
          <p className="text-muted-foreground">Manage and monitor AI-assisted VR cognitive therapy sessions.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* System Status */}
          <Card className="p-6 space-y-6 border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              System Status
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <StatusIndicator status="active" label="Backend Service" icon={Server} />
              <StatusIndicator status={modality.vr} label="Unity VR Integration" icon={Monitor} />
              <StatusIndicator status={isActive ? "connected" : "idle"} label="WebSocket Stream" icon={Radio} />
              <StatusIndicator status="ready" label="AI Inference Models" icon={Brain} />
            </div>
          </Card>

          <div className="space-y-6">
            {/* Current Session */}
            <Card className="p-6 border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl bg-pastel-blue">
              <h2 className="text-xl font-bold mb-4">Current Session</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg">
                  <span className="text-sm text-muted-foreground">Session Status</span>
                  <span className={`font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {isActive ? "Running" : "No Active Session"}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg">
                  <span className="text-sm text-muted-foreground">Session ID</span>
                  <span className="font-mono text-sm">{sessionId || "—"}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg">
                  <span className="text-sm text-muted-foreground">Session Start Time</span>
                  <span className="font-medium text-sm">{isActive && sessionStart > 0 ? new Date(sessionStart).toLocaleTimeString() : "—"}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg">
                  <span className="text-sm text-muted-foreground">Patient</span>
                  <span className="font-medium">PT-001 (Demo Patient)</span>
                </div>
              </div>
            </Card>

            {/* Stress Overview */}
            <Card className="p-6 border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl bg-pastel-mint">
              <h2 className="text-xl font-bold mb-4">Live Stress Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 p-4 rounded-xl text-center">
                  <div className="text-sm text-muted-foreground mb-1">Current Stress State</div>
                  <div className="text-2xl font-bold capitalize">{prediction.stress_state && prediction.stress_state !== "idle" ? prediction.stress_state : "—"}</div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl text-center">
                  <div className="text-sm text-muted-foreground mb-1">Current Session Status</div>
                  <div className="text-2xl font-bold capitalize">{isActive ? "Running" : "Offline"}</div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl text-center col-span-2">
                  <div className="text-sm text-muted-foreground mb-1">Timestamp</div>
                  <div className="text-lg font-medium">{isActive ? new Date().toLocaleTimeString() : "—"}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
          <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            {!isActive ? (
              <Button onClick={handleStartSession} disabled={loading} size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
                <Play className="w-5 h-5" /> {loading ? "Starting..." : "Start Session"}
              </Button>
            ) : (
              <Button onClick={handleEndSession} variant="destructive" size="lg" className="rounded-xl gap-2">
                <Square className="w-5 h-5" /> End Session
              </Button>
            )}
            <Button onClick={() => navigate("/monitoring")} variant="outline" size="lg" disabled={!isActive} className="rounded-xl gap-2 border-primary/20 hover:bg-primary/5">
              <Activity className="w-5 h-5 text-primary" /> Open Monitoring
            </Button>
            <Button onClick={handleLaunchVR} disabled={!isActive} variant="outline" size="lg" className="rounded-xl gap-2 border-primary/20 hover:bg-primary/5">
              <Monitor className="w-5 h-5 text-primary" /> Launch VR
            </Button>
            <Button onClick={handleStopVR} disabled={!isActive} variant="outline" size="lg" className="rounded-xl gap-2 border-red-200 hover:bg-red-50 text-red-600">
              <Square className="w-5 h-5" /> Stop VR
            </Button>
            <Button onClick={() => navigate("/reports")} variant="outline" size="lg" className="rounded-xl gap-2 border-primary/20 hover:bg-primary/5">
              <FileText className="w-5 h-5 text-primary" /> Session Summary
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
