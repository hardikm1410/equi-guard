"use client";

import { PageHeader } from "@/components/page-components";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";
import { ShieldAlert, ArrowRight, AlertTriangle, Eye, Filter } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { HelpCircle, Loader2 } from "lucide-react";
import AppTour from "@/components/AppTour";
import { BIAS_DETECTION_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";
import { useEffect } from "react";

const keyInsights = ["Females are 1.5x less likely to be selected", "Data has a strong correlation between gender and selection", "Educational Field weights disproportionately affect minority groups", "Selection rate for protected groups is below the 4/5 rule threshold"];
const biasMetricsSummary = [{ name: "Disparate Impact", value: "0.25", threshold: "< 0.80", status: "fail" }, { name: "Statistical Parity", value: "0.60", threshold: "< 0.10", status: "fail" }];
const topBiasedFeatures = [{ name: "Gender → Hiring", severity: 0.92 }, { name: "University Prestige", severity: 0.78 }, { name: "Name Ethnicity Signal", severity: 0.71 }, { name: "Years in Industry", severity: 0.45 }, { name: "Address Zip Code", severity: 0.38 }];

export default function BiasDetectionPage() {
  const { contentRgb, theme } = useTheme();
  const cr = contentRgb;
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [tourRun, setTourRun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      if (isDemo) {
        setData({
          keyInsights,
          biasMetricsSummary,
          topBiasedFeatures,
          selectionRateData: [
            { name: "Male", value: 68, color: "var(--primary)" },
            { name: "Female", value: 45, color: "var(--secondary-foreground)" },
            { name: "Non-Binary", value: 38, color: "var(--muted-foreground)" },
          ],
          biasScore: 0.72,
          biasStatus: "High Bias Detected"
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
                keyInsights: [
                  isNoData 
                    ? "Upload your dataset to identify selection disparities across demographic groups." 
                    : (result.verdict === "BIAS DETECTED" ? "Bias detected based on shadow score analysis." : "Model shows acceptable fairness.")
                ],
                biasMetricsSummary: [
                  { 
                    name: "Shadow Score Gap", 
                    value: isNoData ? "---" : result.bias_gap.toString(), 
                    threshold: "< 10", 
                    status: isNoData ? "pass" : (result.bias_detected ? "fail" : "pass") 
                  }
                ],
                topBiasedFeatures: [],
                selectionRateData: isNoData ? [] : [
                  { name: "Male", value: 0, color: "var(--primary)" },
                  { name: "Female", value: 0, color: "var(--secondary-foreground)" },
                  { name: "Non-Binary", value: 0, color: "var(--muted-foreground)" },
                ],
                biasScore: result.shadow_score / 100,
                biasStatus: isNoData ? "PENDING" : result.verdict
              });
            }
          } catch (error) {
            console.error("Failed to fetch bias data:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }
    }
  }, [isDemo, user]);
  const selectionRateData = [
    { name: "Male", value: 68, color: "var(--primary)" },
    { name: "Female", value: 45, color: "var(--secondary-foreground)" },
    { name: "Non-Binary", value: 38, color: "var(--muted-foreground)" },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (<div className="glass-card rounded-lg p-3 text-xs border border-content/10"><p className="text-content font-medium">{payload[0].name}: {payload[0].value}%</p></div>);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-content/20 mb-4" />
        <p className="text-content/40 font-medium">Loading bias analysis...</p>
      </div>
    );
  }

  if (!data || (!isDemo && data.keyInsights.length === 0 && data.biasScore === 0)) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Bias Detection" description="Detailed bias analysis results and fairness metrics." />
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-content/[0.04] flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-content/20" />
          </div>
          <h3 className="text-xl font-bold text-content mb-2">No analysis results</h3>
          <p className="text-content/40 mb-8 max-w-sm text-center">Run an audit on your dataset to see bias detection results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AppTour steps={BIAS_DETECTION_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />
      <div className="tour-detection-header">
        <PageHeader 
          title="Bias Detection" 
          description="Detailed bias analysis results and fairness metrics."
          action={
            <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-end">
              <button 
                onClick={() => setTourRun(true)}
                className="group p-2 rounded-2xl bg-content/[0.04] border border-content/[0.08] hover:bg-content/[0.08] transition-all hover:border-cta/30"
                title="Start Tour"
              >
                <HelpCircle className="w-5 h-5 text-content/40 group-hover:text-cta transition-colors" />
              </button>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 text-[11px] md:text-sm text-content/50 bg-content/[0.04] border border-content/[0.08] px-2 py-2 rounded-lg hover:bg-content/[0.06] transition-all"><Filter className="w-3 h-3" />Group: Gender</button>
                <button className="inline-flex items-center gap-2 text-[11px] md:text-sm text-content/50 bg-content/[0.04] border border-content/[0.08] px-2 py-2 rounded-lg hover:bg-content/[0.06] transition-all"><Eye className="w-3 h-3" />View Options</button>
              </div>
            </div>
          }
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-4 md:p-6 glow-white">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="relative shrink-0">
                <svg className="w-24 h-24 md:w-32 md:h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke={`rgba(${cr},0.04)`} strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - data.biasScore)}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl md:text-4xl font-bold text-content">{data.biasScore.toFixed(2)}</span></div>
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2"><span className="text-xs font-medium text-content/70 bg-content/[0.08] border border-content/[0.12] px-2.5 py-0.5 rounded-full">{data.biasStatus}</span></div>
                <h3 className="text-xl md:text-lg font-bold text-content mb-1">Bias Score</h3>
                <p className="text-md md:text-sm text-content/40 max-w-md">The AI model demonstrates selection disparities across protected demographic groups.</p>
              </div>
            </div>
          </div>
          <div className="tour-disparity-chart glass-card rounded-xl p-4 md:p-6">
            <h3 className="text-lg md:text-md font-semibold text-content mb-1">Selection Rate by Group</h3>
            <p className="text-md md:text-sm text-content/30 mb-4">Hiring selection rates across demographic categories</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="w-40 h-40 md:w-48 md:h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.selectionRateData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                      {data.selectionRateData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-3">
                {data.selectionRateData.map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-md md:text-sm text-content/60">{item.name}</span>
                    </div>
                    <span className="text-md md:text-sm font-semibold text-content">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg md:text-md font-semibold text-content mb-1">Top Biased Features</h3>
            <p className="text-md md:text-sm text-content/30 mb-5">Features contributing most to bias in the model</p>
            <div className="space-y-4">{data.topBiasedFeatures.map((f: any) => (<div key={f.name}><div className="flex items-center justify-between mb-1.5"><span className="text-md md:text-sm text-content/60">{f.name}</span><span className={`text-md md:text-sm font-medium ${f.severity > 0.7 ? "text-content/80" : f.severity > 0.5 ? "text-content/60" : "text-content/40"}`}>{(f.severity * 100).toFixed(0)}% impact</span></div><div className="w-full h-2 rounded-full bg-content/[0.04]"><div className={`h-full rounded-full transition-all duration-700 ${f.severity > 0.7 ? "bg-gradient-to-r from-content/50 to-content/25" : f.severity > 0.5 ? "bg-gradient-to-r from-content/35 to-content/15" : "bg-gradient-to-r from-content/25 to-content/10"}`} style={{ width: `${f.severity * 100}%` }} /></div></div>))}</div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="tour-intersectionality glass-card rounded-xl p-6"><h3 className="text-lg md:text-md font-semibold text-content mb-4">Key Insights</h3><div className="space-y-3">{data.keyInsights.map((insight: string, i: number) => (<div key={i} className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 md:w-3.5 md:h-3.5 text-content/50 shrink-0 mt-0.5" /><p className="text-md md:text-sm text-content/50 leading-relaxed">{insight}</p></div>))}</div></div>
          <div className="tour-metric-cards glass-card rounded-xl p-6"><h3 className="text-lg md:text-md font-semibold text-content mb-4">Bias Metrics Summary</h3><div className="space-y-4">{data.biasMetricsSummary.map((m: any) => (<div key={m.name} className="bg-content/[0.02] border border-content/[0.06] rounded-lg p-4"><div className="flex items-center justify-between mb-2"><span className="text-[13px] md:text-xs font-medium text-content/50">{m.name}</span><span className={`text-[13px] md:text-[10px] font-medium text-content/70 px-2 py-0.5 rounded-full ${m.status === 'fail' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{m.status.toUpperCase()}</span></div><span className="text-3xl font-bold text-content">{m.value}</span><p className="text-[13px] md:text-[11px] text-content/25 mt-1">Threshold: {m.threshold}</p></div>))}</div></div>
          <button className="tour-apply-correction w-full glass-card rounded-xl p-4 flex items-center justify-between group hover:bg-content/[0.05] transition-all"><span className="text-md font-medium text-content/60">View Full Analysis</span><ArrowRight className="w-5 h-5 md:w-4 md:h-4 text-content/40 group-hover:translate-x-1 transition-transform" /></button>
        </div>
      </div>
    </div>
  );
}
