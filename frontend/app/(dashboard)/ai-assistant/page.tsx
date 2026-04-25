"use client";

import { PageHeader } from "@/components/page-components";
import { useState, useRef, useEffect } from "react";
import { Send, User, Plus, MessageSquare, Bot, Trash2, Loader2, Clock } from "lucide-react";
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

import { HelpCircle } from "lucide-react";
import AppTour from "@/components/AppTour";
import { AI_ASSISTANT_STEPS } from "@/lib/tour-steps";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";

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
      // Remove the parameter from URL without refreshing
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      router.replace(`/ai-assistant?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, isLoading]);

  // Load sessions from Firestore
  useEffect(() => {
    if (!user) {
      setSessions([{ id: "temp", title: "Guest Session", date: "Today", messages: initialMessages }]);
      setActiveId("temp");
      setIsLoading(false);
      return;
    }



    const fetchSessions = async () => {
      try {
        if (user.email === DEMO_USER_EMAIL) {
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
          const data = doc.data();
          loadedSessions.push({
            id: doc.id,
            title: data.title,
            date: data.updatedAt?.toDate()?.toLocaleDateString() || "Today",
            messages: data.messages,
            updatedAt: data.updatedAt
          });
        });

        // Sort in memory to avoid needing a Firestore composite index
        loadedSessions.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis() || 0;
          const timeB = b.updatedAt?.toMillis() || 0;
          return timeB - timeA;
        });


        if (loadedSessions.length > 0) {
          setSessions(loadedSessions);
          setActiveId(loadedSessions[0].id);
        } else {
          // Create a default first chat if none exist
          const newId = Date.now().toString();
          const firstSession: ChatSession = { id: newId, title: "Bias Analysis", date: "Today", messages: initialMessages };

          if (user.uid !== "temp") {
            await setDoc(doc(db, "chats", newId), {
              userId: user.uid,
              title: firstSession.title,
              messages: firstSession.messages,
              updatedAt: serverTimestamp()
            });
          }
          setSessions([firstSession]);
          setActiveId(newId);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [user]);


  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const createNewChat = async () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      date: "Just now",
      messages: initialMessages
    };

    if (user) {
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

    // Optimistic UI update
    const newSessions = sessions.filter(s => s.id !== id);
    if (newSessions.length === 0) {
      // Don't allow zero chats if possible, or handle it
      createNewChat();
      return;
    }

    setSessions(newSessions);
    if (activeId === id) {
      setActiveId(newSessions[0].id);
    }

    if (user && id !== "temp") {
      try {
        await deleteDoc(doc(db, "chats", id));
      } catch (error) {
        console.error("Error deleting chat from Firestore:", error);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeId || isDemoUser) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    const currentTitle = activeSession.title === "New Conversation" ? input.slice(0, 30) + (input.length > 30 ? "..." : "") : activeSession.title;

    // Update local state immediately
    setSessions(prev => prev.map(s => s.id === activeId ? {
      ...s,
      messages: updatedMessages,
      title: currentTitle
    } : s));

    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const finalMessages = [...updatedMessages, data];

      setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages: finalMessages } : s));

      // Sync with Firestore
      if (user && activeId !== "temp") {
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="w-10 h-10 text-content/20 animate-spin mb-4" />
        <p className="text-sm text-content/40 font-medium">Loading your conversations...</p>
      </div>
    );
  }
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)]">
      <AppTour steps={AI_ASSISTANT_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />
      <div className="tour-ai-header">
        <PageHeader
          title="EquiGuard Assistant"
          description="Get answers about bias, fairness, and your data."
          action={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTourRun(true)}
                className="group p-2 rounded-2xl bg-content/[0.04] border border-content/[0.08] hover:bg-content/[0.08] transition-all hover:border-cta/30"
                title="Start Tour"
              >
                <HelpCircle className="w-5 h-5 text-content/40 group-hover:text-cta transition-colors" />
              </button>
              <div className="flex items-center gap-2 lg:hidden">
                <button onClick={createNewChat} className="flex items-center justify-center w-9 h-9 text-content/70 bg-content/[0.04] border border-content/[0.08] rounded-lg hover:bg-content/[0.06] transition-all" title="New Chat">
                  <Plus className="w-4 h-4" />
                </button>
                <button onClick={() => setShowMobileHistory(!showMobileHistory)} className={`flex items-center justify-center w-9 h-9 text-content/70 bg-content/[0.04] border border-content/[0.08] rounded-lg hover:bg-content/[0.06] transition-all ${showMobileHistory ? 'bg-content/[0.08]' : ''}`} title={showMobileHistory ? "Hide History" : "View History"}>
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>
          }
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-[calc(100%-5rem)] flex-1">
        <div className={`tour-ai-capabilities ${showMobileHistory ? "flex" : "hidden"} lg:flex flex-col glass-card rounded-xl overflow-hidden max-h-60 lg:max-h-none shrink-0 mb-4 lg:mb-0`}>
          <div className="p-4 border-b border-content/[0.06]">
            <button
              onClick={createNewChat}
              disabled={isDemoUser}
              className={`w-full flex items-center justify-center gap-2 text-xs font-medium px-4 py-2.5 rounded-lg transition-all ${isDemoUser ? "opacity-50 cursor-not-allowed bg-content/[0.03] text-content/20" : "text-content/70 bg-content/[0.06] hover:bg-content/[0.1] border border-content/[0.1]"}`}
            >
              <Plus className="w-3.5 h-3.5" />New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-[10px] font-medium text-content/20 uppercase tracking-widest px-3 mb-2">Chat History</p>
            {sessions.map((chat) => (
              <button key={chat.id} onClick={() => { setActiveId(chat.id); setShowMobileHistory(false); }} className={`group w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${chat.id === activeId ? "bg-content/[0.08] text-content border border-content/[0.12]" : "text-content/40 hover:text-content/60 hover:bg-content/[0.04]"}`}>
                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium truncate">{chat.title}</p>
                  <p className="text-[10px] text-content/20 mt-0.5">{chat.date}</p>
                </div>
                {!isDemoUser && (
                  <div onClick={(e) => deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-content/[0.1] rounded transition-all">
                    <Trash2 className="w-4 h-4 text-content/30 hover:text-content/60" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="tour-chat-interface lg:col-span-3 glass-card rounded-xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 md:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (<div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-content/[0.08] flex items-center justify-center shrink-0 mt-1"><Bot className="w-3 h-3 md:w-4 md:h-4 text-content/60" /></div>)}
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 md:px-5 md:py-3.5 text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-content/[0.08] text-content/90 border border-content/[0.12]" : "bg-content/[0.03] text-content/70 border border-content/[0.06]"}`}>
                  {msg.content.split(/(\*\*.*?\*\*)/g).map((part, k) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={k} className="text-content font-bold">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={k}>{part}</span>;
                  })}
                </div>

                {msg.role === "user" && (<div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-content/[0.08] flex items-center justify-center shrink-0 mt-1"><User className="w-3 h-3 md:w-4 md:h-4 text-content/60" /></div>)}
              </div>
            ))}
            {isTyping && (<div className="flex gap-2 md:gap-3"><div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-content/[0.08] flex items-center justify-center shrink-0"><Bot className="w-3 h-3 md:w-4 md:h-4 text-content/60" /></div><div className="bg-content/[0.03] border border-content/[0.06] rounded-2xl px-4 py-3 md:px-5 md:py-4"><div className="flex gap-1.5"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-content/20 animate-pulse" /><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-content/20 animate-pulse [animation-delay:200ms]" /><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-content/20 animate-pulse [animation-delay:400ms]" /></div></div></div>)}
            <div ref={messagesEndRef} />
          </div>
          {!isDemoUser && messages.length <= 1 && (<div className="tour-suggested-questions px-6 pb-2 flex flex-wrap gap-2">{suggestedPrompts.map((prompt) => (<button key={prompt} onClick={() => setInput(prompt)} className="text-xs text-content/40 bg-content/[0.03] border border-content/[0.06] px-3 py-1.5 rounded-full hover:bg-content/[0.06] hover:text-content/60 transition-all">{prompt}</button>))}</div>)}
          <div className="border-t border-content/[0.06] p-4 relative">
            {isDemoUser && (
              <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex items-center justify-center p-4">
                <button
                  onClick={handleSignOut}
                  className="bg-content text-background px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl shadow-content/20 hover:scale-105 transition-transform"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Sign up to use EquiGuard Assistant
                </button>
              </div>
            )}
            <div className={`flex items-center gap-3 ${isDemoUser ? "opacity-20 pointer-events-none" : ""}`}>
              <input
                type="text"
                placeholder="Ask anything about bias or fairness..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-content/[0.03] border border-content/[0.08] rounded-xl px-4 py-3 text-sm text-content/80 focus:outline-none focus:border-content/30 focus:ring-2 focus:ring-content/10 transition-all dynamic-placeholder"
                disabled={isDemoUser}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isDemoUser}
                className="w-10 h-10 rounded-xl disabled:bg-content/[0.06] flex items-center justify-center transition-all shadow-lg shadow-content/[0.05] disabled:shadow-none shrink-0 dynamic-send-button"
              >
                <Send className="w-4 h-4 text-cta-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


