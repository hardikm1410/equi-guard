"use client";

import { PageHeader } from "@/components/page-components";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect } from "react";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { HelpCircle, Loader2 } from "lucide-react";
import AppTour from "@/components/AppTour";
import { BIAS_DETECTION_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL } from "@/lib/constants";

const keyInsights = [
  "Females are 1.5x less likely to be selected",
  "Data has a strong correlation between gender and selection",
  "Educational Field weights disproportionately affect minority groups",
  "Selection rate for protected groups is below the 4/5 rule threshold",
];

const biasMetricsSummary = [
  {
    name: "Disparate Impact",
    value: "0.25",
    threshold: "< 0.80",
    status: "fail",
  },
  {
    name: "Statistical Parity",
    value: "0.60",
    threshold: "< 0.10",
    status: "fail",
  },
];

const topBiasedFeatures = [
  { name: "Gender → Hiring", severity: 0.92 },
  { name: "University Prestige", severity: 0.78 },
  { name: "Name Ethnicity Signal", severity: 0.71 },
  { name: "Years in Industry", severity: 0.45 },
  { name: "Address Zip Code", severity: 0.38 },
];

export default function BiasDetectionPage() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;

  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [tourRun, setTourRun] = useState(false);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const [data, setData] = useState<any>(null);

  useEffect(() => {
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
      biasStatus: "High Bias Detected",
    });

    setLoading(false);
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-content/20 mb-4" />
        <p className="text-content/40 font-medium">
          Loading bias analysis...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AppTour
        steps={BIAS_DETECTION_STEPS}
        run={tourRun}
        onFinish={() => setTourRun(false)}
      />

      {/* Header */}
      <div className="tour-detection-header">
        <PageHeader
          title="Bias Detection"
          description="Detailed bias analysis results and fairness metrics."
          action={
            <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-end">
              <button
                onClick={() => setTourRun(true)}
                className="group p-2 rounded-2xl bg-content/[0.04] border border-content/[0.08] hover:bg-content/[0.08]"
              >
                <HelpCircle className="w-5 h-5 text-content/40" />
              </button>

              <button className="inline-flex items-center gap-2 text-sm text-content/50 bg-content/[0.04] border border-content/[0.08] px-3 py-2 rounded-lg">
                <Filter className="w-4 h-4" />
                Group: Gender
              </button>

              <button className="inline-flex items-center gap-2 text-sm text-content/50 bg-content/[0.04] border border-content/[0.08] px-3 py-2 rounded-lg">
                <Eye className="w-4 h-4" />
                View Options
              </button>
            </div>
          }
        />
      </div>

      {/* FILE UPLOAD SAME THEME */}
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
            accept=".csv"
            hidden
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
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* SCORE */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <svg
                  className="w-28 h-28 -rotate-90"
                  viewBox="0 0 120 120"
                >
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

          {/* PIE CHART */}
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
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
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
