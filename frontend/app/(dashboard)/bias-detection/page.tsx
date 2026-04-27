"use client";

import { PageHeader } from "@/components/page-components";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect } from "react";
import { ShieldAlert, ArrowRight, AlertTriangle, Eye, Filter, Loader2, HelpCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import AppTour from "@/components/AppTour";
import { BIAS_DETECTION_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";
import ReactMarkdown from "react-markdown";


export default function BiasDetectionPage() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;
  const { user } = useAuth();
  
  const COLORS = [
    'var(--primary)', 
    'var(--secondary-foreground)', 
    'var(--accent-foreground)', 
    'rgba(var(--content-rgb), 0.4)',
    'rgba(var(--content-rgb), 0.2)'
  ];
  const [tourRun, setTourRun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchLastAudit = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/history`);
        if (response.ok) {
          const history = await response.json();
          // Find most recent bias detection
          const lastBias = history.find((h: any) => h.type === "Bias Detection");
          if (lastBias) {
            const details = lastBias.details;
            setData({
              biasScore: details.score,
              biasStatus: details.status,
              keyInsights: details.insights || ["Significant disparity found across groups.", "Model shows high bias in selection rates."],
              biasMetricsSummary: details.metrics_summary || [
                { name: "Bias Score", value: details.score.toString(), threshold: "< 0.20", status: details.score > 0.2 ? "fail" : "pass" }
              ],
              topBiasedFeatures: details.top_features || [],
              selectionRateData: details.selection_rates || [
                { name: "Group A", value: 65 },
                { name: "Group B", value: 35 }
              ]
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch bias data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchLastAudit();
  }, [user]);

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

  if (!data) {
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
                <p className="text-md md:text-sm text-content/40 max-w-md">The model demonstrates selection disparities across protected demographic groups.</p>
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
                      {data.selectionRateData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-3">
                {data.selectionRateData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-md md:text-sm text-content/60">{item.name}</span>
                    </div>
                    <span className="text-md md:text-sm font-semibold text-content">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {data.topBiasedFeatures.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg md:text-md font-semibold text-content mb-1">Top Biased Features</h3>
              <p className="text-md md:text-sm text-content/30 mb-5">Features contributing most to bias in the model</p>
              <div className="space-y-4">{data.topBiasedFeatures.map((f: any) => (<div key={f.name}><div className="flex items-center justify-between mb-1.5"><span className="text-md md:text-sm text-content/60">{f.name}</span><span className={`text-md md:text-sm font-medium ${f.severity > 0.7 ? "text-content/80" : f.severity > 0.5 ? "text-content/60" : "text-content/40"}`}>{(f.severity * 100).toFixed(0)}% impact</span></div><div className="w-full h-2 rounded-full bg-content/[0.04]"><div className={`h-full rounded-full transition-all duration-700 ${f.severity > 0.7 ? "bg-gradient-to-r from-content/50 to-content/25" : f.severity > 0.5 ? "bg-gradient-to-r from-content/35 to-content/15" : "bg-gradient-to-r from-content/25 to-content/10"}`} style={{ width: `${f.severity * 100}%` }} /></div></div>))}</div>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="tour-intersectionality glass-card rounded-xl p-6">
            <h3 className="text-lg md:text-md font-semibold text-content mb-4">Key Insights</h3>
            <div className="space-y-3">
              {data.keyInsights.map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 md:w-3.5 md:h-3.5 text-content/50 shrink-0 mt-0.5" />
                  <div className="text-md md:text-sm text-content/50 leading-relaxed inline-markdown">
                    <ReactMarkdown>{insight}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="tour-metric-cards glass-card rounded-xl p-6">
            <h3 className="text-lg md:text-md font-semibold text-content mb-4">Bias Metrics Summary</h3>
            <div className="space-y-4">
              {data.biasMetricsSummary.map((m: any) => (
                <div key={m.name} className="bg-content/[0.02] border border-content/[0.06] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] md:text-xs font-medium text-content/50">{m.name}</span>
                    <span className={`text-[13px] md:text-[10px] font-medium text-content/70 px-2 py-0.5 rounded-full ${m.status === 'fail' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{m.status.toUpperCase()}</span>
                  </div>
                  <span className="text-3xl font-bold text-content">{m.value}</span>
                  <p className="text-[13px] md:text-[11px] text-content/25 mt-1">Threshold: {m.threshold}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

