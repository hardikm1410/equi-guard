"use client";

import { PageHeader } from "@/components/page-components";
import { Search, Filter, ArrowRight, ArrowUpRight, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { HelpCircle, Loader2 } from "lucide-react";
import AppTour from "@/components/AppTour";
import { HISTORY_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";
import { useEffect } from "react";

const historyData = [
  { name: "Hiring_Data.csv", type: "Dataset + Model", scoreBefore: "0.72", scoreAfter: "0.24", status: "Improved", date: "11 May 2026" },
  { name: "Loan_Approval.csv", type: "Dataset", scoreBefore: "0.65", scoreAfter: "0.18", status: "Improved", date: "11 May 2026" },
  { name: "Admission_data.csv", type: "Dataset + Model", scoreBefore: "0.88", scoreAfter: "0.30", status: "Improved", date: "11 May 2026" },
  { name: "Healthcare_data.csv", type: "Dataset", scoreBefore: "0.45", scoreAfter: "0.21", status: "Reviewed", date: "12 May 2026" },
  { name: "Marketing_data.csv", type: "Dataset", scoreBefore: "0.32", scoreAfter: "0.12", status: "Improved", date: "12 May 2026" },
];

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tourRun, setTourRun] = useState(false);
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      if (isDemo) {
        setData(historyData);
        setLoading(false);
      } else {
        const fetchData = async () => {
          setLoading(true);
          try {
            const response = await fetch(`${API_URL}/logs`);
            if (response.ok) {
              const result = await response.json();
              // result.logs is expected to be an array of objects
              setData(result.logs || []);
            }
          } catch (error) {
            console.error("Failed to fetch history:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }
    }
  }, [isDemo, user]);

  const filtered = data.filter((d) => d.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto">
      <AppTour steps={HISTORY_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />
      <div className="tour-history-header">
        <PageHeader 
          title="History" 
          description="View and manage your previous analyses." 
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content/30" />
          <input type="text" placeholder="Search analyses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-content/[0.03] border border-content/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-sm text-content/80 placeholder:text-content/20 focus:outline-none focus:border-content/30 focus:ring-2 focus:ring-content/10 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 text-xs text-content/50 bg-content/[0.04] border border-content/[0.08] px-3 py-2 rounded-lg hover:bg-content/[0.06] transition-all"><Filter className="w-3 h-3" />All Datasets</button>
          <button className="inline-flex items-center gap-2 text-xs text-content/50 bg-content/[0.04] border border-content/[0.08] px-3 py-2 rounded-lg hover:bg-content/[0.06] transition-all">All Status</button>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-content/20 mb-4" />
          <p className="text-content/40 font-medium">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed">
          <Search className="w-8 h-8 text-content/20 mb-4" />
          <h3 className="text-lg font-bold text-content mb-1">No history found</h3>
          <p className="text-content/40 text-center max-w-xs">Your analysis history will appear here once you run your first audit.</p>
        </div>
      ) : (
        <div className="tour-history-table glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-content/[0.06]">{["Dataset Name", "Type", "Bias Score (Before → After)", "Status", "Date", "Actions"].map((col) => (<th key={col} className="text-left text-[11px] font-medium text-content/40 uppercase tracking-wider px-5 py-4">{col}</th>))}</tr></thead>
              <tbody>{filtered.map((row, i) => (
                <tr key={i} className="border-b border-content/[0.04] last:border-0 hover:bg-content/[0.02] transition-colors">
                  <td className="px-5 py-4"><span className="text-sm font-medium text-content/80">{row.name}</span></td>
                  <td className="px-5 py-4"><span className="text-xs text-content/40 bg-content/[0.04] border border-content/[0.06] px-2 py-0.5 rounded-full">{row.type}</span></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-content/40">{row.scoreBefore}</span><ArrowRight className="w-3 h-3 text-content/20" /><span className="text-sm font-semibold text-content/80">{row.scoreAfter}</span></div></td>
                  <td className="px-5 py-4"><span className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full ${row.status === "Improved" ? "text-content/70 bg-content/[0.08]" : "text-content/50 bg-content/[0.05]"}`}>{row.status}</span></td>
                  <td className="px-5 py-4 text-sm text-content/40">{row.date}</td>
                  <td className="px-5 py-4"><div className="flex gap-1">
                    <button className="w-7 h-7 rounded-lg bg-content/[0.04] hover:bg-content/[0.08] flex items-center justify-center transition-all"><Eye className="w-3.5 h-3.5 text-content/40" /></button>
                    <button className="w-7 h-7 rounded-lg bg-content/[0.04] hover:bg-content/[0.08] flex items-center justify-center transition-all"><ArrowUpRight className="w-3.5 h-3.5 text-content/40" /></button>
                    <button className="w-7 h-7 rounded-lg bg-content/[0.04] hover:bg-content/[0.08] flex items-center justify-center transition-all group"><Trash2 className="w-3.5 h-3.5 text-content/40 group-hover:text-content/70" /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="border-t border-content/[0.06] px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-content/30">Showing {filtered.length} of {data.length} analyses</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} className="w-8 h-8 rounded-lg bg-content/[0.04] hover:bg-content/[0.08] flex items-center justify-center transition-all"><ChevronLeft className="w-4 h-4 text-content/40" /></button>
              {[1, 2, 3].map((p) => (<button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${p === page ? "bg-content/[0.1] text-content border border-content/[0.15]" : "bg-content/[0.04] text-content/40 hover:bg-content/[0.08]"}`}>{p}</button>))}
              <button onClick={() => setPage(Math.min(3, page + 1))} className="w-8 h-8 rounded-lg bg-content/[0.04] hover:bg-content/[0.08] flex items-center justify-center transition-all"><ChevronRight className="w-4 h-4 text-content/40" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
