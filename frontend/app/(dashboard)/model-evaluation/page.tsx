"use client";

import { PageHeader, StatCard } from "@/components/page-components";
import { useTheme } from "@/components/theme-provider";
import { BarChart3, Target, Scale, Activity, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { HelpCircle, Loader2 } from "lucide-react";
import AppTour from "@/components/AppTour";
import { MODEL_EVALUATION_STEPS } from "@/lib/tour-steps";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";
import ReactMarkdown from "react-markdown";


const accuracyByGroup = [
  { group: "Male", accuracy: 88 }, { group: "Female", accuracy: 65 }, { group: "Non-Binary", accuracy: 58 },
  { group: "Asian", accuracy: 82 }, { group: "Black", accuracy: 60 }, { group: "Hispanic", accuracy: 63 }, { group: "White", accuracy: 86 },
];

export default function ModelEvaluationPage() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [tourRun, setTourRun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchEvaluationData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/history`);
        if (response.ok) {
          const history = await response.json();
          const lastEval = history.find((h: any) => h.type === "Model Evaluation");
          
          if (lastEval) {
            const details = lastEval.details;
            setData({
              accuracyByGroup: details.metrics?.map((m: any) => ({
                group: m.group,
                accuracy: m.accuracy
              })) || [],
              overallFairness: details.fairness || 0,
              fairnessStatus: details.fairness > 0.8 ? "Pass" : "Needs Improvement",
              stats: {
                overallAccuracy: details.accuracy || "---",
                balancedAccuracy: details.balanced_accuracy || "---",
                aucScore: details.auc || "---"
              },
              performanceGap: details.gap || "---",
              bestGroup: details.bestGroup || "---",
              worstGroup: details.worstGroup || "---",
              recommendations: details.recommendations || [
                "Address significant performance gaps between demographic groups.",
                "Consider re-training with balanced group weights.",
                "Investigate features contributing to error variance."
              ]
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch evaluation data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchEvaluationData();
  }, [user]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (<div className="glass-card rounded-lg p-3 text-xs border border-content/10" style={{ background: `var(--content-800)` }}><p className="text-content font-medium">{label}: {payload[0].value}%</p></div>);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-content/20 mb-4" />
        <p className="text-content/40 font-medium">Loading evaluation data...</p>
      </div>
    );
  }

  if (!data || (!isDemo && data.accuracyByGroup.length === 0 && data.performanceGap === "0%")) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Model Evaluation" description="Evaluate your model's predictions and fairness performance." />
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-content/[0.04] flex items-center justify-center mb-6">
            <Target className="w-8 h-8 text-content/20" />
          </div>
          <h3 className="text-xl font-bold text-content mb-2">No evaluation data</h3>
          <p className="text-content/40 mb-8 max-w-sm text-center">Upload and analyze your dataset first to see model evaluation results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AppTour steps={MODEL_EVALUATION_STEPS} run={tourRun} onFinish={() => setTourRun(false)} />
      <div className="tour-evaluation-header">
        <PageHeader 
          title="Model Evaluation" 
          description="Evaluate your model's predictions and fairness performance."
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
      <div className="tour-performance-metrics glass-card rounded-xl p-6 mb-6">
        <h3 className="text-lg md:text-md font-semibold text-content mb-1">Performance Overview</h3>
        <p className="text-md md:text-sm text-content/30 mb-10">Model performance metrics across groups</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center justify-center">
            <p className="text-[13px] md:text-xs font-medium uppercase tracking-widest text-content/40 mb-4">Overall Model Fairness</p>
            <div className="relative">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke={`rgba(${cr},0.04)`} strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - data.overallFairness)}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-content">{data.overallFairness.toFixed(2)}</span>
                <span className="text-[12px] md:text-[09px] text-content/40 font-medium">{data.fairnessStatus}</span>
              </div>
            </div>
            <p className="text-[13px] md:text-[12px] text-content/25 mt-3 text-center">Fair model performance metric (target: ≥0.80)</p>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Overall Accuracy" value={data.stats.overallAccuracy} icon={Target} subtitle="All groups combined" />
            <StatCard label="Balanced Accuracy" value={data.stats.balancedAccuracy} icon={Scale} subtitle="Weighted by group size" />
          <div className="tour-roc-comparison grid grid-cols-1 sm:grid-cols-1 gap-4">
              <StatCard label="AUC Score" value={data.stats.aucScore} icon={Activity} subtitle="Area under ROC curve" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="tour-confusion-matrix lg:col-span-2 glass-card rounded-xl p-6">
          <h3 className="text-lg md:text-md font-semibold text-content mb-3">Accuracy by Group</h3>
          <p className="text-md md:text-sm text-content/30 mb-20">Model accuracy broken down by demographic group</p>
          <ResponsiveContainer width="100%" height={300}>
            < BarChart data={data.accuracyByGroup} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${cr},0.04)`} />
              <XAxis dataKey="group" tick={{ fill: `rgba(${cr},0.35)`, fontSize: 11 }} axisLine={{ stroke: `rgba(${cr},0.06)` }} tickLine={false} />
              <YAxis tick={{ fill: `rgba(${cr},0.35)`, fontSize: 11 }} axisLine={{ stroke: `rgba(${cr},0.06)` }} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgba(${cr},0.04)` }} />
              <Bar dataKey="accuracy" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </ BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg md:text-md font-semibold text-content mb-6">Performance Gap</h3>
            <div className="text-center mb-4"><span className="text-5xl font-bold text-content">{data.performanceGap}</span><p className="text-md md:text-sm text-content/40 mt-2">Gap between best and worst performing groups</p></div>
            <div className="bg-content/[0.02] border border-content/[0.06] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[13px] md:text-xs text-content/40">Best Performing Group</span><span className="text-[13px] md:text-xs font-medium text-content/80">{data.bestGroup}</span></div>
              <div className="flex items-center justify-between"><span className="text-[13px] md:text-xs text-content/40">Worst Performing Group</span><span className="text-[13px] md:text-xs font-medium text-content/50">{data.worstGroup}</span></div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg md:text-md font-semibold text-content mb-3">Recommendations</h3>
            <div className="space-y-3">{data.recommendations.map((rec: string, i: number) => (<div key={i} className="flex items-start gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-content/50 mt-1.5 shrink-0" /><div className="text-md md:text-sm text-content/40 inline-markdown"><ReactMarkdown>{rec}</ReactMarkdown></div></div>))}</div>
          </div>
          <button className="w-full glass-card rounded-xl p-4 flex items-center justify-between group hover:bg-content/[0.05] transition-all"><span className="text-md font-medium text-content/60">View Full Report</span><ArrowRight className="w-5 h-5 md:w-4 md:h-4 text-content/40 group-hover:translate-x-1 transition-transform" /></button>
        </div>
      </div>
    </div>
  );
}