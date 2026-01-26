import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function Schedule() {
  const timeSlots = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dates = ["13", "14", "15", "16", "17"];

  const sessions = [
    { day: 0, time: 2, duration: 1, patient: "Sarah Mitchell", type: "Online Session", color: "bg-pastel-blue" },
    { day: 1, time: 1, duration: 2, patient: "James Wilson", type: "VR Lab Session", color: "bg-pastel-yellow" },
    { day: 1, time: 4, duration: 1, patient: "Emily Chen", type: "Online Session", color: "bg-pastel-blue" },
    { day: 2, time: 3, duration: 1, patient: "Michael Brown", type: "High-Anxiety Case", color: "bg-pastel-pink" },
    { day: 3, time: 2, duration: 2, patient: "Rachel Hayes", type: "VR Lab Session", color: "bg-pastel-yellow" },
    { day: 4, time: 1, duration: 1, patient: "David Thompson", type: "Online Session", color: "bg-pastel-blue" },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
            <p className="text-muted-foreground mt-1">Week of January 13-17, 2025</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="rounded-2xl">
              Today
            </Button>
            <Button variant="outline" className="rounded-2xl">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button className="rounded-2xl bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div className="text-sm font-medium text-muted-foreground">Time</div>
              {weekDays.map((day, i) => (
                <div key={day} className="text-center">
                  <div className="text-sm font-medium text-foreground">{day}</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{dates[i]}</div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {timeSlots.map((time, timeIndex) => (
                <div key={time} className="grid grid-cols-6 gap-4 border-t border-border">
                  <div className="py-4 text-sm text-muted-foreground">{time}</div>
                  {weekDays.map((_, dayIndex) => (
                    <div key={dayIndex} className="relative py-4 min-h-[80px]">
                      {sessions
                        .filter((s) => s.day === dayIndex && s.time === timeIndex)
                        .map((session, idx) => (
                          <div
                            key={idx}
                            className={`absolute inset-x-0 ${session.color} rounded-2xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                            style={{
                              height: `${session.duration * 80}px`,
                              top: 0,
                            }}
                          >
                            <p className="text-sm font-medium text-foreground">{session.patient}</p>
                            <p className="text-xs text-foreground/70 mt-1">{session.type}</p>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pastel-blue"></div>
            <span className="text-sm text-muted-foreground">Online Session</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pastel-yellow"></div>
            <span className="text-sm text-muted-foreground">VR Lab Session</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pastel-pink"></div>
            <span className="text-sm text-muted-foreground">High-Anxiety Case</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
