"use client";

import { PageHeader } from "@/components/page-components";
import { Search, Filter, ArrowRight, ArrowUpRight, Eye, Trash2, ChevronLeft, ChevronRight, Shield, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

import { HelpCircle, Loader2 } from "lucide-react";
import AppTour from "@/components/AppTour";
import { HISTORY_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tourRun, setTourRun] = useState(false);
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/history`);
        if (response.ok) {
          const result = await response.json();
          setData(result || []);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const filtered = data.filter((d) => d.filename?.toLowerCase().includes(search.toLowerCase()));

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 md:w-4 md:h-4 text-content/30" />
          <input type="text" placeholder="Search analyses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-content/[0.03] border border-content/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-md md:text-sm text-content/80 placeholder:text-content/20 focus:outline-none focus:border-content/30 focus:ring-2 focus:ring-content/10 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 text-md md:text-xs text-content/50 bg-content/[0.04] border border-content/[0.08] px-3 py-2 rounded-lg hover:bg-content/[0.06] transition-all"><Filter className="w-4 h-4 md:w-3 md:h-3" />All Datasets</button>
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
              <thead><tr className="border-b border-content/[0.06]">{["File Name", "Type", "Details", "Date", "Actions"].map((col) => (<th key={col} className="text-left text-[13px] md:text-[11px] font-medium text-content/40 uppercase tracking-wider px-5 py-4">{col}</th>))}</tr></thead>
              <tbody>{filtered.map((row, i) => (
                <tr key={i} className="border-b border-content/[0.04] last:border-0 hover:bg-content/[0.02] transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {row.type.includes("Bias") ? <Shield className="w-4 h-4 text-content/40" /> : <BarChart3 className="w-4 h-4 text-content/40" />}
                      <span className="text-md md:text-sm font-medium text-content/80">{row.filename}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap"><span className="text-[13px] md:text-xs text-content/40 bg-content/[0.04] border border-content/[0.06] px-2 py-0.5 rounded-full">{row.type}</span></td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      {Object.entries(row.details).slice(0, 3).map(([k, v]: [string, any]) => (
                        <span key={k} className="text-[10px] text-content/30 lowercase italic truncate max-w-[150px]">
                          {k.replace('_', ' ')}: {Array.isArray(v) ? `${v.length} items` : (typeof v === 'object' ? '...' : v.toString())}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-md md:text-sm text-content/40">{row.timestamp}</td>
                  <td className="px-5 py-4 whitespace-nowrap"><div className="flex gap-1">
                    <button className="w-8 h-8 rounded-lg bg-content/[0.04] hover:bg-content/[0.08] flex items-center justify-center transition-all"><Eye className="w-5 h-5 md:w-3.5 md:h-3.5 text-content/40" /></button>
                    <button className="w-8 h-8 rounded-lg bg-content/[0.04] hover:bg-content/[0.08] flex items-center justify-center transition-all group"><Trash2 className="w-5 h-5 md:w-3.5 md:h-3.5 text-content/40 group-hover:text-content/70" /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="border-t border-content/[0.06] px-5 py-3 flex items-center justify-between">
            <p className="text-[13px] md:text-xs text-content/30">Showing {filtered.length} of {data.length} analyses</p>
          </div>
        </div>
      )}
    </div>
  );
}

