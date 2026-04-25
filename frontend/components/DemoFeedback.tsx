"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL } from "@/lib/constants";
import { MessageSquare, X, Star, Send, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function DemoFeedback() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isHovered, setIsHovered] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show for demo user
  const isDemoUser = user?.email === DEMO_USER_EMAIL;

  useEffect(() => {
    if (isDemoUser) {
      // Check if they've already submitted or closed it in this session
      const hasClosed = sessionStorage.getItem("feedback_closed");
      if (!hasClosed) {
        // Show after 10 seconds
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [isDemoUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Save to Firestore
      await addDoc(collection(db, "feedback"), {
        rating,
        feedback,
        userEmail: user?.email,
        userName: user?.displayName || "Demo User",
        timestamp: serverTimestamp(),
        page: window.location.pathname,
      });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem("feedback_closed", "true");
      }, 3000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Still show success to user for demo purposes or handle error
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("feedback_closed", "true");
  };

  if (!isDemoUser || (!isVisible && !isOpen)) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen ? (
        <div className="w-[320px] bg-sidebar border border-content/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-content/[0.06] flex items-center justify-between bg-content/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cta/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-cta" />
              </div>
              <h3 className="text-sm font-semibold text-content">Share Your Feedback</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-content/[0.05] rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-content/40" />
            </button>
          </div>

          <div className="p-5">
            {isSubmitted ? (
              <div className="py-8 flex flex-col items-center text-center animate-score-reveal">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <h4 className="text-sm font-semibold text-content mb-1">Thank You!</h4>
                <p className="text-xs text-content/50">Your feedback helps us make EquiGuard better for everyone.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-content/60 mb-3 text-center">How would you rate your experience?</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setIsHovered(star)}
                        onMouseLeave={() => setIsHovered(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star 
                          className={cn(
                            "w-6 h-6 transition-colors",
                            (isHovered >= star || rating >= star) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-content/20"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feedback" className="text-[11px] font-medium text-content/40 uppercase tracking-wider">Comments (Optional)</label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us what you think..."
                    className="w-full bg-content/[0.03] border border-content/[0.08] rounded-xl p-3 text-sm text-content placeholder:text-content/20 focus:outline-none focus:border-cta/30 focus:ring-1 focus:ring-cta/10 min-h-[100px] resize-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={rating === 0 || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-cta text-cta-foreground font-semibold text-sm py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:grayscale"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Sending..." : "Submit Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="bg-sidebar border border-content/[0.08] rounded-2xl p-4 shadow-xl animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-content mb-1">Enjoying the demo?</p>
                <p className="text-xs text-content/50 leading-relaxed">We&apos;d love to hear your thoughts on EquiGuard!</p>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => setIsOpen(true)}
                    className="text-[11px] font-bold bg-cta text-cta-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Sure!
                  </button>
                  <button 
                    onClick={handleClose}
                    className="text-[11px] font-bold text-content/40 hover:text-content/60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="text-content/20 hover:text-content/40 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-full bg-cta text-cta-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
