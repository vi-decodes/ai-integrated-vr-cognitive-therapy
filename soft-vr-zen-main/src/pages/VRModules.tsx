import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Headphones, Users, Mountain, Home, Plane } from "lucide-react";

export default function VRModules() {
  const modules = [
    {
      id: 1,
      title: "Public Speaking Exposure",
      description: "Simulated audience environment with adjustable crowd size and reaction intensity",
      icon: Users,
      difficulty: 3,
      color: "bg-pastel-blue",
      duration: "30-45 min",
      scenarios: 8,
    },
    {
      id: 2,
      title: "Crowded Room Simulation",
      description: "Navigate through busy spaces with controllable crowd density and noise levels",
      icon: Users,
      difficulty: 4,
      color: "bg-pastel-yellow",
      duration: "20-40 min",
      scenarios: 12,
    },
    {
      id: 3,
      title: "Social Interaction Challenge",
      description: "Practice conversations and social scenarios in safe, controlled environments",
      icon: Users,
      difficulty: 2,
      color: "bg-pastel-mint",
      duration: "25-35 min",
      scenarios: 15,
    },
    {
      id: 4,
      title: "Height Desensitization",
      description: "Gradual exposure to elevated environments with adjustable height levels",
      icon: Mountain,
      difficulty: 5,
      color: "bg-pastel-pink",
      duration: "15-30 min",
      scenarios: 10,
    },
    {
      id: 5,
      title: "Confined Spaces Exposure",
      description: "Small room scenarios with adjustable space dimensions and duration",
      icon: Home,
      difficulty: 4,
      color: "bg-pastel-lavender",
      duration: "10-25 min",
      scenarios: 6,
    },
    {
      id: 6,
      title: "Flight Simulation",
      description: "Complete flight experience from boarding to landing with turbulence control",
      icon: Plane,
      difficulty: 3,
      color: "bg-accent",
      duration: "40-60 min",
      scenarios: 5,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">VR Modules</h1>
            <p className="text-muted-foreground mt-1">Assign and manage exposure therapy scenarios</p>
          </div>
          <Button className="rounded-2xl bg-primary text-primary-foreground">
            <Headphones className="w-4 h-4 mr-2" />
            Create Custom Module
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modules.map((module) => (
            <Card key={module.id} className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden">
              <div className={`h-3 ${module.color}`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${module.color} flex items-center justify-center`}>
                      <module.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">{module.title}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-muted text-foreground border-0 rounded-full text-xs">
                          {module.scenarios} scenarios
                        </Badge>
                        <Badge className="bg-muted text-foreground border-0 rounded-full text-xs">
                          {module.duration}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{module.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Difficulty Level</label>
                    <span className="text-sm text-muted-foreground">{module.difficulty}/5</span>
                  </div>
                  <Slider
                    defaultValue={[module.difficulty]}
                    max={5}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 rounded-2xl bg-primary text-primary-foreground">
                    Assign to Patient
                  </Button>
                  <Button variant="outline" className="rounded-2xl">
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-pastel-blue border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Modules</p>
              <p className="text-3xl font-bold text-foreground">56</p>
              <p className="text-xs text-muted-foreground mt-2">Across all categories</p>
            </CardContent>
          </Card>

          <Card className="bg-pastel-mint border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Active Assignments</p>
              <p className="text-3xl font-bold text-foreground">142</p>
              <p className="text-xs text-muted-foreground mt-2">Currently in progress</p>
            </CardContent>
          </Card>

          <Card className="bg-pastel-yellow border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-foreground">87%</p>
              <p className="text-xs text-muted-foreground mt-2">Average success rate</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
