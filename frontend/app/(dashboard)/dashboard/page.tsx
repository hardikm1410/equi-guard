"use client";

import { useState } from "react";

import { PageHeader, StatCard } from "@/components/page-components";
import { useTheme } from "@/components/theme-provider";
import { ShieldCheck, TrendingDown, Users, CheckCircle2, AlertTriangle, ArrowRight, Plus, HelpCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AppTour from "@/components/AppTour";
import { DASHBOARD_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";
import { useEffect } from "react";

const biasOverviewData = [
  { group: "Male", before: 78, after: 82 }, { group: "Female", before: 62, after: 79 },
  { group: "Non-Binary", before: 58, after: 77 }, { group: "Asian", before: 71, after: 80 },
  { group: "Black", before: 55, after: 76 }, { group: "Hispanic", before: 60, after: 78 },
  { group: "White", before: 80, after: 83 },
];

const biasMetrics = [
  { metric: "Disparate Impact", before: "0.52", after: "0.88", status: "improved" },
  { metric: "Statistical Parity Difference", value: "0.24", after: "0.04", status: "improved" },
  { metric: "Equal Opportunity Difference", before: "0.41", after: "0.08", status: "improved" },
  { metric: "Average Odds Difference", before: "0.35", after: "0.06", status: "improved" },
];

const explanations = [
  { title: "AI Explanation (Why is this happening?)", content: "The model shows significant gender bias. Male candidates are 1.3x more likely to be selected than female candidates. This mostly maps to historical data imbalance and feature selection bias, particularly in the 'years_experience' and 'university_tier' fields." },
];

const topFeatures = [
  { name: "Gender → Selection", impact: 0.82, type: "bias" }, { name: "University Tier", impact: 0.67, type: "bias" },
  { name: "Years Experience", impact: 0.54, type: "fair" }, { name: "Skills Match", impact: 0.91, type: "fair" },
  { name: "Age Group", impact: 0.45, type: "bias" },
];

export default function DashboardPage() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      if (isDemo) {
        setData({
          biasOverviewData,
          biasMetrics,
          explanations,
          topFeatures,
          stats: {
            biasScore: "0.72",
            biasScoreSubtitle: "From 0.73 to 0.24",
            disparityReduction: "66.7%",
            disparityReductionTrend: "↓ 0.86 after synthesis",
            decisionsAudited: "10,000",
            decisionsAuditedSubtitle: "6,000 original + 4,000 synthetic",
            fairnessStatus: "Improved",
            fairnessStatusSubtitle: "After Correction"
          }
        });
        setLoading(false);
      } else {
        const fetchData = async () => {
          setLoading(true);
          try {
            const response = await fetch(`${API_URL}/evaluate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resume_text: "sample" })
            });
            
            if (response.ok) {
              const result = await response.json();
              const isNoData = result.verdict === "NO DATA";
              setData({
                biasOverviewData: [],
                biasMetrics: [],
                explanations: [{ 
                  title: isNoData ? "No Analysis Data" : "Analysis Result", 
                  content: isNoData 
                    ? "You haven't run any bias audits yet. Upload a dataset to see AI-powered fairness insights here." 
                    : (result.verdict === "BIAS DETECTED" ? "Bias was detected in your dataset. Consider using synthetic data to balance the distribution." : "No significant bias detected.") 
                }],
                topFeatures: [],
                stats: {
                  biasScore: isNoData ? "---" : (result.shadow_score / 100).toFixed(2),
                  biasScoreSubtitle: isNoData ? "No data" : `Gap: ${result.bias_gap}`,
                  disparityReduction: isNoData ? "---" : "0%",
                  disparityReductionTrend: "N/A",
                  decisionsAudited: "0",
                  decisionsAuditedSubtitle: "Upload data to see stats",
                  fairnessStatus: isNoData ? "PENDING" : result.verdict,
                  fairnessStatusSubtitle: isNoData ? "Audit required" : (result.bias_detected ? "Correction Recommended" : "Pass")
                }
              });
            }
          } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }
    }
  }, [isDemo, user]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card rounded-lg p-3  text-xs border border-content/10" style={{ background: `var(--content-800)` }}>
          <p className="text-content font-medium mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-content/60">{p.dataKey === "before" ? "Before" : "After"}: <span className="text-content font-medium">{p.value}</span></p>
          ))}
        </div>
      );
    }
    return null;
  };

  const router = useRouter();
  const [btnExpanded, setBtnExpanded] = useState(false);
  const [tourRun, setTourRun] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-content/20 mb-4" />
        <p className="text-content/40 font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  if (!data || (!isDemo && data.biasOverviewData.length === 0 && data.stats.decisionsAudited === "0")) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Dashboard" description="Overview of your latest fairness audits and automated decision insights." />
        <div className="flex flex-col items-center justify-center py-20 bg-transparent rounded-2xl border-dashed">
          <div className="relative z-10 w-full flex-1 mb-10 flex items-center justify-center group cursor-pointer">
                <img
                  src="/illustrations/empty.png"
                  alt="Empty Audits Illustration"
                  className="w-full max-h-80 object-contain drop-shadow-2xl opacity-50 scale-80"
                />
              </div>
          <h3 className="text-xl font-bold text-content mb-2">No audits yet</h3>
          <p className="text-content/40 mb-8 max-w-sm text-center">You haven&apos;t uploaded any data for analysis yet. Start by creating a new audit.</p>
          <button 
            onClick={() => router.push("/upload")}
            className="inline-flex items-center gap-2 bg-cta text-white font-semibold px-6 py-3 rounded-xl hover:bg-cta/90 transition-all shadow-lg shadow-cta/20"
          >
            <Plus className="w-5 h-5" />
            Start New Audit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AppTour steps={DASHBOARD_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />
      <div className="tour-dashboard-header">
        <PageHeader title="Dashboard" description="Overview of your latest fairness audits and automated decision insights."
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
                onMouseEnter={() => setBtnExpanded(true)}
                onMouseLeave={() => setBtnExpanded(false)}
                onClick={() => {router.push("/upload")}}
                className={`tour-new-audit inline-flex items-center justify-center gap-2 bg-cta text-white text-md font-semibold h-[38px] rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cta shadow-lg shadow-content/[0.05] overflow-hidden ${btnExpanded ? "w-[140px] px-5" : "w-[38px] px-0"}`}
              >
                <Plus className="w-5 h-5 shrink-0" />
                <span className={`whitespace-nowrap transition-all duration-300 ${btnExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden"}`}>New Audit</span>
              </button>
            </div>
          }
        />
      </div>

      <div className="tour-stats-overview grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 mb-8 md:mb-8">
        <StatCard label="Overall Bias Score" value={data.stats.biasScore} subtitle={data.stats.biasScoreSubtitle} icon={ShieldCheck} trend={{ value: "High Bias", positive: false }} />
        <StatCard label="Disparity Reduction" value={data.stats.disparityReduction} icon={TrendingDown} trend={{ value: data.stats.disparityReductionTrend, positive: true }} />
        <StatCard label="Decisions Audited" value={data.stats.decisionsAudited} subtitle={data.stats.decisionsAuditedSubtitle} icon={Users} />
        <StatCard label="Fairness Status" value={data.stats.fairnessStatus} subtitle={data.stats.fairnessStatusSubtitle} icon={CheckCircle2} trend={{ value: "Pass", positive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="tour-bias-chart lg:col-span-2 glass-card rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-md font-semibold text-content">Bias Overview (Before vs After)</h3>
              <p className="text-sm text-content/30 mt-0.5">Decision scores across demographic breakdowns</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40 " /><span className="text-muted-foreground">Before</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /><span className="text-primary">After</span></span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.biasOverviewData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${cr},0.06)`} />
              <XAxis dataKey="group" tick={{ fill: `rgba(${cr},0.35)`, fontSize: 11 }} axisLine={{ stroke: `rgba(${cr},0.06)` }} tickLine={false} />
              <YAxis tick={{ fill: `rgba(${cr},0.35)`, fontSize: 11 }} axisLine={{ stroke: `rgba(${cr},0.06)` }} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgba(${cr},0.04)` }} />
              <Bar dataKey="before" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} opacity={0.5} />
              <Bar dataKey="after" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="tour-bias-metrics glass-card rounded-xl p-4 md:p-6">
          <h3 className="text-md md:text-base font-semibold text-content mb-1">Bias Metrics</h3>
          <p className="text-sm text-content/30 mb-5">Key fairness indicators</p>
          <div className="space-y-4">
            {data.biasMetrics.map((m: any) => (
              <div key={m.metric} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-content/60">{m.metric}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-semibold text-content/40">{m.before || m.value}</span>
                    <ArrowRight className="w-3 h-3 text-content/20" />
                    <span className="text-sm font-semibold text-content">{m.after}</span>
                  </div>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-content/70 bg-content/[0.06] px-2 py-0.5 rounded-full">{m.status}</span>
              </div>
            ))}
          </div>
          <button className="mt-5 text-sm text-content/50 hover:text-content/80 transition-colors flex items-center gap-1">View all metrics <ArrowRight className="w-3 h-3" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="tour-ai-explanation glass-card rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <AlertTriangle className="w-4 h-4 text-content/60" />
            <h3 className="text-md md:text-base font-semibold text-content">AI Explanation (Why is this happening?)</h3>
          </div>
          <p className="text-md md:text-md text-content/50 leading-relaxed mb-4 md:mb-5">{data.explanations[0]?.content}</p>
          <div className="flex flex-wrap gap-3 mb-4">
            {["66% Top-10 Biased", "Male Sig. Overrep'd", "Gender Top Feature", "Selection Gap → 23%"].map((tag) => (
              <span key={tag} className="text-[12px] text-content/50 bg-content/[0.04] border border-content/[0.06] px-2.5 py-1 rounded-full">{tag}</span>
            ))}
          </div>
          <button className="text-sm text-content/50 hover:text-content/80 transition-colors flex items-center gap-1">View Full Explanation <ArrowRight className="w-3 h-3" /></button>
        </div>

        <div className="glass-card rounded-xl p-8 md:p-6">
          <h3 className="text-md md:text-md font-semibold text-content mb-1">Top Fairness Features</h3>
          <p className="text-md md:text-sm text-content/30 mb-4 md:mb-5">What We Did — Impact breakdown</p>
          <div className="space-y-3">
            {data.topFeatures.map((f: any) => (
              <div key={f.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] md:text-sm text-content/60">{f.name}</span>
                  <span className={`text-[12px] md:text-sm font-medium ${f.type === "bias" ? "text-content/40" : "text-content/70"}`}>{(f.impact * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-content/[0.04]">
                  <div className={`h-full rounded-full transition-all duration-700 ${f.type === "bias" ? "bg-gradient-to-r from-content/30 to-content/15" : "bg-gradient-to-r from-content/50 to-content/30"}`} style={{ width: `${f.impact * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-5 text-sm text-content/50 hover:text-content/80 transition-colors flex items-center gap-1">View Feature Impact <ArrowRight className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  );
}
