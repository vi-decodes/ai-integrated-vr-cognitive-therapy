import { useSession } from "@/context/SessionContext";

export function AppHeader() {
  const { isActive, sessionId, modality } = useSession();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "connected":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "error":
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <header className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-foreground">AI-Assisted VR Cognitive Therapy</h2>
        <span className="text-sm text-muted-foreground border-l pl-4 border-border">Dr. Sarah</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Session:</div>
          <div className="text-sm font-medium">
            {isActive ? (
              <span className="text-primary">Active (ID: {sessionId || "Creating..."})</span>
            ) : (
              <span className="text-muted-foreground">Inactive</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Backend:</div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor("active")}`} />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Unity VR:</div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(modality.vr)}`} />
        </div>
      </div>
    </header>
  );
}
