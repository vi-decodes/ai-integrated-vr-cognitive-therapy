import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { MonitoringCard } from "@/components/Dashboard/MonitoringCard";
import { PatientList } from "@/components/Dashboard/PatientList";
import { SessionTimeline } from "@/components/Dashboard/SessionTimeline";
import { Card } from "@/components/ui/card";
import { Activity, Heart, Eye, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { predictStress } from "@/services/api";
import { toast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);

  const startSession = async () => {
    try {
      setLoading(true);

      const result = await predictStress({
        physio_features: [0.12, 0.85, 72, 0.34, 1.2, 0.48, 0.19],
        audio_mfcc: new Array(80).fill(0.9),
        face_score: 0.8,

      });

      console.log("Prediction:", result);

      toast({
        title: "Session Analysis Complete",
        description: `Stress level detected: ${result.stress_state}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Backend Error",
        description: "Unable to connect to stress analysis service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Stay up to date, Dr. Sarah
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your patients today
            </p>
          </div>

          <Button
            onClick={startSession}
            disabled={loading}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Analyzing..." : "Start Session"}
          </Button>
        </div>

        {/* Monitoring Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MonitoringCard
            title="Active Sessions"
            value="3"
            subtitle="2 scheduled today"
            icon={Activity}
            variant="mint"
            trend="+12%"
          />
          <MonitoringCard
            title="Avg. Heart Rate"
            value="74 BPM"
            subtitle="Within normal range"
            icon={Heart}
            variant="pink"
            trend="Stable"
          />
          <MonitoringCard
            title="Stress Reduction"
            value="67%"
            subtitle="Across all patients"
            icon={TrendingUp}
            variant="blue"
            trend="+8%"
          />
          <MonitoringCard
            title="Eye Tracking"
            value="92%"
            subtitle="Engagement score"
            icon={Eye}
            variant="yellow"
            trend="+5%"
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SessionTimeline />

            <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Quick Stats
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-2xl bg-pastel-lavender">
                  <p className="text-3xl font-bold text-foreground mb-1">24</p>
                  <p className="text-sm text-foreground/70">Total Patients</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-pastel-blue">
                  <p className="text-3xl font-bold text-foreground mb-1">156</p>
                  <p className="text-sm text-foreground/70">
                    Sessions This Month
                  </p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-pastel-mint">
                  <p className="text-3xl font-bold text-foreground mb-1">89%</p>
                  <p className="text-sm text-foreground/70">Success Rate</p>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <PatientList />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
