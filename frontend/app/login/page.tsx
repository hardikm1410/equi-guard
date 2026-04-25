"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { Shield, Mail, Lock, User, ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Suspense } from "react";
import { DEMO_USER_EMAIL } from "@/lib/constants";

function LoginForm() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();

  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear reset success message after 5 seconds
  useEffect(() => {
    if (resetSent) {
      const timer = setTimeout(() => setResetSent(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [resetSent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isForgotPassword) {
        if (!email.trim()) { setError("Please enter your email"); setLoading(false); return; }
        await resetPassword(email);
        setResetSent(true);
      } else if (isSignUp) {
        if (!displayName.trim()) { setError("Please enter your name"); setLoading(false); return; }
        await signUp(email, password, displayName);
        router.push("/dashboard");
      } else {
        await signIn(email, password);
        router.push("/dashboard");
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") setError("Invalid email or password.");
      else if (code === "auth/email-already-in-use") setError("An account with this email already exists.");
      else if (code === "auth/weak-password") setError("Password must be at least 6 characters.");
      else if (code === "auth/invalid-email") setError("Please enter a valid email address.");
      else setError(err?.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-content/40" />
      </div>
    );
  }

  if (user) return null;

  return (
    <main className="relative min-h-screen flex bg-background overflow-hidden">
      {/* Back Button */}
      <Link href="/" className="absolute top-6 right-6 lg:top-8 lg:right-8 z-50 flex items-center gap-2 text-sm font-medium text-content/60 hover:text-content bg-background/50 hover:bg-content/5 px-4 py-2 rounded-full backdrop-blur-md transition-all border border-content/5 hover:scale-105">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-20 blur-[150px]" style={{ background: `radial-gradient(circle, rgba(${cr},0.12) 0%, transparent 70%)` }} />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px]" style={{ background: `radial-gradient(circle, rgba(${cr},0.1) 0%, transparent 70%)` }} />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `linear-gradient(rgba(${cr},0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(${cr},0.1) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
      </div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 xl:p-16">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cta flex items-center justify-center shadow-lg shadow-content/[0.05]"><Shield className="w-5 h-5 text-cta-foreground" /></div>
          <span className="text-lg font-semibold tracking-tight text-content">EquiGuard</span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-4xl font-bold text-content tracking-tight leading-[1.1] mb-4">
            {isSignUp ? "Join the movement for fairer AI." : "Welcome back to EquiGuard."}
          </h2>
          <p className="text-base text-content/40 leading-relaxed">
            {isSignUp
              ? "Create your account and start detecting bias in AI hiring systems with shadow-twin analysis."
              : "Sign in to continue monitoring and improving fairness across your hiring pipeline."}
          </p>

          {/* Testimonial-style card */}
          <div className="mt-10 glass-card rounded-2xl p-6">
            <p className="text-sm text-content/50 leading-relaxed italic mb-4">&ldquo;EquiGuard helped us reduce gender bias in our hiring model by 67%. It&apos;s now an integral part of our ML pipeline.&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-content/[0.08] flex items-center justify-center text-xs font-bold text-content/60">MP</div>
              <div><p className="text-xs font-medium text-content/70">Mahesh Patel</p><p className="text-[11px] text-content/30">Head of AI Ethics, TechCorp</p></div>
            </div>
          </div>
        </div>

        <p className="text-xs text-content/20">© {new Date().getFullYear()} EquiGuard. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cta flex items-center justify-center"><Shield className="w-5 h-5 text-cta-foreground" /></div>
              <span className="text-lg font-semibold tracking-tight text-content">EquiGuard</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-content tracking-tight mb-2">
              {isForgotPassword ? "Reset your password" : (isSignUp ? "Create your account" : "Sign in to your account")}
            </h1>
            <p className="text-sm text-content/40">
              {isForgotPassword ? (
                <button onClick={() => { setIsForgotPassword(false); setError(""); }} className="text-content/70 hover:text-content underline-offset-4 underline transition-colors">Back to sign in</button>
              ) : (
                <>
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                  <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }} className="text-content/70 hover:text-content underline-offset-4 underline transition-colors">{isSignUp ? "Sign in" : "Create one"}</button>
                </>
              )}
            </p>
          </div>

          {/* Google sign in */}
          {!isForgotPassword && (
            <>
              <button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-content/[0.1] bg-content/[0.03] hover:bg-content/[0.06] text-sm font-medium text-content/70 transition-all duration-200 disabled:opacity-50 mb-3">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-content/[0.06]" />
                <span className="text-xs text-content/25 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-content/[0.06]" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-content/50 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content/25" />
                  <input id="name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="w-full bg-content/[0.03] border border-content/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-content placeholder:text-content/20 focus:outline-none focus:border-content/20 focus:ring-2 focus:ring-content/[0.06] transition-all" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-content/50 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content/25" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full bg-content/[0.03] border border-content/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-content placeholder:text-content/20 focus:outline-none focus:border-content/20 focus:ring-2 focus:ring-content/[0.06] transition-all" />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                  <label htmlFor="password" className="block text-xs font-medium text-content/50 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content/25" />
                  <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isSignUp ? "Min. 6 characters" : "Enter your password"} required={!isForgotPassword} minLength={6} className="w-full bg-content/[0.03] border border-content/[0.08] rounded-xl pl-10 pr-12 py-3 text-sm text-content placeholder:text-content/20 focus:outline-none focus:border-content/20 focus:ring-2 focus:ring-content/[0.06] transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content/25 hover:text-content/50 transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <div className="flex items-right justify-end mt-1.5">
                  {!isSignUp && (
                    <button type="button" onClick={() => { setIsForgotPassword(true); setError(""); setResetSent(false); }} className="text-[11px] font-medium text-content/40 hover:text-content/70 transition-colors">Forgot password?</button>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/[0.06] border border-red-500/[0.1] rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resetSent && (
              <div className="flex items-start gap-2 text-sm text-green-400 bg-green-500/[0.06] border border-green-500/[0.1] rounded-xl px-4 py-3">
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Password reset link sent to your email. Please check your inbox.</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full group inline-flex items-center justify-center gap-2.5 bg-cta text-cta-foreground font-semibold text-sm px-6 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-content/[0.05] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : <>{isForgotPassword ? "Send Reset Link" : (isSignUp ? "Create Account" : "Sign In")}<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          <p className="text-[11px] text-content/20 text-center mt-6 leading-relaxed">
            By continuing, you agree to EquiGuard&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 animate-spin text-content/40" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
