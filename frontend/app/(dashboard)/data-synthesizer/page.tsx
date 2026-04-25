"use client";

import { PageHeader } from "@/components/page-components";
import { Database, Sparkles, ArrowRight, Info, RefreshCw } from "lucide-react";

import { HelpCircle, Loader2 } from "lucide-react";
import AppTour from "@/components/AppTour";
import { DATA_SYNTHESIZER_STEPS } from "@/lib/tour-steps";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";

const currentImbalances = [
  { gender: "Male", count: "6,000", selectionRate: "68%", flag: false },
  { gender: "Female", count: "3,000", selectionRate: "45%", flag: true },
  { gender: "Non-Binary", count: "1,000", selectionRate: "38%", flag: true },
];
const targetDistribution = [
  { gender: "Male", count: "6,000", target: "" },
  { gender: "Female", count: "5,500", target: "Generate +2,500" },
  { gender: "Prefer not to say", count: "4,500", target: "Generate +3,500" },
];

export default function DataSynthesizerPage() {
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [tourRun, setTourRun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      if (isDemo) {
        setData({
          currentImbalances,
          targetDistribution,
          recommendation: "To achieve fairness, we recommend generating 6,000 synthetic records for the female group.",
          totalCurrent: "10,000",
          totalTarget: "16,000",
          points: ["Balance the dataset", "Maintain statistical properties & relationships", "Redistribute 4,000 synthetic fair records", "Generated 4,000 synthetic fair records", "Bias reduced by 66.7%"]
        });
        setLoading(false);
      } else {
        const fetchData = async () => {
          setLoading(true);
          // Simulate fetching synthesis recommendations
          setTimeout(() => {
            setData({
              currentImbalances: [],
              targetDistribution: [],
              recommendation: "Upload and analyze data to see synthesis recommendations.",
              totalCurrent: "0",
              totalTarget: "0",
              points: []
            });
            setLoading(false);
          }, 1000);
        };
        fetchData();
      }
    }
  }, [isDemo, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-content/20 mb-4" />
        <p className="text-content/40 font-medium">Analyzing data distribution...</p>
      </div>
    );
  }

  if (!data || (!isDemo && data.currentImbalances.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Data Synthesizer" description="Generate synthetic data to balance your dataset." />
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-content/[0.04] flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-content/20" />
          </div>
          <h3 className="text-xl font-bold text-content mb-2">No synthesis data</h3>
          <p className="text-content/40 mb-8 max-w-sm text-center">Run an audit first to identify imbalances and get synthesis recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AppTour steps={DATA_SYNTHESIZER_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />
      <div className="tour-synthesizer-header">
        <PageHeader 
          title="Data Synthesizer" 
          description="Generate synthetic data to balance your dataset." 
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-md font-semibold text-content mb-1">Current Imbalances (Before)</h3>
          <p className="text-sm text-content/30 mb-5">Demographic group distribution</p>
          <div className="overflow-hidden rounded-lg border border-content/[0.06]">
            <table className="w-full">
              <thead><tr className="border-b border-content/[0.06]"><th className="text-left text-[11px] font-medium text-content/40 uppercase tracking-wider px-4 py-3">Gender</th><th className="text-left text-[11px] font-medium text-content/40 uppercase tracking-wider px-4 py-3">Count</th><th className="text-left text-[11px] font-medium text-content/40 uppercase tracking-wider px-4 py-3">Selection Rate</th></tr></thead>
              <tbody>{data.currentImbalances.map((row: any) => (<tr key={row.gender} className="border-b border-content/[0.04] last:border-0"><td className="px-4 py-3 text-sm text-content/70">{row.gender}</td><td className="px-4 py-3 text-sm text-content/50">{row.count}</td><td className="px-4 py-3"><span className={`text-sm font-medium ${row.flag ? "text-content/80" : "text-content/50"}`}>{row.selectionRate}</span></td></tr>))}</tbody>
              <tfoot><tr className="border-t border-content/[0.06] bg-content/[0.02]"><td className="px-4 py-3 text-sm font-semibold text-content/60">Total</td><td className="px-4 py-3 text-sm font-semibold text-content/60">{data.totalCurrent}</td><td className="px-4 py-3"></td></tr></tfoot>
            </table>
          </div>
        </div>
        <div className="tour-synthesis-method tour-synthesis-config glass-card rounded-xl p-6 glow-white">
          <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-content/70" /><h3 className="text-md font-semibold text-content">AI Recommendation</h3></div>
          <p className="text-sm text-content/50 leading-relaxed mb-6">{data.recommendation}</p>
          <div className="space-y-3 mb-6">{data.points.map((item: string, i: number) => (<div key={i} className="flex items-start gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-content/50 mt-1.5 shrink-0" /><p className="text-sm text-content/40">{item}</p></div>))}</div>
          <button className="w-full inline-flex items-center justify-center gap-2 bg-cta text-cta-foreground text-sm font-semibold px-5 py-3 rounded-xl transition-all hover:bg-cta/90 shadow-lg shadow-content/[0.05]"><Database className="w-4 h-4" />Generate Synthetic Data<ArrowRight className="w-4 h-4" /></button>
        </div>
        <div className="tour-generation-preview glass-card rounded-xl p-6">
          <h3 className="text-md font-semibold text-content mb-1">Target Distribution (After)</h3>
          <p className="text-sm text-content/30 mb-5">Proposed distribution after synthesis</p>
          <div className="overflow-hidden rounded-lg border border-content/[0.06]">
            <table className="w-full">
              <thead><tr className="border-b border-content/[0.06]"><th className="text-left text-[11px] font-medium text-content/40 uppercase tracking-wider px-4 py-3">Gender</th><th className="text-left text-[11px] font-medium text-content/40 uppercase tracking-wider px-4 py-3">Target Count</th></tr></thead>
              <tbody>{data.targetDistribution.map((row: any) => (<tr key={row.gender} className="border-b border-content/[0.04] last:border-0"><td className="px-4 py-3 text-sm text-content/70">{row.gender}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-sm text-content/50">{row.count}</span>{row.target && (<span className="text-[10px] font-medium text-content/70 bg-content/[0.08] px-2 py-0.5 rounded-full">{row.target}</span>)}</div></td></tr>))}</tbody>
              <tfoot><tr className="border-t border-content/[0.06] bg-content/[0.02]"><td className="px-4 py-3 text-sm font-semibold text-content/60">Total</td><td className="px-4 py-3 text-sm font-semibold text-content/60">{data.totalTarget}</td></tr></tfoot>
            </table>
          </div>
          <p className="text-xs text-content/25 mt-4">Achieving ~100% selection rate balance for all classes.</p>
        </div>
      </div>
      <div className="glass-card rounded-xl p-5 mt-6 flex items-start gap-3"><Info className="w-4 h-4 text-content/50 shrink-0 mt-0.5" /><p className="text-sm text-content/40 leading-relaxed">Synthetic data is AI-generated and does not represent real individuals. It is used solely to reduce bias and improve fairness in the dataset. All generated data maintains the statistical properties of the original while ensuring equitable representation.</p></div>
    </div>
  );
}
