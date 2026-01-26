import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Patients() {
  const navigate = useNavigate();

  const patients = [
    { id: "1", name: "Sarah Mitchell", stressLevel: "calm", lastSession: "2 days ago", sessions: 12 },
    { id: "2", name: "James Wilson", stressLevel: "mild", lastSession: "1 week ago", sessions: 8 },
    { id: "3", name: "Emily Chen", stressLevel: "calm", lastSession: "3 days ago", sessions: 15 },
    { id: "4", name: "Michael Brown", stressLevel: "escalated", lastSession: "5 days ago", sessions: 6 },
    { id: "5", name: "Rachel Hayes", stressLevel: "overwhelmed", lastSession: "1 day ago", sessions: 10 },
    { id: "6", name: "David Thompson", stressLevel: "calm", lastSession: "4 days ago", sessions: 20 },
    { id: "7", name: "Lisa Anderson", stressLevel: "mild", lastSession: "2 weeks ago", sessions: 5 },
    { id: "8", name: "Robert Lee", stressLevel: "calm", lastSession: "1 week ago", sessions: 14 },
  ];

  const statusStyles = {
    calm: "bg-pastel-blue text-foreground",
    mild: "bg-pastel-yellow text-foreground",
    escalated: "bg-accent text-foreground",
    overwhelmed: "bg-pastel-pink text-foreground",
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Patients</h1>
          <Button className="rounded-2xl bg-primary text-primary-foreground">
            Add New Patient
          </Button>
        </div>

        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search patients by name or ID..."
              className="pl-12 rounded-2xl"
            />
          </div>

          <div className="space-y-3">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last session: {patient.lastSession} • {patient.sessions} total sessions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={`${statusStyles[patient.stressLevel as keyof typeof statusStyles]} border-0 rounded-full px-4`}>
                    {patient.stressLevel}
                  </Badge>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/patients/${patient.id}`);
                    }}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
            <Button variant="outline" className="rounded-2xl">Previous</Button>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-2xl w-10 h-10 p-0 bg-primary text-primary-foreground">1</Button>
              <Button variant="outline" className="rounded-2xl w-10 h-10 p-0">2</Button>
              <Button variant="outline" className="rounded-2xl w-10 h-10 p-0">3</Button>
            </div>
            <Button variant="outline" className="rounded-2xl">Next</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
