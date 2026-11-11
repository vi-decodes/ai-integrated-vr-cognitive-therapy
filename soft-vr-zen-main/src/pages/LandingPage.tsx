import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Activity, HeartPulse, Sparkles, ArrowRight, Mic, Shield } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center overflow-hidden relative selection:bg-primary/10">
      
      {/* Background Soft Blobs & Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[40%] h-[50%] rounded-full bg-pastel-blue/15 blur-[100px] opacity-80" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-pastel-lavender/10 blur-[100px] opacity-80" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-pastel-mint/15 blur-[100px] opacity-70" />
      </div>

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text & CTA */}
          <div className="space-y-8 max-w-2xl relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-pastel-blue/60 shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                AI-Assisted Cognitive Therapy
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold text-foreground tracking-tight leading-[1.1]">
              Adaptive <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary/80 to-primary">VR Therapy</span>
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              An intelligent multimodal platform for real-time stress assessment. Seamlessly combining physiological signals, speech analysis, and AI-powered decision making to assist clinicians and adapt virtual environments.
            </p>

            <div className="pt-4 flex items-center gap-4">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-lg transition-all shadow-[0px_8px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1 flex items-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Right Column: Rich Glassmorphism Composition */}
          <div className="hidden lg:flex justify-center relative w-full h-[600px] items-center">
            
            {/* Faint radial gradient behind illustration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03)_0%,transparent_60%)] rounded-full pointer-events-none z-0" />

            {/* Central Main Card */}
            <div className="relative w-80 h-96 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between z-20">
              <div className="flex justify-between items-center">
                <div className="w-12 h-12 bg-pastel-lavender/40 rounded-2xl flex items-center justify-center border border-white/50">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <span className="px-3 py-1.5 bg-white/80 rounded-full text-xs font-semibold text-primary shadow-sm border border-white/60 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 [animation-duration:3s]"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live Sync
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col items-center relative pt-2">
                  <div className="w-full flex justify-between items-center mb-4 absolute top-0 left-0">
                    <span className="text-sm font-semibold text-foreground">Stress Level</span>
                  </div>
                  
                  {/* Half-circle SVG Meter */}
                  <div className="relative w-40 h-24 mt-6 flex justify-center items-end">
                    <svg className="absolute top-0 left-0 w-full h-[5rem] overflow-visible" viewBox="0 0 100 50">
                      {/* Background Track */}
                      <path 
                        d="M 10,50 A 40,40 0 0,1 90,50" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                        className="text-border"
                      />
                      {/* Progress (Yellow) - ~40% filled */}
                      <path 
                        d="M 10,50 A 40,40 0 0,1 90,50" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                        pathLength="100"
                        strokeDasharray="100" 
                        strokeDashoffset="60" 
                        className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] animate-[pulse_4s_ease-in-out_infinite]"
                      />
                    </svg>
                    <div className="flex flex-col items-center pb-1 z-10">
                      <span className="text-xl font-bold text-foreground">Mild</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white/60 rounded-xl border border-white/60 space-y-1 shadow-sm">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Environment</div>
                  <div className="text-sm font-bold text-foreground">Public Speaking</div>
                </div>
              </div>
            </div>

            {/* Floating Card 1: Physio */}
            <div className="absolute -left-12 top-20 w-56 p-4 bg-white/70 bg-gradient-to-br from-white/80 to-pastel-pink/10 backdrop-blur-md border border-white/60 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.03)] z-30 animate-float-slow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pastel-pink/30 rounded-xl flex items-center justify-center border border-white/50">
                  <HeartPulse className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Physiological</div>
                  <div className="text-xs text-muted-foreground">HR • HRV • EDA</div>
                </div>
              </div>
            </div>

            {/* Floating Card 2: Audio */}
            <div className="absolute -right-8 top-32 w-48 p-4 bg-white/70 bg-gradient-to-br from-white/80 to-pastel-blue/10 backdrop-blur-md border border-white/60 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.03)] z-10 animate-float-slower">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pastel-blue/30 rounded-xl flex items-center justify-center border border-white/50">
                  <Mic className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Speech</div>
                  <div className="text-xs text-muted-foreground">Analysis</div>
                </div>
              </div>
            </div>

            {/* Floating Card 3: Adaptive */}
            <div className="absolute right-4 bottom-24 w-52 p-4 bg-white/70 bg-gradient-to-br from-white/80 to-pastel-mint/10 backdrop-blur-md border border-white/60 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.03)] z-30 animate-float-slowest">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pastel-mint/30 rounded-xl flex items-center justify-center border border-white/50">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Adaptive VR</div>
                  <div className="text-xs text-muted-foreground">Auto-regulation</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
