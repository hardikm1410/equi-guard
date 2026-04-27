"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-components";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  ArrowRight,
  Shield,
  BarChart3,
  Plus,
  Sparkles,
  HelpCircle,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import AppTour from "@/components/AppTour";
import { REPORTS_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { report } from "process";

const demoAuditReports = [
  { id: 1, name: "Fairness Audit Report", description: "Comprehensive bias analysis and fairness metrics", date: "11 May 2026", type: "Audit", status: "READY" },
  { id: 2, name: "Model Evaluation Report", description: "Model performance and accuracy breakdown", date: "11 May 2026", type: "Evaluation", status: "READY" },
  { id: 3, name: "Data Synthesis Report", description: "Synthetic data generation and impact analysis", date: "10 May 2026", type: "Synthesis", status: "READY" },
  { id: 4, name: "Compliance Summary", description: "Regulatory compliance and recommendations", date: "10 May 2026", type: "Compliance", status: "GENERATING..." },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "custom">("audit");
  const router = useRouter();
  const [tourRun, setTourRun] = useState(false);
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiReportMd, setAiReportMd] = useState<string | null>(null);
  const [btnExpanded, setBtnExpanded] = useState(false);

  const handleGenerateAIReport = async (report: any) => {
    if (!report) return;
    setGeneratingAI(true);
    try {
      const response = await fetch(`${API_URL}/generate-ai-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: report.name,
          type: report.type,
          metrics: report.metrics,
          verdict: report.verdict
        })
      });
      const resData = await response.json();
      if (resData.report_md) {
        setAiReportMd(resData.report_md);
      }
    } catch (error) {
      console.error("AI Report generation failed:", error);
      alert("Failed to generate AI report");
    } finally {
      setGeneratingAI(false);
    }
  };

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        if (isDemo) {
          setData({
            auditReports: demoAuditReports,
          });
          setSelectedReport(demoAuditReports[0]);
          setLoading(false);
          return;
        }

        try {
          if (db) {
            const q = query(
              collection(db, "history"),
              where("userId", "==", user.uid),
              orderBy("timestamp", "desc")
            );
            const querySnapshot = await getDocs(q);
            const reports: any[] = [];
            querySnapshot.forEach((doc) => {
              const d = doc.data();
              reports.push({
                id: doc.id,
                name: d.name.includes('.') ? d.name.split('.')[0] : d.name,
                description: `Comprehensive bias analysis and fairness metrics`,
                date: d.date,
                type: d.type === "Model Evaluation" ? "Evaluation" : "Audit",
                status: "READY",
                metrics: d.metrics,
                verdict: d.verdict
              });
            });
            setData({ auditReports: reports });
            if (reports.length > 0) setSelectedReport(reports[0]);
          }
        } catch (error) {
          console.error("Failed to fetch reports:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isDemo, user]);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <AppTour steps={REPORTS_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />

      {aiReportMd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-content/10 flex items-center justify-between bg-content/[0.02]">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI-Generated Audit Report
              </h3>
              <button onClick={() => setAiReportMd(null)} className="p-1.5 hover:bg-content/10 rounded-full transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-xs text-content leading-relaxed">
              <div className="whitespace-pre-wrap">{aiReportMd}</div>
            </div>
            <div className="p-4 border-t border-content/10 bg-content/[0.02] flex gap-3">
              <button onClick={() => downloadMarkdown(aiReportMd, selectedReport?.name || "Audit_Report")} className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                <Download className="w-3.5 h-8" /> Download (.md)
              </button>
              <button onClick={() => window.print()} className="flex-1 bg-content/10 text-content py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                <Eye className="w-3.5 h-8" /> Print PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-content mb-1">Reports</h1>
          <p className="text-xs text-content/40">Generate and download fairness audit reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTourRun(true)} className="p-2 rounded-full bg-content/[0.04] border border-content/[0.08] text-content/40 hover:bg-content/[0.08] transition-all"><HelpCircle className="w-4 h-4" /></button>
          <button className="p-2 rounded-full bg-content/[0.04] border border-content/[0.08] text-content/40 hover:bg-content/[0.08] transition-all"><Plus className="w-4 h-4" /></button>
          <button
            onClick={() => {
              if (selectedReport) {
                handleGenerateAIReport(selectedReport);
              } else {
                router.push("/model-evaluation");
              }
            }}
            onMouseEnter={() => setBtnExpanded(true)}
            onMouseLeave={() => setBtnExpanded(false)}
            className={`inline-flex items-center justify-center gap-2 bg-cta text-white text-md font-semibold h-[38px] rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cta shadow-lg shadow-content/[0.05] overflow-hidden ${btnExpanded ? "md:w-[200px] md:px-5 w-[38px]" : "w-[38px] px-0"}`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className={`hidden md:block whitespace-nowrap transition-all duration-300 ${btnExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 md:hidden"}`}>Generate Report</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-8 bg-content/[0.04] rounded-xl p-1 w-fit">
        {(["audit", "custom"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === tab ? "bg-content/[0.1] text-content" : "text-content/30 hover:text-content/50"}`}
          >
            {tab === "audit" ? "Audit Reports" : "Custom Reports"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 space-y-8">
          <h3 className="text-[10px] font-black text-content/20 uppercase tracking-[0.2em] mb-4">Available Reports</h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
            </div>
          ) : !data || data.auditReports.length === 0 ? (
            <div className="p-10 border border-dashed border-content/10 rounded-2xl text-center">
              <p className="text-xs text-content/30 uppercase tracking-tighter">No reports found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.auditReports.map((report: any) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`group glass-card rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all duration-300 ${selectedReport?.id === report.id ? "bg-content/[0.04] border-content/20" : "hover:bg-content/[0.02]"}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-content/[0.06] flex items-center justify-center shrink-0">
                      {report.type === "Audit" ? <Shield className="w-5 h-5 text-content/30" /> : <BarChart3 className="w-5 h-5 text-content/30" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-content/80 mb-0.5 tracking-tight">{report.name}</h4>
                      <p className="text-[10px] text-content/30 font-medium">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-content/20 mb-1">
                        <Calendar className="w-3 h-3" />
                        {report.date}
                      </div>
                      <span className="text-[10px] font-black text-content/40 tracking-wider uppercase">{report.status}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedReport(report); handleGenerateAIReport(report); }}
                        className="p-2.5 rounded-xl bg-content/[0.04] hover:bg-content/[0.1] transition-all"
                      >
                        <Eye className="w-4 h-4 text-content/30" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedReport(report); handleGenerateAIReport(report); }}
                        className="p-2.5 rounded-xl bg-content/[0.04] hover:bg-content/[0.1] transition-all"
                      >
                        <Download className="w-4 h-4 text-content/30" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-[10px] font-black text-content/20 uppercase tracking-[0.2em] mb-4">Report Preview</h3>
          {selectedReport ? (
            <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-8 border-b border-content/5 bg-content/[0.01]">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-content/20" />
                  <span className="text-[10px] font-black text-content/20 uppercase tracking-[0.2em]">EquiGuard Report</span>
                </div>
                <h4 className="text-xl font-bold text-content mb-1 tracking-tight">{selectedReport.name}</h4>
                <p className="text-xs text-content/30 font-medium">EquiGuard · Generated {selectedReport.date}</p>
              </div>

              <div className="p-8 space-y-6">
                {[
                  { label: "Bias Score", value: selectedReport.metrics?.fairness_score ? `0.72 → ${(selectedReport.metrics.fairness_score / 100).toFixed(2)}` : "0.72 → 0.24" },
                  { label: "Disparity Reduction", value: selectedReport.metrics?.improvement ? `${selectedReport.metrics.improvement}%` : "66.7%" },
                  { label: "Records Analyzed", value: "10,000" },
                  { label: "Synthetic Added", value: "4,000" }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <span className="text-content/30 font-medium">{stat.label}</span>
                    <span className="text-content/80 font-bold tabular-nums">{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-8 pt-0 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleGenerateAIReport(selectedReport)}
                  disabled={generatingAI}
                  className="bg-content/[0.04] text-content/60 py-3 rounded-2xl text-xs font-bold border border-content/5 hover:bg-content/[0.08] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  View Preview
                </button>
                <button
                  onClick={() => handleGenerateAIReport(selectedReport)}
                  disabled={generatingAI}
                  className="bg-content/[0.1] text-content/80 py-3 rounded-2xl text-xs font-bold border border-content/10 hover:bg-content/[0.15] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 border border-dashed border-content/10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px]">
              <FileText className="w-10 h-10 text-content/5 mb-6" />
              <p className="text-[10px] text-content/20 font-black uppercase tracking-widest">Select report to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
