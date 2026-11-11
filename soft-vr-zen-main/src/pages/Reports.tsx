import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Activity, Clock, Brain, AlertCircle } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { Sparkline, stressLabel, StatCard } from "@/components/clinical/ClinicalUI";

export default function Reports() {
  const { summary } = useSession();

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Post-Session Analysis</h1>
            <p className="text-muted-foreground mt-1">Analysis generated after completion of the most recent therapy session.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl" disabled={!summary}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" className="rounded-2xl" disabled={!summary}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {!summary ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center border-2 border-dashed border-border rounded-3xl bg-card">
            <Activity className="w-12 h-12 text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No Completed Sessions Yet</h2>
            <p className="text-muted-foreground max-w-sm">
              Start a monitoring session from the Dashboard. Real-time inference data will be compiled into a report when the session ends.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                label="Session Duration"
                value={`${Math.floor(summary.duration_s / 60)}m ${Math.floor(summary.duration_s % 60)}s`}
                icon={<Clock className="w-4 h-4" />}
                accent="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Average Stress"
                value={Math.round(summary.avg_score * 100)}
                sub="Mean Fused Score"
                icon={<Activity className="w-4 h-4" />}
                accent="bg-purple-50 text-purple-600"
              />
              <StatCard
                label="Peak Stress"
                value={Math.round(summary.max_score * 100)}
                sub={`State: ${stressLabel(summary.peak_state)}`}
                icon={<AlertCircle className="w-4 h-4" />}
                accent="bg-red-50 text-red-600"
              />
              <StatCard
                label="Inference Samples"
                value={summary.windows_sent}
                sub="Audio windows"
                icon={<Brain className="w-4 h-4" />}
                accent="bg-cyan-50 text-cyan-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">Stress Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {[
                    { label: "Calm", pct: summary.calm_pct, color: "bg-green-500" },
                    { label: "Mild Stress", pct: summary.mild_pct, color: "bg-amber-400" },
                    { label: "Elevated Stress", pct: summary.escalated_pct, color: "bg-red-500" }
                  ].map(state => (
                    <div key={state.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{state.label}</span>
                        <span className="text-muted-foreground">{Math.round(state.pct)}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full ${state.color} transition-all duration-1000`} 
                          style={{ width: `${state.pct}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">Stress Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 mt-4">
                     <Sparkline data={summary.timeline.map(t => t.score)} color="#3b82f6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">VR Adaptations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">00:00</span>
                      <span>Started in <span className="font-semibold text-primary">Public Speaking</span></span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">01:30</span>
                      <span>Audience density increased to <span className="font-semibold text-primary">Adaptive</span></span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">03:45</span>
                      <span>Environment reset by clinician</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex gap-3 text-sm">
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-foreground">Overall Stress Assessment: </span>
                        {summary.escalated_pct > 40
                          ? "Participant exhibited sustained elevated stress throughout the session. Consider reducing session intensity before the next appointment."
                          : summary.mild_pct > 50
                          ? "Participant showed moderate stress responses. Gradual exposure progression is appropriate."
                          : "Participant maintained predominantly calm physiological responses. Session goals were met effectively."}
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-foreground">Therapy Recommendation: </span>
                        {summary.peak_state === "escalated"
                          ? "Apply graduated exposure at a lower starting intensity. Introduce relaxation anchoring before VR immersion."
                          : summary.peak_state === "mild"
                          ? "Continue current exposure level. Incorporate brief mindfulness intervals between VR scenes."
                          : "Participant is responding well. Consider progressive advancement to higher-density audience scenarios."}
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-foreground">Suggested Next Session: </span>
                        {summary.avg_score > 0.65
                          ? "Schedule follow-up within 3–5 days. Allow physiological recovery before the next exposure."
                          : summary.avg_score > 0.35
                          ? "Standard weekly follow-up is appropriate. Monitor baseline stress trend across sessions."
                          : "Participant is progressing well. Next session may be scheduled at therapist discretion."}
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-foreground">Exposure Intensity: </span>
                        {summary.calm_pct > 60
                          ? "Increase audience density in the next session to maintain therapeutic challenge."
                          : summary.escalated_pct > 30
                          ? "Reduce initial audience density. Begin with rear-only audience and expand gradually."
                          : "Maintain current exposure level and assess tolerance over the next two sessions."}
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
