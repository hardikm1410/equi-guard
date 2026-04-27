"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-components";
import { FileText, Download, Eye, Calendar, ArrowRight, Shield, BarChart3, Plus, Loader2, HelpCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import AppTour from "@/components/AppTour";
import { REPORTS_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";
import ReactMarkdown from "react-markdown";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "custom">("audit");
  const router = useRouter();
  const [btnExpanded, setBtnExpanded] = useState(false);
  const [tourRun, setTourRun] = useState(false);
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/history`);
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/generate-report`, { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data.report);
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <AppTour steps={REPORTS_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />
      
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col rounded-2xl border-content/10 shadow-2xl">
            <div className="p-6 border-b border-content/[0.06] flex items-center justify-between bg-content/[0.02]">
              <h3 className="text-xl font-bold text-content">Fairness Audit Report</h3>
              <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-content/[0.08] rounded-xl transition-all">
                <X className="w-5 h-5 text-content/50" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="prose prose-invert max-w-none text-content/80 font-sans leading-relaxed">
                <ReactMarkdown>{selectedReport}</ReactMarkdown>
              </div>
            </div>
            <div className="p-6 border-t border-content/[0.06] flex justify-end gap-3 bg-content/[0.02]">
              <button 
                onClick={() => {
                  const blob = new Blob([selectedReport], { type: 'text/markdown' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'equiguard-report.md';
                  a.click();
                }}
                className="inline-flex items-center gap-2 bg-cta text-cta-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-cta/90 transition-all"
              >
                <Download className="w-4 h-4" /> Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tour-reports-header">
        <PageHeader 
          title="Reports" 
          description="Generate and download fairness audit reports using Gemini AI."
          action={
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setTourRun(true)}
                className="group p-2 rounded-2xl bg-content/[0.04] border border-content/[0.08] hover:bg-content/[0.08] transition-all hover:border-cta/30"
                title="Start Tour"
              >
                <HelpCircle className="w-5 h-5 text-content/40 group-hover:text-cta transition-colors" />
              </button>
              <button 
                onClick={handleGenerateReport}
                disabled={generating || reports.length === 0}
                onMouseEnter={() => setBtnExpanded(true)}
                onMouseLeave={() => setBtnExpanded(false)}
                className={`inline-flex items-center justify-center gap-2 bg-cta text-white text-md font-semibold h-[38px] rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cta shadow-lg shadow-content/[0.05] overflow-hidden ${btnExpanded ? "md:w-[200px] md:px-5 w-[38px]" : "w-[38px] px-0"} disabled:opacity-50`}
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 shrink-0" />}
                <span className={`hidden md:block whitespace-nowrap transition-all duration-300 ${btnExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 md:hidden"}`}>
                  {generating ? "Generating..." : "Generate Report"}
                </span>
              </button>
            </div>
          }
        />
      </div>
      
      <div className="flex items-center gap-1 mb-6 bg-content/[0.03] border border-content/[0.06] rounded-lg p-1 w-fit">
        {(["audit", "custom"] as const).map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-4 py-2 rounded-md text-md md:text-sm font-medium transition-all  ${activeTab === tab ? "bg-content/[0.1] text-content border border-content/[0.15]" : "text-content/40 hover:text-content/60"}`}
          >
            {tab === "audit" ? "Audit History" : "Custom Insights"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-content/20 mb-4" />
          <p className="text-content/40 font-medium">Loading history...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed">
          <FileText className="w-8 h-8 text-content/20 mb-4" />
          <h3 className="text-lg font-bold text-content mb-1">No analysis history</h3>
          <p className="text-content/40 text-center max-w-xs">Reports will be available here once you complete a fairness audit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="tour-report-list lg:col-span-3 space-y-3">
            <h3 className="text-[13px] md:text-xs font-medium text-content/30 uppercase tracking-widest mb-5">Previous Analyses</h3>
            {reports.map((report: any) => (
              <div key={report.id} className="glass-card rounded-xl p-5 flex items-center justify-between group hover:bg-content/[0.05] hover:border-content/[0.1] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-content/[0.06] flex items-center justify-center shrink-0">
                    {report.type.includes("Bias") ? <Shield className="w-4 h-4 text-content/60" /> : <BarChart3 className="w-4 h-4 text-content/50" />}
                  </div>
                  <div>
                    <h4 className="text-lg md:text-sm font-medium text-content/80">{report.filename}</h4>
                    <p className="text-md md:text-sm text-content/30 mt-0.5">{report.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1.5 text-md md:text-sm text-content/30"><Calendar className="w-3.5 h-3.5" />{report.timestamp}</div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={handleGenerateReport}
                      className="w-8 h-8 rounded-lg bg-content/[0.04] hover:bg-primary/[0.2] flex items-center justify-center transition-all"
                      title="Generate Report"
                    >
                      <FileText className="w-4 h-4 text-content/40 hover:text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="tour-export-options lg:col-span-2">
            <h3 className="text-[13px] md:text-xs font-medium text-content/30 uppercase tracking-widest mb-3">Analysis Summary</h3>
            {reports.length > 0 ? (
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="bg-content/[0.04] border-b border-content/[0.06] p-5">
                  <div className="flex items-center gap-2 mb-2"><Shield className="w-5 h-5 md:w-4 md:h-4 text-content/60" /><span className="text-[13px] md:text-[10px] font-medium text-content/50 uppercase tracking-wider">Latest Audit</span></div>
                  <h4 className="text-xl md:text-lg font-bold text-content">{reports[0].filename}</h4>
                  <p className="text-md md:text-sm text-content/30 mt-1">{reports[0].timestamp}</p>
                </div>
                <div className="p-5 space-y-4">
                  {Object.entries(reports[0].details).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex flex-col gap-2 py-3 border-b border-content/[0.04] last:border-0">
                      <span className="text-[13px] md:text-[11px] font-bold text-content/30 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                      <div className="text-md md:text-sm font-medium text-content/80">
                        {Array.isArray(value) ? (
                          <div className="space-y-1.5 mt-1">
                            {value.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-content/20 mt-2 shrink-0" />
                                <span>
                                  {typeof item === 'object' 
                                    ? (item.name ? `${item.name}: ${item.value || item.accuracy || item.severity}` : JSON.stringify(item))
                                    : <span className="inline-markdown"><ReactMarkdown>{item.toString()}</ReactMarkdown></span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span>{value?.toString() || "—"}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-content/[0.06] p-4 flex gap-2">
                  <button 
                    onClick={handleGenerateReport}
                    className="flex-1 inline-flex items-center justify-center gap-2 text-md md:text-sm font-medium text-content/70 bg-content/[0.08] hover:bg-content/[0.12] px-4 py-2.5 rounded-lg transition-all border border-content/[0.1]"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Generate Full Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-xl p-8 text-center border-dashed border-2">
                <p className="text-sm text-content/30">No analysis data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}