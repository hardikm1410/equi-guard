"use client";

import { PageHeader } from "@/components/page-components";
import { useState, useRef, useEffect } from "react";
import { Send, User, Plus, MessageSquare, Bot, Trash2, Loader2, Clock, HelpCircle } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { db } from "@/lib/firebase";
import { useSearchParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import AppTour from "@/components/AppTour";
import { AI_ASSISTANT_STEPS } from "@/lib/tour-steps";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";
import ReactMarkdown from "react-markdown";


type Message = { role: "user" | "assistant"; content: string };
type ChatSession = { id: string; title: string; date: string; messages: Message[]; updatedAt?: any };

const suggestedPrompts = ["Why is my model biased against females?", "How can I improve fairness scores?", "Explain the 4/5 rule for disparate impact", "What data do I need for bias detection?"];
const initialMessages: Message[] = [
  { role: "assistant", content: "Hello! I'm your EquiGuard AI Assistant. How can I help you analyze bias or improve fairness in your models today?" },
];

export default function AIAssistantPage() {
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [tourRun, setTourRun] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDemoUser = user?.email === DEMO_USER_EMAIL;

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
  const messages = activeSession?.messages || initialMessages;

  // Handle "new" parameter
  useEffect(() => {
    if (searchParams.get("new") === "true" && !isLoading) {
      createNewChat();
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      router.replace(`/ai-assistant?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, isLoading]);

  // Load sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) {
        setSessions([{ id: "temp", title: "Guest Session", date: "Today", messages: initialMessages }]);
        setActiveId("temp");
        setIsLoading(false);
        return;
      }

      try {
        if (isDemoUser) {
          const demoSession: ChatSession = {
            id: "demo-session",
            title: "Hiring Bias Review",
            date: "Today",
            messages: [
              { role: "assistant", content: "Hello! I've analyzed your hiring data. I found that gender and university prestige are causing significant selection disparities. Would you like to see how synthetic data can help balance this?" },
              { role: "user", content: "Yes, please explain the gender bias impact." },
              { role: "assistant", content: "The gender bias impact is currently 0.72. This means male candidates are significantly favored. By generating 4,000 synthetic female candidate records with similar skill profiles, we can reduce this bias to 0.24." }
            ]
          };
          setSessions([demoSession]);
          setActiveId("demo-session");
          setIsLoading(false);
          return;
        }

        const q = query(
          collection(db, "chats"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const loadedSessions: ChatSession[] = [];
        querySnapshot.forEach((doc) => {
          loadedSessions.push({ id: doc.id, ...doc.data() } as ChatSession);
        });

        if (loadedSessions.length === 0) {
          createNewChat();
        } else {
          setSessions(loadedSessions);
          setActiveId(loadedSessions[0].id);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, [user, isDemoUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = async () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      date: "Just now",
      messages: initialMessages
    };

    if (user && !isDemoUser) {
      try {
        await setDoc(doc(db, "chats", newId), {
          userId: user.uid,
          title: newSession.title,
          messages: newSession.messages,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error creating chat in Firestore:", error);
      }
    }

    setSessions(prev => [newSession, ...prev]);
    setActiveId(newId);
  };

  const deleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    if (newSessions.length === 0) {
      createNewChat();
      return;
    }
    setSessions(newSessions);
    if (activeId === id) setActiveId(newSessions[0].id);

    if (user && id !== "temp" && !isDemoUser) {
      try {
        await deleteDoc(doc(db, "chats", id));
      } catch (error) {
        console.error("Error deleting chat from Firestore:", error);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeId) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    const currentTitle = activeSession.title === "New Conversation" ? input.slice(0, 30) + (input.length > 30 ? "..." : "") : activeSession.title;

    setSessions(prev => prev.map(s => s.id === activeId ? {
      ...s,
      messages: updatedMessages,
      title: currentTitle
    } : s));

    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const finalMessages = [...updatedMessages, data];

      setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages: finalMessages } : s));

      if (user && activeId !== "temp" && !isDemoUser) {
        await updateDoc(doc(db, "chats", activeId), {
          messages: finalMessages,
          title: currentTitle,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error calling AI assistant:", error);
      setSessions(prev => prev.map(s => s.id === activeId ? {
        ...s,
        messages: [...updatedMessages, { role: "assistant", content: "I'm sorry, I encountered an error. Please ensure the backend is running." }]
      } : s));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] md:h-[calc(100vh-140px)] flex flex-col max-w-7xl mx-auto">
      <AppTour steps={AI_ASSISTANT_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />
      <div className="tour-assistant-header mb-6">
        <PageHeader
          title="EquiGuard AI"
          description="Ask questions about your data, bias detection results, and fairness improvements."
          action={
            <button
              onClick={() => setTourRun(true)}
              className="group p-2 rounded-2xl bg-content/[0.04] border border-content/[0.08] hover:bg-content/[0.08] transition-all hover:border-cta/30"
              title="Start Tour"
            >
              <HelpCircle className="w-5 h-5 text-content/40 group-hover:text-cta transition-colors" />
            </button>
          }
        />
      </div>

      <div className="flex-1 flex overflow-hidden glass-card rounded-2xl border-content/[0.08]">
        {/* Sidebar */}
        <div className={`tour-assistant-history w-80 border-r border-content/[0.08] bg-content/[0.02] flex flex-col transition-all duration-300 md:relative absolute inset-y-0 left-0 z-40 md:translate-x-0 ${showMobileHistory ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-4 border-b border-content/[0.04]">
            <button
              onClick={() => { createNewChat(); setShowMobileHistory(false); }}
              className="w-full flex items-center justify-center gap-2 bg-content/[0.05] hover:bg-content/[0.08] border border-content/[0.1] text-content/70 rounded-xl py-2.5 text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> New Conversation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-content/20" /></div>
            ) : sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => { setActiveId(session.id); setShowMobileHistory(false); }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeId === session.id ? "bg-content/[0.08] border border-content/[0.1]" : "hover:bg-content/[0.04] border border-transparent"}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${activeId === session.id ? "text-content/60" : "text-content/30"}`} />
                  <div className="overflow-hidden">
                    <p className={`text-sm font-medium truncate ${activeId === session.id ? "text-content" : "text-content/60"}`}>{session.title}</p>
                    <p className="text-[10px] text-content/30 mt-0.5">{session.date}</p>
                  </div>
                </div>
                <button onClick={(e) => deleteChat(e, session.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-content/[0.1] rounded-lg transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-content/30 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-content/[0.04]">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-cta/10 flex items-center justify-center border border-cta/20">
                <User className="w-4 h-4 text-cta" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-content truncate">{user?.displayName || (isDemoUser ? "Demo User" : "Guest")}</p>
                <p className="text-[10px] text-content/30 truncate">{user?.email || "No email"}</p>
              </div>
            </div>
          </div>
        </div>

        {showMobileHistory && <div className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-30" onClick={() => setShowMobileHistory(false)} />}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background relative">
          <div className="md:hidden flex items-center p-4 border-b border-content/[0.04]">
            <button onClick={() => setShowMobileHistory(true)} className="p-2 -ml-2 rounded-lg hover:bg-content/[0.04]">
              <MessageSquare className="w-5 h-5 text-content/50" />
            </button>
            <h4 className="flex-1 text-sm font-bold text-center truncate px-4">{activeSession?.title}</h4>
          </div>

          <div className="tour-assistant-chat flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-4 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${msg.role === "assistant" ? "bg-cta/10 border-cta/20 text-cta" : "bg-content/[0.05] border-content/[0.1] text-content/60"}`}>
                  {msg.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={`flex flex-col max-w-[80%] ${msg.role === "assistant" ? "items-start" : "items-end"}`}>
                  <div className={`rounded-2xl px-5 py-3 text-sm leading-relaxed ${msg.role === "assistant" ? "bg-content/[0.03] text-content/80 border border-content/[0.06] rounded-tl-none shadow-sm" : "bg-cta text-white font-medium rounded-tr-none shadow-lg shadow-cta/10"}`}>
                    {msg.role === "assistant" ? (
                      <div className="inline-markdown">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <span className="text-[10px] text-content/20 mt-2 px-1">{msg.role === "assistant" ? "EquiGuard AI" : "You"} · Just now</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-8 h-8 rounded-xl bg-cta/10 border border-cta/20 text-cta flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-content/[0.03] border border-content/[0.06] rounded-2xl rounded-tl-none px-5 py-3 shadow-sm">
                  <div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-content/20 animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-content/20 animate-bounce [animation-delay:0.2s]" /><span className="w-1.5 h-1.5 rounded-full bg-content/20 animate-bounce [animation-delay:0.4s]" /></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 border-t border-content/[0.06] bg-content/[0.01]">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button key={prompt} onClick={() => setInput(prompt)} className="text-[11px] md:text-xs font-medium text-content/40 hover:text-content/70 bg-content/[0.04] hover:bg-content/[0.06] border border-content/[0.08] px-3 py-1.5 rounded-full transition-all">{prompt}</button>
                ))}
              </div>
              <div className="tour-assistant-input relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask anything about model fairness..."
                  className="w-full bg-content/[0.03] hover:bg-content/[0.05] border border-content/[0.1] focus:border-cta/30 rounded-2xl pl-5 pr-14 py-4 text-sm text-content/80 placeholder:text-content/30 transition-all focus:outline-none focus:ring-4 focus:ring-cta/8 focus:animate-text-gradient"
                />
                <button onClick={sendMessage} disabled={!input.trim() || isTyping} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-cta text-white flex items-center justify-center shadow-lg shadow-cta/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all">
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-content/20 text-center flex items-center justify-center gap-1.5"><Clock className="w-3 h-3" /> EquiGuard AI responses are generated by Gemini 1.5 Flash.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
