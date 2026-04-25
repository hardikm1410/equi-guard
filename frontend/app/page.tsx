"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { useTheme } from "@/components/theme-provider";
import {
  Shield, ArrowRight, Sparkles, Eye, BarChart3, Zap,
  ShieldCheck, Lock, ChevronRight, Globe, Layers, Brain, Mail, Send,
  Menu, X
} from "lucide-react";

const features = [
  { icon: Eye, title: "Shadow-Twin Analysis", description: "Compare automated decisions against demographic-neutral profiles to uncover hidden scoring disparities." },
  { icon: Brain, title: "AI-Powered Detection", description: "Deep learning models analyze patterns across critical decision paths to identify systemic bias." },
  { icon: BarChart3, title: "Comprehensive Reports", description: "Generate detailed fairness audits for loans, hiring, and healthcare models with actionable insights." },
  { icon: Zap, title: "Real-Time Monitoring", description: "Continuous monitoring of automated systems with instant alerts when fairness thresholds are breached." },
  { icon: Layers, title: "Data Synthesis", description: "Generate balanced, synthetic datasets to retrain fairer models for any decision-making use case." },
  { icon: Lock, title: "Privacy-First", description: "All analysis runs locally. Sensitive decision data is never stored, shared, or transmitted to third parties." },
];

const stats = [
  { value: "88.2%", label: "Detection Accuracy" },
  { value: "74.7%", label: "Avg. Disparity Reduction" },
  { value: "<5s", label: "Analysis Speed" },
  { value: "100+", label: "Resumes Processed" },
];

const steps = [
  { number: "01", title: "Upload Dataset", description: "Import your hiring data, candidate resumes, or evaluation scores in any standard format." },
  { number: "02", title: "Detect Bias", description: "Our AI runs shadow-twin analysis, statistical parity checks, and multi-dimensional fairness audits." },
  { number: "03", title: "Take Action", description: "Get clear, actionable recommendations with synthesized data to retrain fairer models." },
];

const team = [
  { name: "Manav Sheth", role: "Backend Developer", initials: "MS" },
  { name: "Roshani Chaudhari", role: "Data Manager", initials: "RC" },
  { name: "Rudra Suthar", role: "Frontend Developer", initials: "RS" },
  { name: "Hardik Maniyar", role: "Frontend Developer", initials: "HM" },
];

export default function LandingPage() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [isExploring, setIsExploring] = useState(false);
  const [contactStatus, setContactStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus("submitting");
    const form = e.target as HTMLFormElement;

    try {
      await fetch("https://formsubmit.co/ajax/hardik.baps.ahd@gmail.com", {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      setContactStatus("success");
      form.reset();
      setTimeout(() => setContactStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to send email:", error);
      setContactStatus("idle"); // or handle error state
    }
  };

  const handleExplore = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isExploring) return;
    setIsExploring(true);
    try {
      await signIn("demo@equiguard.com", "password123");
      router.push("/dashboard");
    } catch (err: any) {
      try {
        await signUp("demo@equiguard.com", "password123", "Demo User");
        router.push("/dashboard");
      } catch (innerErr) {
        console.error("Demo login failed:", innerErr);
        setIsExploring(false);
      }
    }
  };

  return (

    <main className="relative bg-background">
      {/* Violet Abyss Background - FIXED to cover entire page */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "var(--hero-gradient)",
        }}
      />

      <div className="min-h-screen w-full relative z-10">







        {/* Navbar */}
        <nav className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-12 bg-background/60 backdrop-blur-xl border-b border-content/[0.05]">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cta flex items-center justify-center shadow-lg shadow-cta/20"><Shield className="w-5 h-5 text-cta-foreground" /></div>
              <span className="text-xl font-bold tracking-tight text-content">EquiGuard</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-content/60 hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-content/60 hover:text-primary transition-colors">How It Works</a>
              <a href="#stats" className="text-sm font-medium text-content/60 hover:text-primary transition-colors">Impact</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={handleExplore} disabled={isExploring} className="text-sm font-semibold text-content/80 hover:text-content transition-colors px-4 py-2 disabled:opacity-50">
                {isExploring ? "Loading..." : "Explore"}
              </button>
              <Link href="/login?mode=signup" className="inline-flex items-center gap-1.5 text-sm font-bold bg-cta text-cta-foreground px-6 py-2.5 rounded-2xl hover:bg-cta/90 transition-all shadow-xl shadow-cta/20 hover:-translate-y-0.5">Get Started<ArrowRight className="w-4 h-4" /></Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden items-center gap-4">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-content/60 hover:text-content transition-colors">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 w-full bg-background/95 backdrop-blur-2xl border-b border-content/[0.05] animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col p-6 gap-6">
                <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold text-content/80 hover:text-primary transition-colors">Features</a>
                <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold text-content/80 hover:text-primary transition-colors">How It Works</a>
                <a href="#stats" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold text-content/80 hover:text-primary transition-colors">Impact</a>
                <div className="h-px bg-content/[0.05] w-full" />
                <button onClick={(e) => { handleExplore(e); setIsMenuOpen(false); }} disabled={isExploring} className="flex items-center justify-between text-lg font-semibold text-content/80">
                  Explore Demo <ChevronRight className="w-5 h-5" />
                </button>
                <Link href="/login?mode=signup" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 w-full bg-cta text-cta-foreground font-bold py-4 rounded-2xl shadow-xl shadow-cta/20">
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Hero */}
        <section className="relative z-10 px-6 lg:px-12 pt-10 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8 relative">

              {/* Left Column: Hero visual mockup */}
              <div className="flex-1 w-full relative z-10 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                {/* Background decorative blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="glass-card rounded-2xl p-1 max-w-2xl mx-auto relative z-10 shadow-2xl shadow-black/10 transform lg:scale-90 hover:scale-105 lg:hover:scale-95 transition-all duration-700 cursor-pointer group">
                  <div className="rounded-xl bg-background border border-content/[0.08] p-6 sm:p-8 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-content/[0.08]" /><div className="w-3 h-3 rounded-full bg-content/[0.08]" /><div className="w-3 h-3 rounded-full bg-content/[0.08]" /></div>
                      <div className="flex-1 h-7 rounded-lg bg-content/[0.04] flex items-center px-3"><span className="text-[11px] text-content/40 font-mono">equiguard.ai/fairness-report</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[{ label: "Decision Bias", value: "0.12", status: "Low" }, { label: "Parity Gap", value: "88.2%", status: "Resolved" }, { label: "Audit Status", value: "Compliant", status: "✓" }].map((item) => (
                        <div key={item.label} className="rounded-xl bg-content/[0.03] border border-content/[0.06] p-4 text-center">
                          <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-content/40 mb-2">{item.label}</p>
                          <p className="text-xs md:text-xl font-bold text-content/80 mb-1">{item.value}</p>
                          <span className="text-[8px] md:text-[10px] text-content/50 bg-content/[0.05] px-2 py-0.5 rounded-full">{item.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">{[...Array(7)].map((_, i) => (<div key={i} className="flex-1 flex flex-col justify-end h-16 gap-1"><div className="w-full rounded-sm bg-content/[0.08]" style={{ height: `${30 + Math.sin(i) * 20 + 20}%` }} /><div className="w-full rounded-sm bg-primary/60" style={{ height: `${50 + Math.cos(i) * 15 + 15}%` }} /></div>))}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Text */}
              <div className="flex-1 w-full relative z-20 text-center lg:text-left lg:pl-16">
                <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-8 animate-fade-in-up uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5" />Unbiased AI Decision Platform</div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-content mb-8 leading-[1.05] animate-fade-in-up">Fair Decisions<br /><span className="text-primary">With Unbiased AI</span></h1>
                <p className="text-lg sm:text-xl text-content/60 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-12 animate-fade-in-up font-medium" style={{ animationDelay: "100ms" }}>EquiGuard detects and eliminates bias in automated systems. We ensure every decision is based on merit, not flawed data.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                  <Link href="/login?mode=signup" className="group inline-flex items-center gap-2.5 bg-cta text-cta-foreground font-bold text-md px-8 py-4 rounded-2xl transition-all duration-300 shadow-2xl shadow-cta/0 hover:-translate-y-1 hover:shadow-cta/10">Start Fairness Audit<ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" /></Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Stats ribbon */}
        <section id="stats" className="relative z-10 py-24 bg-content/[0.02] border-y border-content/[0.05]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {stats.map((stat, i) => (
                <div key={stat.label} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <p className="text-4xl sm:text-5xl font-black text-content mb-3 tracking-tighter">{stat.value}</p>
                  <p className="text-sm font-bold text-content/30 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative z-10 py-32 lg:py-48 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6 uppercase tracking-widest"><Globe className="w-3.5 h-3.5" />Cross-Industry Auditing</div>
              <h2 className="text-[25px] sm:text-5xl font-black text-content tracking-tight mb-6">Everything You Need for<br /><span className="text-primary">Unbiased Decisions</span></h2>
              <p className="text-xl text-content/40 max-w-2xl mx-auto font-medium">Inspect datasets and software models for hidden discrimination across finance, HR, and medical systems.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={feature.title} className="bg-content/[0.02] hover:bg-content/[0.04] border border-content/[0.05] hover:border-content/10 rounded-[2rem] p-10 transition-all duration-500 animate-fade-in-up group cursor-default" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-content mb-4">{feature.title}</h3>
                  <p className="text-md text-content/40 leading-relaxed font-medium">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Feature Highlight Illustration */}
            <div className="mt-30 lg:mt-40 flex flex-col lg:flex-row items-center gap-20 animate-fade-in-up">
              <div className="relative z-10 w-full flex-1 mb-2 flex items-center justify-center group cursor-pointer">
                <img
                  src="/illustrations/synthesis.png"
                  alt="Synthesis Illustration"
                  className="w-full max-h-80 object-contain drop-shadow-2xl opacity-100 group-hover:scale-110 transition-all duration-700"
                />
              </div>
              <div className="flex-1 space-y-8">
                <h2 className="text-4xl sm:text-5xl font-black text-content leading-none">Deep Dive into<br /><span className="text-primary">Statistical Fairness</span></h2>
                <p className="text-xl text-content/40 leading-relaxed font-medium">Our system doesn't just look at the surface. It analyzes intersectional bias across multiple protected groups simultaneously.</p>
                <ul className="space-y-5">
                  {[
                    "Multi-dimensional parity checks",
                    "Intersectional bias analysis",
                    "Actionable mitigation strategies"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-xl font-bold text-content/70">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-primary" /></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="relative z-10 py-25 lg:py-30 px-6 lg:px-12 bg-content/[0.01] border-t border-content/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6 uppercase tracking-widest"><Zap className="w-3.5 h-3.5" />Simple Workflow</div>
              <h2 className="text-4xl sm:text-6xl font-black text-content tracking-tight mb-4">Three Steps to<br /><span className="text-primary">Unbiased Systems</span></h2>
            </div>
            <div className="grid grid-cols-1  md:grid-cols-3 gap-10 mb-32">
              {steps.map((step, i) => (
                <div key={step.number} className="relative bg-background border border-content/[0.05] rounded-[2rem] p-12 text-center animate-fade-in-up group hover:border-primary/50 transition-all duration-800" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="text-7xl font-black text-content/[0.08] mb-6 group-hover:text-primary/30 transition-colors">{step.number}</div>
                  <h3 className="text-2xl font-bold text-content mb-4">{step.title}</h3>
                  <p className="text-md text-content/40 leading-relaxed font-medium">{step.description}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-5 -translate-y-1/2 z-10">
                      <ChevronRight className="w-10 h-10 text-content/10" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Synthesis Illustration */}
            <div className="flex flex-col  md:mt-48 lg:flex-row-reverse items-center gap-20 animate-fade-in-up">

              <div className="relative z-10 w-full flex-1 mb-2 flex items-center justify-center group cursor-pointer">
                <img
                  src="/illustrations/synthesis.png"
                  alt="Synthesis Illustration"
                  className="w-full max-h-80 object-contain drop-shadow-2xl opacity-100 group-hover:scale-110 transition-all duration-700"
                />
              </div>
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <h2 className="text-[25px] sm:text-5xl font-black text-content leading-none">Closing the Loop with<br /><span className="text-primary">Synthetic Data</span></h2>
                <p className="text-xl text-content/40 leading-relaxed font-medium">Once bias is detected, EquiGuard helps you fix it. We generate balanced, high-fidelity synthetic data to retrain your models.</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-4">
                  {["Fair Training", "Privacy Preserving", "High Fidelity"].map((tag) => (
                    <span key={tag} className=" px-4 py-2 md:px-6 md:py-2.5 rounded-full bg-primary/10 border border-primary/20 text-xs md:text-sm font-bold text-primary uppercase tracking-widest">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-5 py-20 lg:py-30 px-4 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card rounded-[3rem] p-8 sm:p-24 relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-[3rem] bg-primary/10 flex items-center justify-center mx-auto mb-10"><ShieldCheck className="w-10 h-10 text-primary" /></div>
                <h2 className="text-[25px] sm:text-4xl font-black tracking-tight md:mb-2 text-content">Ready to Build?</h2>
                <h2 className="text-[23px] sm:text-5xl font-black tracking-tight mb-8 text-primary">Fair & Bias-Free Systems</h2>
                <p className="text-md md:text-xl text-content/40 max-w-xl mx-auto mb-6 md:mb-12 font-medium leading-relaxed ">Join organizations using EquiGuard to audit, detect, and mitigate bias before their systems impact real people.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Link href="/login?mode=signup" className="group inline-flex items-center gap-3 bg-white/80 text-primary font-black text-md md:text-xl px-5 py-3 md:px-10 md:py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-primary/20">Create Free Account<ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></Link>
                  <Link href="/login" className="text-sm md:text-lg font-bold text-content/60 hover:text-content transition-colors">Already have an account? Sign in →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="relative z-10 md:pt-10 pb-0 bg-background">

          <div className="bg-background py-16 px-4 sm:p-12 lg:p-20 flex flex-col lg:flex-row gap-16 items-center overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-background to-transparent pointer-events-none"></div>

            {/* Left Column: Form */}
            <div className="flex-1 w-full space-y-8 relative z-10 mb-10 md:mb-0">
              <div>
                <h2 className="text-[25px] sm:text-5xl font-black text-content tracking-tight mb-4">Contact Us</h2>
                <p className="text-lg text-content/80 font-medium">
                  Interested in EquiGuard for your organization? We'd love to discuss how we can help you build fairer systems.
                </p>
              </div>
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <div>
                  <input type="text" name="Name" placeholder="Your Name" className="w-full bg-content/10 border border-content/20 rounded-xl px-6 py-4 text-content placeholder:text-content/60 focus:outline-none focus:border-primary focus:bg-content/20 transition-all" required disabled={contactStatus !== "idle"} />
                </div>
                <div>
                  <input type="email" name="Email" placeholder="Email Address" className="w-full bg-content/10 border border-content/20 rounded-xl px-6 py-4 text-content placeholder:text-content/60 focus:outline-none focus:border-primary focus:bg-content/20 transition-all" required disabled={contactStatus !== "idle"} />
                </div>
                <div>
                  <textarea name="Message" placeholder="How can we help?" rows={4} className="w-full bg-content/10 border border-content/20 rounded-xl px-6 py-4 text-content placeholder:text-content/60 focus:outline-none focus:border-primary focus:bg-content/20 transition-all resize-none" required disabled={contactStatus !== "idle"}></textarea>
                </div>
                <button type="submit" disabled={contactStatus !== "idle"} className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-black text-lg px-10 py-4 rounded-full flex items-center justify-center gap-3 transition-all duration-300 shadow-xl mt-4 hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed">
                  {contactStatus === "idle" && <><Send className="w-5 h-5 mr-1" /> Send Message</>}
                  {contactStatus === "submitting" && "Sending..."}
                  {contactStatus === "success" && "Message Sent!"}
                </button>
              </form>
            </div>

            {/* Right Column: Team & Illustration */}
            <div className="flex-1 w-full relative z-10  md:flex flex-col">
              <div className="h-full rounded-3xl    flex flex-col items-center justify-between relative overflow-hidden group">
                <div className="absolute inset-0"></div>

                <div className="relative z-10 w-full flex-1 mb-10 flex items-center justify-center">
                  <img
                    src="/illustrations/synthesis.png"
                    alt="Synthesis Illustration"
                    className="w-full max-h-80 object-contain drop-shadow-2xl opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                </div>
                <div className="relative z-10 w-full mb-12 ">
                  <h3 className="text-[11px] font-semibold text-content/60 mb-8 uppercase tracking-[0.2em] text-center">Built & Maintained By</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {team.map((member, i) => (
                      <div key={i} className="  p-2 flex flex-col items-center text-center">

                        <p className="text-content font-semibold text-lg mb-1">{member.name}</p>
                        <p className="text-content/50 text-[10px] uppercase tracking-wider font-medium">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="relative z-10 w-full flex items-center justify-center gap-6 mt-2 mb-0">
                  <a href="#" className="w-15 h-15 rounded-full bg-content/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center text-content/60 transition-all duration-300 hover:scale-110">
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  </a>
                  <a href="https://github.com/hardikm1410/equi-guard.git" target="_blank" rel="noopener noreferrer" className="w-15 h-15 rounded-full bg-content/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center text-content/60 transition-all duration-300 hover:scale-110">
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                  </a>
                  <a href="#" className="w-15 h-15 rounded-full bg-content/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center text-content/60 transition-all duration-300 hover:scale-110">
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                  </a>
                  <a href="#" className="w-15 h-15 rounded-full bg-content/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center text-content/60 transition-all duration-300 hover:scale-110">
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="none" className="w-6 h-6"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                  </a>
                </div>

              </div>
            </div>
          </div>

        </section>

        {/* Footer */}
        <footer className="relative z-10 py-10 px-6 lg:px-12">
          <div className=" mx-auto">

            <div className="pt-5 border-t border-content/[0.05] text-center">
              <p className="text-[9px] md:text-sm font-bold text-content/20 uppercase tracking-[0.2em]">© {new Date().getFullYear()} EquiGuard — Building a Fairer Future</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}