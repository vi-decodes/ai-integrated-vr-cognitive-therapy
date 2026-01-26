import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MoreVertical } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  lastSession: string;
  status: "calm" | "mild" | "escalated" | "overwhelmed";
  nextSession?: string;
}

const patients: Patient[] = [
  { id: "1", name: "Sarah Mitchell", lastSession: "2 days ago", status: "calm", nextSession: "Tomorrow, 10:00 AM" },
  { id: "2", name: "James Wilson", lastSession: "1 week ago", status: "mild", nextSession: "Today, 2:00 PM" },
  { id: "3", name: "Emily Chen", lastSession: "3 days ago", status: "calm" },
  { id: "4", name: "Michael Brown", lastSession: "5 days ago", status: "escalated", nextSession: "Wed, 3:00 PM" },
  { id: "5", name: "Rachel Hayes", lastSession: "1 day ago", status: "overwhelmed", nextSession: "Thu, 11:00 AM" },
];

const statusStyles = {
  calm: "bg-pastel-blue text-foreground",
  mild: "bg-pastel-yellow text-foreground",
  escalated: "bg-accent text-foreground",
  overwhelmed: "bg-pastel-pink text-foreground",
};

export function PatientList() {
  return (
    <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Patients</h2>
        <button className="text-sm text-muted-foreground hover:text-foreground">View all</button>
      </div>

      <div className="space-y-4">
        {patients.map((patient) => (
          <div 
            key={patient.id}
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{patient.name}</h3>
                <p className="text-sm text-muted-foreground">{patient.lastSession}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={`${statusStyles[patient.status]} border-0 rounded-full px-3`}>
                {patient.status}
              </Badge>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
