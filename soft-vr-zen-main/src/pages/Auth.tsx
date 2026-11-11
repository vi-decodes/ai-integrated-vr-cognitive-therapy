import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Sparkles, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

export default function Auth() {
  const navigate  = useNavigate();
  const [email,   setEmail]   = useState("dr.thompson@clinic.com");
  const [pass,    setPass]    = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // brief delay for realism
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden selection:bg-primary/10">
      
      {/* Background Soft Blobs & Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[50%] h-[50%] rounded-full bg-pastel-lavender/60 blur-[100px] opacity-90 animate-[pulse_9s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-pastel-blue/60 blur-[100px] opacity-90 animate-[pulse_12s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-[30%] right-[-10%] w-[30%] h-[50%] rounded-full bg-pastel-pink/50 blur-[120px] opacity-80 animate-[pulse_10s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pastel-mint/50 blur-[100px] opacity-80 animate-[pulse_8s_ease-in-out_infinite_alternate]" />
      </div>

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      {/* Faint Background Decorations */}
      <div className="absolute z-0 w-full h-full flex justify-between items-center px-32 opacity-100 pointer-events-none hidden lg:flex">
         <Brain className="w-64 h-64 text-purple-500/30 -rotate-12 animate-[pulse_10s_infinite]" />
         <Network className="w-64 h-64 text-purple-500/30 rotate-12 animate-[pulse_12s_infinite]" />
      </div>

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/30 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-3xl p-10 flex flex-col items-center">
          
          {/* Logo / Header */}
          <div className="w-16 h-16 rounded-2xl bg-pastel-blue/40 flex items-center justify-center border border-white/40 mb-6 shadow-sm">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2 text-center">
            Adaptive VR Therapy
          </h1>
          <p className="text-muted-foreground text-sm text-center mb-8 max-w-xs">
            Sign in to manage patient sessions and monitor real-time AI stress assessments.
          </p>

          <form onSubmit={handleLogin} className="space-y-6 w-full">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold ml-1">Email address</Label>
              <Input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="bg-white/30 border-white/40 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/60 shadow-sm rounded-xl h-12 transition-all"
                placeholder="clinician@hospital.org"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold ml-1">Password</Label>
              <Input
                type="password" value={pass} onChange={e => setPass(e.target.value)}
                className="bg-white/30 border-white/40 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/60 shadow-sm rounded-xl h-12 transition-all"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit" disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all shadow-[0px_8px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : (
                <span className="flex items-center gap-2 text-base">Sign In <ArrowRight className="w-4 h-4 ml-1" /></span>
              )}
            </Button>
          </form>

          <p className="text-muted-foreground/60 text-xs text-center mt-8">
            Demo Environment • Any credentials accepted
          </p>
        </div>
      </div>
    </div>
  );
}
