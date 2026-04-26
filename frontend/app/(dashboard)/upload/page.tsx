"use client";

import { PageHeader } from "@/components/page-components";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";
import {
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  Eye,
  Filter,
  Upload,
  Check,
  CloudUpload,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { HelpCircle, Loader2 } from "lucide-react";
import AppTour from "@/components/AppTour";
import { BIAS_DETECTION_STEPS } from "@/lib/tour-steps";
import { API_URL } from "@/lib/constants";

export default function BiasDetectionPage() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;

  const [tourRun, setTourRun] = useState(false);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const [target, setTarget] = useState("");
  const [protectedCol, setProtectedCol] = useState("");

  const [data, setData] = useState<any>(null);

  // =====================================
  // BACKEND CALL
  // =====================================
  const handleAnalyze = async () => {
    if (!file || !target || !protectedCol) {
      alert("Please upload file and fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("target", target);
      formData.append("protected", protectedCol);

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.error) {
        alert(result.error);
        return;
      }

      setData(result);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze dataset.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // TOOLTIP
  // =====================================
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card rounded-lg p-3 text-xs border border-content/10">
          <p className="text-content font-medium">
            {payload[0].name}: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  // =====================================
  // LOADING SCREEN
  // =====================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-content/20 mb-4" />
        <p className="text-content/40 font-medium">
          Running bias analysis...
        </p>
      </div>
    );
  }

  // =====================================
  // NO DATA SCREEN
  // =====================================
  if (!data) {
    return (
      <div className="max-w-7xl mx-auto">
        <AppTour
          steps={BIAS_DETECTION_STEPS}
          run={tourRun}
          onFinish={() => setTourRun(false)}
        />

        <div className="tour-detection-header">
          <PageHeader
            title="Bias Detection"
            description="Upload your dataset and detect fairness issues."
            action={
              <button
                onClick={() => setTourRun(true)}
                className="group p-2 rounded-2xl bg-content/[0.04] border border-content/[0.08] hover:bg-content/[0.08]"
              >
                <HelpCircle className="w-5 h-5 text-content/40" />
              </button>
            }
          />
        </div>

        {/* Upload Card */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-content mb-4">
            Upload Dataset
          </h3>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);

              const droppedFile = e.dataTransfer.files[0];

              if (droppedFile) {
                setFile(droppedFile);
                setUploaded(true);
              }
            }}
            className={`border-2 border-dashed rounded-xl py-12 px-6 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-primary bg-content/[0.04]"
                : "border-content/20"
            }`}
          >
            <input
              type="file"
              id="fileUpload"
              hidden
              accept=".csv"
              onChange={(e) => {
                const selected = e.target.files?.[0];

                if (selected) {
                  setFile(selected);
                  setUploaded(true);
                }
              }}
            />

            <label htmlFor="fileUpload" className="cursor-pointer">
              {uploaded ? (
                <>
                  <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-content font-medium">
                    {file?.name}
                  </p>
                  <p className="text-content/40 text-sm">
                    Uploaded Successfully
                  </p>
                </>
              ) : (
                <>
                  <CloudUpload className="w-12 h-12 mx-auto mb-4 text-content/50" />
                  <p className="text-content font-medium">
                    Drag & Drop CSV File
                  </p>
                  <p className="text-content/40 text-sm mb-4">
                    or click to browse
                  </p>

                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-content/[0.05] border border-content/[0.08] text-content/60">
                    <Upload className="w-4 h-4" />
                    Browse File
                  </span>
                </>
              )}
            </label>
          </div>

          {/* Inputs */}
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <input
              type="text"
              placeholder="Target Column (example: hired)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-background border border-content/[0.08] rounded-lg px-4 py-3"
            />

            <input
              type="text"
              placeholder="Protected Column (example: gender)"
              value={protectedCol}
              onChange={(e) => setProtectedCol(e.target.value)}
              className="w-full bg-background border border-content/[0.08] rounded-lg px-4 py-3"
            />
          </div>

          <button
            onClick={handleAnalyze}
            className="w-full mt-5 bg-cta text-cta-foreground rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
          >
            Analyze Dataset
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 glass-card rounded-2xl border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-content/[0.04] flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-content/20" />
          </div>

          <h3 className="text-xl font-bold text-content mb-2">
            No analysis results
          </h3>

          <p className="text-content/40 text-center max-w-md">
            Upload a dataset and run analysis to view bias detection results.
          </p>
        </div>
      </div>
    );
  }

  // =====================================
  // RESULT SCREEN
  // =====================================
  return (
    <div className="max-w-7xl mx-auto">
      <AppTour
        steps={BIAS_DETECTION_STEPS}
        run={tourRun}
        onFinish={() => setTourRun(false)}
      />

      <div className="tour-detection-header">
        <PageHeader
          title="Bias Detection"
          description="Detailed bias analysis results and fairness metrics."
          action={
            <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-end">
              <button
                onClick={() => setTourRun(true)}
                className="group p-2 rounded-2xl bg-content/[0.04] border border-content/[0.08]"
              >
                <HelpCircle className="w-5 h-5 text-content/40" />
              </button>

              <button className="inline-flex items-center gap-2 text-sm text-content/50 bg-content/[0.04] border border-content/[0.08] px-3 py-2 rounded-lg">
                <Filter className="w-4 h-4" />
                Group: {protectedCol}
              </button>

              <button className="inline-flex items-center gap-2 text-sm text-content/50 bg-content/[0.04] border border-content/[0.08] px-3 py-2 rounded-lg">
                <Eye className="w-4 h-4" />
                View Options
              </button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* SCORE */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={`rgba(${cr},0.08)`}
                    strokeWidth="8"
                  />

                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 52 * (1 - data.biasScore)
                    }`}
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-content">
                    {data.biasScore}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-content/60 mb-2">
                  {data.biasStatus}
                </p>

                <h3 className="text-xl font-bold text-content">
                  Bias Score
                </h3>
              </div>
            </div>
          </div>

          {/* PIE */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-content mb-4">
              Selection Rate by Group
            </h3>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.selectionRateData}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {data.selectionRateData.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={index}
                          fill={entry.color}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TOP FEATURES */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-content mb-4">
              Top Biased Features
            </h3>

            <div className="space-y-4">
              {data.topBiasedFeatures.map((item: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-content/60 text-sm">
                      {item.name}
                    </span>

                    <span className="text-content text-sm font-medium">
                      {(item.severity * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-content/[0.06] rounded-full">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${item.severity * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Insights */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-content mb-4">
              Key Insights
            </h3>

            <div className="space-y-3">
              {data.keyInsights.map(
                (item: string, i: number) => (
                  <div
                    key={i}
                    className="flex gap-3 items-start"
                  >
                    <AlertTriangle className="w-4 h-4 text-content/50 mt-1" />
                    <p className="text-content/60 text-sm">
                      {item}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-content mb-4">
              Bias Metrics Summary
            </h3>

            <div className="space-y-4">
              {data.biasMetricsSummary.map(
                (item: any, i: number) => (
                  <div
                    key={i}
                    className="bg-content/[0.03] border border-content/[0.06] rounded-xl p-4"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-content/60">
                        {item.name}
                      </span>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.status === "fail"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-2xl font-bold text-content">
                      {item.value}
                    </p>

                    <p className="text-xs text-content/30 mt-1">
                      Threshold: {item.threshold}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <button className="w-full glass-card rounded-xl p-4 flex justify-between items-center">
            <span className="text-content/60">
              View Full Analysis
            </span>

            <ArrowRight className="w-4 h-4 text-content/40" />
          </button>
        </div>
      </div>
    </div>
  );
}
