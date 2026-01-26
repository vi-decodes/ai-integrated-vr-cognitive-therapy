import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";

export default function Reports() {
  const stressData = [
    { month: "Aug", value: 7.2 },
    { month: "Sep", value: 6.8 },
    { month: "Oct", value: 6.5 },
    { month: "Nov", value: 6.0 },
    { month: "Dec", value: 5.5 },
    { month: "Jan", value: 5.2 },
  ];

  const emotions = [
    { name: "Calm", count: 145, color: "bg-pastel-blue" },
    { name: "Anxious", count: 98, color: "bg-pastel-yellow" },
    { name: "Stressed", count: 67, color: "bg-pastel-pink" },
    { name: "Overwhelmed", count: 23, color: "bg-accent" },
  ];

  const maxCount = Math.max(...emotions.map(e => e.count));

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Progress Reports</h1>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" className="rounded-2xl">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Patient</label>
              <Select defaultValue="all">
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="1">Sarah Mitchell</SelectItem>
                  <SelectItem value="2">James Wilson</SelectItem>
                  <SelectItem value="3">Emily Chen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Time Range</label>
              <Select defaultValue="6months">
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Report Type</label>
              <Select defaultValue="comprehensive">
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  <SelectItem value="stress">Stress Analysis</SelectItem>
                  <SelectItem value="progress">Progress Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Stress Improvement Over Time</CardTitle>
              <p className="text-sm text-muted-foreground">Average stress levels across all patients</p>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-4">
                {stressData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-pastel-lavender rounded-t-2xl transition-all hover:bg-pastel-lavender/80" 
                         style={{ height: `${(data.value / 10) * 100}%` }} 
                    />
                    <span className="text-xs font-medium text-muted-foreground">{data.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Emotion Frequency Histogram</CardTitle>
              <p className="text-sm text-muted-foreground">Distribution of emotional states during sessions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {emotions.map((emotion) => (
                  <div key={emotion.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{emotion.name}</span>
                      <span className="text-sm text-muted-foreground">{emotion.count} sessions</span>
                    </div>
                    <div className="w-full h-8 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${emotion.color} rounded-full transition-all`}
                        style={{ width: `${(emotion.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-pastel-blue border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-foreground">333</p>
              <p className="text-xs text-muted-foreground mt-2">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-pastel-mint border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Avg Improvement</p>
              <p className="text-3xl font-bold text-foreground">28%</p>
              <p className="text-xs text-muted-foreground mt-2">Stress reduction</p>
            </CardContent>
          </Card>

          <Card className="bg-pastel-yellow border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-foreground">87%</p>
              <p className="text-xs text-muted-foreground mt-2">Of assigned modules</p>
            </CardContent>
          </Card>

          <Card className="bg-pastel-lavender border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Active Patients</p>
              <p className="text-3xl font-bold text-foreground">24</p>
              <p className="text-xs text-muted-foreground mt-2">Currently enrolled</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
