import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, TrendingDown, Activity } from "lucide-react";
import { useParams } from "react-router-dom";

export default function PatientProfile() {
  const { id } = useParams();

  const sessionLogs = [
    { id: 1, date: "Jan 15, 2025", module: "Public Speaking", stress: "Medium", duration: "45min" },
    { id: 2, date: "Jan 12, 2025", module: "Crowded Room", stress: "High", duration: "30min" },
    { id: 3, date: "Jan 8, 2025", module: "Social Interaction", stress: "Low", duration: "40min" },
    { id: 4, date: "Jan 5, 2025", module: "Height Exposure", stress: "Medium", duration: "35min" },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Patient Profile</h1>
          <Button className="rounded-2xl bg-primary text-primary-foreground">
            Assign New VR Module
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-pastel-lavender flex items-center justify-center">
                  <User className="w-12 h-12 text-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Sarah Mitchell</h2>
                  <p className="text-sm text-muted-foreground">Patient ID: #{id}</p>
                </div>
                <div className="w-full space-y-3 pt-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Age</span>
                    <span className="text-sm font-medium text-foreground">32 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-pastel-blue text-foreground border-0 rounded-full">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Started</span>
                    <span className="text-sm font-medium text-foreground">Dec 2024</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="bg-pastel-yellow border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
              <CardContent className="p-6">
                <Activity className="w-8 h-8 text-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Avg Stress Score</p>
                <p className="text-3xl font-bold text-foreground">6.2/10</p>
              </CardContent>
            </Card>

            <Card className="bg-pastel-mint border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
              <CardContent className="p-6">
                <Calendar className="w-8 h-8 text-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Last Session</p>
                <p className="text-3xl font-bold text-foreground">2 days ago</p>
              </CardContent>
            </Card>

            <Card className="bg-pastel-blue border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
              <CardContent className="p-6">
                <TrendingDown className="w-8 h-8 text-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Modules Assigned</p>
                <p className="text-3xl font-bold text-foreground">8</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Graph Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Stress Trend (Last 10 Sessions)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-2">
                {[7.5, 7.2, 6.8, 6.5, 6.9, 6.3, 6.0, 5.8, 6.2, 5.9].map((value, i) => (
                  <div key={i} className="flex-1 bg-pastel-lavender rounded-t-lg" style={{ height: `${value * 10}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Emotion Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Calm</span>
                    <span className="font-medium text-foreground">45%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-pastel-blue rounded-full" style={{ width: "45%" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Anxious</span>
                    <span className="font-medium text-foreground">30%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-pastel-yellow rounded-full" style={{ width: "30%" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stressed</span>
                    <span className="font-medium text-foreground">25%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-pastel-pink rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Logs */}
        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Session History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{log.module}</p>
                    <p className="text-sm text-muted-foreground">{log.date} • {log.duration}</p>
                  </div>
                  <Badge className={`border-0 rounded-full ${
                    log.stress === "Low" ? "bg-pastel-blue" :
                    log.stress === "Medium" ? "bg-pastel-yellow" :
                    "bg-pastel-pink"
                  } text-foreground`}>
                    {log.stress}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Therapist Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-pastel-mint">
                <p className="text-sm text-foreground">Session #12: Patient showed improved stability during public speaking simulation. Heart rate remained within normal range.</p>
                <p className="text-xs text-muted-foreground mt-2">Jan 15, 2025 - Dr. Thompson</p>
              </div>
              <div className="p-4 rounded-2xl bg-pastel-lavender">
                <p className="text-sm text-foreground">Session #11: Some anxiety spikes noted in crowded room scenario. Recommend continued gradual exposure.</p>
                <p className="text-xs text-muted-foreground mt-2">Jan 12, 2025 - Dr. Thompson</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
