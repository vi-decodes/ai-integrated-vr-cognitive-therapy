import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, User } from "lucide-react";

export default function Notes() {
  const notes = [
    {
      id: 1,
      title: "Session #12: Patient showed improved stability",
      content: "Patient showed improved stability during public speaking simulation. Heart rate remained within normal range. Recommend continuing current module difficulty.",
      patient: "Sarah Mitchell",
      date: "Jan 15, 2025",
      color: "bg-pastel-mint",
      tags: ["progress", "public-speaking"],
    },
    {
      id: 2,
      title: "Session #11: Some anxiety spikes noted",
      content: "Some anxiety spikes noted in crowded room scenario. Patient requested shorter session duration. Recommend continued gradual exposure with 5-minute intervals.",
      patient: "Sarah Mitchell",
      date: "Jan 12, 2025",
      color: "bg-pastel-lavender",
      tags: ["anxiety", "crowded-spaces"],
    },
    {
      id: 3,
      title: "Initial assessment completed",
      content: "Patient presents with moderate social anxiety. Baseline stress levels recorded. Recommended starting with social interaction module at difficulty level 2.",
      patient: "James Wilson",
      date: "Jan 10, 2025",
      color: "bg-pastel-yellow",
      tags: ["initial-assessment", "social-anxiety"],
    },
    {
      id: 4,
      title: "Breakthrough in height exposure",
      content: "Significant progress observed. Patient completed level 4 height simulation without distress. Heart rate variability shows improved emotional regulation.",
      patient: "Emily Chen",
      date: "Jan 8, 2025",
      color: "bg-pastel-blue",
      tags: ["breakthrough", "heights"],
    },
    {
      id: 5,
      title: "Session interrupted due to high stress",
      content: "Session ended early due to elevated stress indicators. Patient requested break. Recommend reducing difficulty and increasing relaxation intervals before resuming.",
      patient: "Michael Brown",
      date: "Jan 5, 2025",
      color: "bg-pastel-pink",
      tags: ["high-stress", "early-termination"],
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Therapist Notes</h1>
          <Button className="rounded-2xl bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>

        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search notes by patient, content, or tags..."
              className="pl-12 rounded-2xl"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {notes.map((note) => (
              <Card
                key={note.id}
                className={`${note.color} border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-3xl`}
              >
                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-foreground">{note.title}</h3>
                  <p className="text-sm text-foreground/80 line-clamp-3">{note.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-foreground/70">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{note.patient}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{note.date}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {note.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-card/50 text-foreground border-0 rounded-full text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6 cursor-pointer hover:shadow-md transition-shadow">
            <h3 className="font-medium text-foreground mb-2">Recent Notes</h3>
            <p className="text-3xl font-bold text-foreground">127</p>
            <p className="text-sm text-muted-foreground mt-1">All time</p>
          </Card>

          <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6 cursor-pointer hover:shadow-md transition-shadow">
            <h3 className="font-medium text-foreground mb-2">This Week</h3>
            <p className="text-3xl font-bold text-foreground">18</p>
            <p className="text-sm text-muted-foreground mt-1">New entries</p>
          </Card>

          <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6 cursor-pointer hover:shadow-md transition-shadow">
            <h3 className="font-medium text-foreground mb-2">Tags Used</h3>
            <p className="text-3xl font-bold text-foreground">24</p>
            <p className="text-sm text-muted-foreground mt-1">Categories</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
