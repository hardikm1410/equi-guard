"use client";

import { PageHeader, StatCard } from "@/components/page-components";
import { useTheme } from "@/components/theme-provider";
import {
  Target,
  Scale,
  Activity,
  ArrowRight,
  HelpCircle,
  CloudUpload,
  Check,
  Loader2,
  RefreshCw,
  FileText,
  RotateCcw,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import AppTour from "@/components/AppTour";
import { MODEL_EVALUATION_STEPS } from "@/lib/tour-steps";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth-context";

export default function ModelEvaluationPage() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;

  const [tourRun, setTourRun] = useState(false);
  const [btnExpanded, setBtnExpanded] = useState(false);

  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<File | null>(null);

  const [datasetUploaded, setDatasetUploaded] = useState(false);
  const [outputUploaded, setOutputUploaded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const { user } = useAuth();

  const handleCompare = async () => {
    if (!datasetFile || !outputFile) {
      alert("Please upload both files first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("dataset", datasetFile);
      formData.append("output", outputFile);

      const response = await fetch("{API_URL}/compare-model", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        alert("Error: " + data.error);
      } else {
        setResult(data);

        // Save to Firestore History
        if (db && user) {
          try {
            await addDoc(collection(db, "history"), {
              userId: user.uid,
              userEmail: user.email,
              name: datasetFile.name,
              type: "Model Evaluation",
              scoreBefore: "N/A", // For evaluation, we only have one score
              scoreAfter: (data.metrics.fairness_score / 100).toFixed(2),
              status: data.metrics.fairness_score < 80 ? "Needs Improvement" : "Fair",
              date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
              timestamp: serverTimestamp(),
              metrics: data.metrics,
              verdict: data.verdict
            });
          } catch (fsError) {
            console.error("Firestore Error:", fsError);
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setDatasetFile(null);
    setOutputFile(null);
    setDatasetUploaded(false);
    setOutputUploaded(false);
  };

  // ============================
  // DATA MAPPING
  // ============================
  const displayData = result ? {
    stats: {
      overallAccuracy: `${result.metrics.overall_accuracy}%`,
      balancedAccuracy: `${result.metrics.balanced_accuracy}%`,
      aucScore: `${result.metrics.auc_score}%`,
    },
    overallFairness: result.metrics.fairness_score / 100,
    accuracyByGroup: Object.entries(result.metrics.accuracy_by_group).map(([group, accuracy]) => ({
      group,
      accuracy
    })),
    performanceGap: `${result.metrics.performance_gap}%`,
    bestGroup: result.metrics.accuracy_by_group ? Object.entries(result.metrics.accuracy_by_group).sort((a: any, b: any) => b[1] - a[1])[0][0] : "N/A",
    worstGroup: result.metrics.accuracy_by_group ? Object.entries(result.metrics.accuracy_by_group).sort((a: any, b: any) => a[1] - b[1])[0][0] : "N/A",
    recommendations: result.metrics.fairness_score < 80 ? [
      "Model shows bias across groups",
      "Use re-sampling or re-weighting",
      "Apply fairness-aware training"
    ] : ["Model fairness is acceptable"]
  } : null;

  // ============================
  // TOOLTIP
  // ============================
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card rounded-lg p-3 text-xs border border-content/10">
          <p>
            {label}: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  const verdict = displayData && displayData.overallFairness < 0.8 ? "Needs Improvement" : "Fair";

  return (
    <div className="max-w-7xl mx-auto pb-16 px-4 md:px-6">
      <AppTour
        steps={MODEL_EVALUATION_STEPS}
        run={tourRun}
        onFinish={() => setTourRun(false)}
      />

      {/* HEADER */}
      <PageHeader
        title="Model Evaluation"
        description="Evaluate your model's predictions and fairness performance with precision metrics."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTourRun(true)}
              className="p-2.5 rounded-xl bg-content/[0.03] border border-content/10 hover:bg-content/[0.08] hover:border-content/20 transition-all duration-300"
            >
              <HelpCircle className="w-5 h-5 text-content/40" />
            </button>

             {result && (
              <button
                onClick={handleReset}
                onMouseEnter={() => setBtnExpanded(true)}
                onMouseLeave={() => setBtnExpanded(false)}
                className={`inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold h-[42px] rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.5)] overflow-hidden ${btnExpanded ? "md:w-[120px] md:px-5 w-[42px]" : "w-[42px] px-0"}`}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span className={`hidden md:block whitespace-nowrap transition-all duration-500 ${btnExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 md:hidden"}`}>Reset</span>
              </button>
            )}
          </div>
        }
      />

      {/* ================= UPLOAD UI ================= */}
      {!result && (
        <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />
          
          <h3 className="text-xl font-bold mb-1">Upload Data Sources</h3>
          <p className="text-sm text-content/40 mb-8">Pair your dataset with model predictions for a deep fairness analysis.</p>

          <div className="grid md:grid-cols-2 gap-8 relative">
            {/* DATASET */}
            <div className="group/card border-2 border-dashed border-content/10 rounded-2xl p-10 text-center hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-500">
              <input hidden type="file" id="datasetUpload" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setDatasetFile(f); setDatasetUploaded(true); }
              }} />
              <label htmlFor="datasetUpload" className="cursor-pointer block">
                {datasetUploaded ? (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-sm font-bold truncate max-w-[200px] mx-auto">{datasetFile?.name}</p>
                    <p className="text-xs text-content/40 mt-1 uppercase tracking-widest font-bold">Source Verified</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-content/[0.03] flex items-center justify-center mx-auto mb-4 border border-content/10 group-hover/card:scale-110 transition-transform duration-500">
                      <CloudUpload className="w-8 h-8 text-content/30" />
                    </div>
                    <p className="font-bold text-lg text-content/80 group-hover/card:text-content transition-colors">Input Dataset</p>
                    <p className="text-xs text-content/40 mt-2 leading-relaxed font-medium">Required: Target labels and<br/>protected group columns</p>
                  </>
                )}
              </label>
            </div>

            {/* OUTPUT */}
            <div className="group/card border-2 border-dashed border-content/10 rounded-2xl p-10 text-center hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-500">
              <input hidden type="file" id="outputUpload" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setOutputFile(f); setOutputUploaded(true); }
              }} />
              <label htmlFor="outputUpload" className="cursor-pointer block">
                {outputUploaded ? (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <Check className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm font-bold truncate max-w-[200px] mx-auto">{outputFile?.name}</p>
                    <p className="text-xs text-content/40 mt-1 uppercase tracking-widest font-bold">Output Verified</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-content/[0.03] flex items-center justify-center mx-auto mb-4 border border-content/10 group-hover/card:scale-110 transition-transform duration-500">
                      <Activity className="w-8 h-8 text-content/30" />
                    </div>
                    <p className="font-bold text-lg text-content/80 group-hover/card:text-content transition-colors">Model Output</p>
                    <p className="text-xs text-content/40 mt-2 leading-relaxed font-medium">Required: Predicted labels or<br/>probability scores</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <button 
            onClick={handleCompare}
            disabled={loading || !datasetUploaded || !outputUploaded}
            className="mt-10 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:hover:scale-100 shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                Initiate Performance Analysis
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ================= RESULTS ================= */}
      {displayData && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards">
          <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 blur-3xl rounded-full" />
            
            <h3 className="text-xl font-bold mb-1">Performance Overview</h3>
            <p className="text-sm text-content/40 mb-10 font-medium">Holistic metrics across all demographic dimensions</p>

            <div className="grid lg:grid-cols-[1.2fr_2.5fr] gap-16 items-center">
              {/* GAUGE */}
              <div className="flex flex-col items-center relative">
                <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full scale-50 opacity-40 animate-pulse" />
                
                <p className="text-[11px] uppercase tracking-[0.2em] text-content/40 mb-8 font-black">Overall Model Fairness</p>
                <div className="relative w-52 h-52 group">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                    <circle cx="50%" cy="50%" r="44%" className="stroke-content/[0.04]" strokeWidth="12" fill="transparent" />
                    <circle cx="50%" cy="50%" r="44%" className="stroke-primary transition-all duration-1000 ease-out" strokeWidth="12" fill="transparent"
                      strokeDasharray="283" strokeDashoffset={283 - (283 * displayData.overallFairness)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black tracking-tight text-content animate-in zoom-in duration-700">{displayData.overallFairness.toFixed(2)}</span>
                    <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 duration-700 ${displayData.overallFairness < 0.8 ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-green-500/5 border-green-500/20 text-green-500'}`}>
                      {verdict}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-content/30 mt-10 italic font-medium tracking-wide">Target Fairness Threshold: &ge; 0.80</p>
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Overall Accuracy" value={displayData.stats.overallAccuracy} subtitle="All groups combined" icon={Target} className="hover:-translate-y-1 transition-transform duration-500 shadow-lg shadow-content/[0.02]" />
                <StatCard label="Balanced Accuracy" value={displayData.stats.balancedAccuracy} subtitle="Weighted by group size" icon={Scale} className="hover:-translate-y-1 transition-transform duration-500 shadow-lg shadow-content/[0.02]" />
                <StatCard label="AUC Score" value={displayData.stats.aucScore} subtitle="Model separability power" icon={Activity} className="hover:-translate-y-1 transition-transform duration-500 shadow-lg shadow-content/[0.02]" />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card rounded-2xl p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-700 group">
              <h3 className="text-xl font-bold mb-1">Accuracy by Group</h3>
              <p className="text-sm text-content/40 mb-10 font-medium">Comparative accuracy performance across demographic clusters</p>
              
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={displayData.accuracyByGroup} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={`rgba(${cr},0.03)`} />
                  <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{fill: `rgba(${cr},0.4)`, fontSize: 11, fontWeight: 700}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: `rgba(${cr},0.4)`, fontSize: 11, fontWeight: 500}} />
                  <Tooltip cursor={{fill: `rgba(${cr},0.02)`}} content={<CustomTooltip />} />
                  <Bar dataKey="accuracy" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={44} animationDuration={2000} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-8">
              <div className="glass-card p-8 rounded-2xl relative overflow-hidden group/gap transition-all duration-500 hover:shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl rounded-full -mr-16 -mt-16 group-hover/gap:scale-125 transition-transform duration-1000" />
                <h3 className="text-lg font-bold mb-1">Performance Gap</h3>
                <p className="text-sm text-content/40 mb-8 font-medium">Disparity between polar groups</p>
                <div className="text-center mb-10">
                  <span className="text-7xl font-black tracking-tighter bg-gradient-to-br from-content via-content/80 to-content/40 bg-clip-text text-transparent">{displayData.performanceGap}</span>
                </div>
                <div className="space-y-6 pt-6 border-t border-content/5">
                  <div className="flex items-center justify-between group/row">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                      <span className="text-sm text-content/50 font-bold uppercase tracking-wider">Top Tier</span>
                    </div>
                    <span className="font-bold text-content">{displayData.bestGroup}</span>
                  </div>
                  <div className="flex items-center justify-between group/row">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                      <span className="text-sm text-content/50 font-bold uppercase tracking-wider">Bottom Tier</span>
                    </div>
                    <span className="font-bold text-content">{displayData.worstGroup}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-2xl border-l-4 border-primary/40 group/ roadmap transition-all duration-500 hover:shadow-xl">
                <h3 className="text-lg font-bold mb-8">Improvement Roadmap</h3>
                <ul className="space-y-5">
                  {displayData.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-4 group/item cursor-default">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-primary transition-all duration-300 group-hover/item:shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]">
                        <Check className="w-4 h-4 text-primary group-hover/item:text-primary-foreground transition-colors duration-300" />
                      </div>
                      <span className="text-sm leading-relaxed text-content/70 font-semibold group-hover/item:text-content transition-colors duration-300">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
