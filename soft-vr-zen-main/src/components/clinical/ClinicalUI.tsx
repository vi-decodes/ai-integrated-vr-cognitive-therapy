/**
 * Shared clinical UI components used across all pages.
 */
import { cn } from "@/lib/utils";
import { type StressState } from "@/context/SessionContext";

/* ── Stress colour helpers ────────────────────────────── */
export function stressColor(state: StressState): string {
  return {
    calm:         "text-green-600",
    mild:         "text-amber-500",
    escalated:    "text-red-600",
    initializing: "text-blue-500",
    idle:         "text-slate-400",
  }[state] ?? "text-slate-400";
}

export function stressBg(state: StressState): string {
  return {
    calm:         "bg-green-50 border-green-200 text-green-700",
    mild:         "bg-amber-50 border-amber-200 text-amber-700",
    escalated:    "bg-red-50   border-red-200   text-red-700",
    initializing: "bg-blue-50  border-blue-200  text-blue-700",
    idle:         "bg-slate-50 border-slate-200 text-slate-500",
  }[state] ?? "bg-slate-50 border-slate-200 text-slate-500";
}

export function stressLabel(state: StressState): string {
  return {
    calm:         "Calm",
    mild:         "Mild Stress",
    escalated:    "Elevated Stress",
    initializing: "Warming Up…",
    idle:         "Idle",
  }[state] ?? "Unknown";
}

/* ── Status Badge ─────────────────────────────────────── */
interface BadgeProps { label: string; className?: string; }
export function StatusBadge({ label, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border", className)}>
      {label}
    </span>
  );
}

/* ── Stress Badge ─────────────────────────────────────── */
export function StressBadge({ state }: { state: StressState }) {
  return (
    <StatusBadge label={stressLabel(state)} className={cn("border", stressBg(state))} />
  );
}

/* ── Live Dot ─────────────────────────────────────────── */
export function LiveDot({ active, color = "bg-green-500" }: { active: boolean; color?: string }) {
  if (!active) return (
    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-300" />
  );
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", color)} />
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", color)} />
    </span>
  );
}

/* ── Section heading ──────────────────────────────────── */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </h2>
  );
}

/* ── Stat Card ────────────────────────────────────────── */
interface StatCardProps {
  label:     string;
  value:     string | number;
  sub?:      string;
  icon?:     React.ReactNode;
  accent?:   string;
  className?: string;
}
export function StatCard({ label, value, sub, icon, accent = "bg-blue-50", className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl bg-card border border-border p-4 flex items-start gap-3", className)}>
      {icon && (
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-600", accent)}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
        <p className="text-xl font-bold text-foreground leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Modality Row ─────────────────────────────────────── */
interface ModalityRowProps {
  icon:   React.ReactNode;
  label:  string;
  status: "idle" | "active" | "error";
  detail: string;
  accent: string;
}
export function ModalityRow({ icon, label, status, detail, accent }: ModalityRowProps) {
  const dotColor = status === "active" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-slate-300";
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card", accent)}>
      <div className="flex-shrink-0 text-slate-600">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
      </div>
      <LiveDot active={status === "active"} color={dotColor} />
    </div>
  );
}

/* ── Stress Gauge (SVG arc) ───────────────────────────── */
export function StressGauge({ score, state }: { score: number; state: StressState }) {
  const R = 52, CX = 64, CY = 64;
  const circ   = 2 * Math.PI * R;
  const half   = circ / 2;
  const offset = half - (score * half);

  const stroke = {
    calm:         "#22c55e",
    mild:         "#f59e0b",
    escalated:    "#ef4444",
    initializing: "#3b82f6",
    idle:         "#94a3b8",
  }[state] ?? "#94a3b8";

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <svg width={128} height={80} viewBox="0 0 128 80">
        {/* Track */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none" stroke="#e2e8f0" strokeWidth={10} strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none" stroke={stroke} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${half} ${half}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease" }}
        />
        {/* Score label */}
        <text x={CX} y={CY - 6} textAnchor="middle" className="font-bold" fontSize={20} fill={stroke} fontWeight={700}>
          {Math.round(score * 100)}
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight={500}>
          STRESS SCORE
        </text>
      </svg>
    </div>
  );
}

/* ── Mini Sparkline ───────────────────────────────────── */
export function Sparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="h-10 flex items-center justify-center text-xs text-muted-foreground">Awaiting data…</div>;
  const W = 280, H = 40;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (v / max) * H * 0.85 - 2;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
