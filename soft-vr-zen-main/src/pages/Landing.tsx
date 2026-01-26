import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, Activity, BarChart3, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pastel-lavender flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">VR Therapy</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/70 hover:text-foreground transition">Features</a>
            <a href="#how-it-works" className="text-foreground/70 hover:text-foreground transition">How it Works</a>
            <a href="#contact" className="text-foreground/70 hover:text-foreground transition">Contact</a>
          </nav>
          <Link to="/dashboard">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              Therapist Login
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Next-Gen VR Therapy with Real-Time AI Monitoring
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Adaptive virtual reality exposure therapy with intelligent monitoring and personalized treatment paths for better patient outcomes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="rounded-full border-border">
                  Login
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full bg-pastel-lavender text-foreground hover:bg-pastel-lavender/80">
                  For Therapists
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-pastel-lavender/30 rounded-full blur-3xl"></div>
            <Card className="relative bg-card border-0 shadow-[0px_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-pastel-blue rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                    <Activity className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground/70">Heart Rate</p>
                    <p className="text-2xl font-bold text-foreground">72 BPM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-pastel-mint rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground/70">Stress Level</p>
                    <p className="text-2xl font-bold text-foreground">Low</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-pastel-yellow rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                    <Shield className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground/70">Session Progress</p>
                    <p className="text-2xl font-bold text-foreground">78%</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Powerful Features for Better Outcomes</h2>
          <p className="text-xl text-muted-foreground">Everything you need to deliver effective VR therapy</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: "Adaptive VR Scenarios", 
              description: "AI-powered exposure modules that adapt to patient responses in real-time",
              color: "bg-pastel-blue"
            },
            { 
              title: "Real-Time Monitoring", 
              description: "Track heart rate, stress levels, and behavioral responses during sessions",
              color: "bg-pastel-mint"
            },
            { 
              title: "Progress Analytics", 
              description: "Comprehensive reports and insights for data-driven treatment decisions",
              color: "bg-pastel-yellow"
            },
            { 
              title: "Therapist Dashboard", 
              description: "Intuitive interface for managing patients, sessions, and treatment plans",
              color: "bg-pastel-lavender"
            }
          ].map((feature, index) => (
            <Card key={index} className={`${feature.color} border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6 hover:shadow-[0px_8px_25px_rgba(0,0,0,0.12)] transition-shadow`}>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-foreground/70">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="bg-primary text-primary-foreground border-0 shadow-[0px_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Practice?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">Join leading therapists using VR technology for better patient outcomes</p>
          <Link to="/dashboard">
            <Button size="lg" variant="secondary" className="rounded-full px-8">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pastel-lavender flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-foreground">VR Therapy</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 VR Therapy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
