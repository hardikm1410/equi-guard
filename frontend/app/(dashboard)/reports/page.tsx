"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/page-components";
import { FileText, Download, Eye, Calendar, ArrowRight, Shield, BarChart3, Plus } from "lucide-react";
import { useState } from "react";

import { HelpCircle, Loader2 } from "lucide-react";
import AppTour from "@/components/AppTour";
import { REPORTS_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";
import { useEffect } from "react";

const auditReports = [
  { id: 1, name: "Fairness Audit Report", description: "Comprehensive bias analysis and fairness metrics", date: "11 May 2026", type: "Audit", status: "ready" },
  { id: 2, name: "Model Evaluation Report", description: "Model performance and accuracy breakdown", date: "11 May 2026", type: "Evaluation", status: "ready" },
  { id: 3, name: "Data Synthesis Report", description: "Synthetic data generation and impact analysis", date: "10 May 2026", type: "Synthesis", status: "ready" },
  { id: 4, name: "Compliance Summary", description: "Regulatory compliance and recommendations", date: "10 May 2026", type: "Compliance", status: "generating" },
];
const reportPreview = {
  title: "Fairness Audit Report", subtitle: "EquiGuard · Generated 11 May 2026",
  sections: [{ label: "Bias Score", value: "0.72 → 0.24", color: "text-content/80" }, { label: "Disparity Reduction", value: "66.7%", color: "text-content/70" }, { label: "Records Analyzed", value: "10,000", color: "text-content/70" }, { label: "Synthetic Added", value: "4,000", color: "text-content/60" }],
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "custom">("audit");
  const router = useRouter();
  const [btnExpanded, setBtnExpanded] = useState(false);
  const [tourRun, setTourRun] = useState(false);
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      if (isDemo) {
        setData({
          auditReports,
          reportPreview
        });
        setLoading(false);
      } else {
        const fetchData = async () => {
          setLoading(true);
          // Simulate fetching reports (can be tied to /logs or similar)
          setTimeout(() => {
            setData({ auditReports: [], reportPreview: null });
            setLoading(false);
          }, 1000);
        };
        fetchData();
      }
    }
  }, [isDemo, user]);

  return (
    <div className="max-w-7xl mx-auto">
      <AppTour steps={REPORTS_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />
      <div className="tour-reports-header">
        <PageHeader 
          title="Reports" 
          description="Generate and download fairness audit reports."
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
                title="Share Audit"
                className="tour-share-audit group p-2 rounded-2xl bg-content/[0.04] border border-content/[0.08] hover:bg-content/[0.08] transition-all hover:border-primary/30"
              >
                <Plus className="w-5 h-5 text-content/40 group-hover:text-primary transition-colors" />
              </button>
              <button 
                onMouseEnter={() => setBtnExpanded(true)}
                onMouseLeave={() => setBtnExpanded(false)}
                className={`inline-flex items-center justify-center gap-2 bg-cta text-white text-md font-semibold h-[38px] rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cta shadow-lg shadow-content/[0.05] overflow-hidden ${btnExpanded ? "w-[200px] px-5" : "w-[38px] px-0"}`}
              >
                <FileText className="w-5 h-5 shrink-0" />
                <span className={`whitespace-nowrap transition-all duration-300 ${btnExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden"}`}>Generate Report</span>
              </button>
            </div>
          }
        />
      </div>
      
      <div className="flex items-center gap-1 mb-6 bg-content/[0.03] border border-content/[0.06] rounded-lg p-1 w-fit">
        {(["audit", "custom"] as const).map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all  ${activeTab === tab ? "bg-content/[0.1] text-content border border-content/[0.15]" : "text-content/40 hover:text-content/60"}`}>{tab === "audit" ? "Audit Reports" : "Custom Reports"}</button>))}
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-content/20 mb-4" />
          <p className="text-content/40 font-medium">Loading reports...</p>
        </div>
      ) : !data || data.auditReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed">
          <FileText className="w-8 h-8 text-content/20 mb-4" />
          <h3 className="text-lg font-bold text-content mb-1">No reports generated</h3>
          <p className="text-content/40 text-center max-w-xs">Reports will be available here once you complete a fairness audit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="tour-report-list lg:col-span-3 space-y-3">
            <h3 className="text-xs font-medium text-content/30 uppercase tracking-widest mb-5">Available Reports</h3>
            {data.auditReports.map((report: any) => (
              <div key={report.id} className="glass-card rounded-xl p-5 flex items-center justify-between group hover:bg-content/[0.05] hover:border-content/[0.1] transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-content/[0.06] flex items-center justify-center shrink-0">
                    {report.type === "Audit" ? <Shield className="w-5 h-5 text-content/60" /> : report.type === "Evaluation" ? <BarChart3 className="w-5 h-5 text-content/50" /> : <FileText className="w-5 h-5 text-content/50" />}
                  </div>
                  <div><h4 className="text-md font-medium text-content/80">{report.name}</h4><p className="text-sm text-content/30 mt-0.5">{report.description}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1.5 text-sm text-content/30"><Calendar className="w-3 h-3" />{report.date}</div>
                    <span className={`text-[11px] font-medium uppercase tracking-wider mt-0.5 inline-block ${report.status === "ready" ? "text-content/70" : "text-content/40"}`}>{report.status === "ready" ? "Ready" : "Generating..."}</span>
                  </div>
                  <div className="flex gap-1">
                    <button className="w-10 h-10 rounded-lg bg-content/[0.04] hover:bg-primary/[0.2]  flex items-center justify-center transition-all"><Eye className="w-5 h-5 text-content/40 hover:text-primary" /></button>
                    <button className="w-10 h-10 rounded-lg bg-content/[0.04] hover:bg-primary/[0.2] flex items-center justify-center transition-all"><Download className="w-5 h-5 text-content/40 hover:text-primary" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="tour-export-options lg:col-span-2">
            <h3 className="text-xs font-medium text-content/30 uppercase tracking-widest mb-3">Report Preview</h3>
            {data.reportPreview ? (
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="bg-content/[0.04] border-b border-content/[0.06] p-5">
                  <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-content/60" /><span className="text-[10px] font-medium text-content/50 uppercase tracking-wider">EquiGuard Report</span></div>
                  <h4 className="text-lg font-bold text-content">{data.reportPreview.title}</h4>
                  <p className="text-sm text-content/30 mt-1">{data.reportPreview.subtitle}</p>
                </div>
                <div className="p-5 space-y-4">{data.reportPreview.sections.map((section: any) => (<div key={section.label} className="flex items-center justify-between py-2 border-b border-content/[0.04] last:border-0"><span className="text-sm text-content/40">{section.label}</span><span className={`text-sm font-semibold ${section.color}`}>{section.value}</span></div>))}</div>
                <div className="border-t border-content/[0.06] p-4 flex gap-2">
                  <button className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium text-content/50 bg-content/[0.04] hover:bg-content/[0.06] px-4 py-2.5 rounded-lg transition-all"><Eye className="w-3.5 h-3.5" />View Full Preview</button>
                  <button className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium text-content/70 bg-content/[0.08] hover:bg-content/[0.12] px-4 py-2.5 rounded-lg transition-all border border-content/[0.1]"><Download className="w-3.5 h-3.5" />Download PDF</button>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-xl p-8 text-center border-dashed border-2">
                <p className="text-sm text-content/30">Select a report to see preview</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
