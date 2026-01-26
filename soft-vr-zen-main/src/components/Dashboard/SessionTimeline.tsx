import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionEvent {
  id: string;
  title: string;
  time: string;
  patient: string;
  type: "calm" | "mild" | "escalated";
  status?: string;
}

const sessions: SessionEvent[] = [
  { id: "1", title: "Exposure Therapy", time: "10:00 - 10:45", patient: "Sarah Mitchell", type: "calm", status: "Completed" },
  { id: "2", title: "Cognitive Training", time: "11:00 - 11:30", patient: "James Wilson", type: "mild", status: "In Progress" },
  { id: "3", title: "Relaxation Module", time: "14:00 - 14:30", patient: "Emily Chen", type: "calm" },
  { id: "4", title: "Stress Management", time: "15:00 - 15:45", patient: "Michael Brown", type: "escalated" },
];

const typeStyles = {
  calm: "bg-pastel-blue border-0",
  mild: "bg-pastel-yellow border-0",
  escalated: "bg-accent border-0",
};

export function SessionTimeline() {
  return (
    <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Today's Schedule</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
            Today
          </button>
          <button className="px-4 py-2 rounded-full bg-muted text-foreground text-sm">
            Week
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div 
            key={session.id}
            className={`${typeStyles[session.type]} rounded-2xl p-4`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">{session.title}</h3>
                <p className="text-sm text-foreground/70 mb-2">{session.patient}</p>
                <p className="text-xs text-foreground/60">{session.time}</p>
              </div>
              {session.status && (
                <Badge variant="secondary" className="rounded-full text-xs">
                  {session.status}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
