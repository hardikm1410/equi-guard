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

export default function ModelEvaluationPage() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;

  const [tourRun, setTourRun] = useState(false);

  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<File | null>(null);

  const [datasetUploaded, setDatasetUploaded] = useState(false);
  const [outputUploaded, setOutputUploaded] = useState(false);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!datasetFile || !outputFile) {
      alert("Please upload both Dataset and Model Output files.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("dataset", datasetFile);
      formData.append("output", outputFile);

      const response = await fetch("http://127.0.0.1:8000/compare-model", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        alert(result.error || "Review failed");
        setData(null);
        return;
      }
      setData(result);
    } catch (error) {
      console.error(error);
      alert("Backend connection failed.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="max-w-7xl mx-auto">
      <AppTour
        steps={MODEL_EVALUATION_STEPS}
        run={tourRun}
        onFinish={() => setTourRun(false)}
      />

      {/* HEADER */}
      <PageHeader
        title="Model Evaluation"
        description="Compare model predictions with dataset fairness analysis"
        action={
          <button onClick={() => setTourRun(true)}>
            <HelpCircle />
          </button>
        }
      />

      {/* ================= UPLOAD UI ================= */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Upload Files (Demo UI)
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* DATASET */}
          <div className="border-2 border-dashed rounded-xl p-6 text-center">
            <input
              hidden
              type="file"
              id="datasetUpload"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setDatasetFile(f);
                  setDatasetUploaded(true);
                }
              }}
            />

            <label htmlFor="datasetUpload" className="cursor-pointer">
              {datasetUploaded ? (
                <>
                  <Check className="mx-auto text-green-500 mb-2" />
                  <p className="text-sm">{datasetFile?.name}</p>
                  <p className="text-xs text-content/40">
                    Dataset Uploaded
                  </p>
                </>
              ) : (
                <>
                  <CloudUpload className="mx-auto mb-2 text-content/50" />
                  <p>Upload Dataset</p>
                </>
              )}
            </label>
          </div>

          {/* OUTPUT */}
          <div className="border-2 border-dashed rounded-xl p-6 text-center">
            <input
              hidden
              type="file"
              id="outputUpload"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setOutputFile(f);
                  setOutputUploaded(true);
                }
              }}
            />

            <label htmlFor="outputUpload" className="cursor-pointer">
              {outputUploaded ? (
                <>
                  <Check className="mx-auto text-green-500 mb-2" />
                  <p className="text-sm">{outputFile?.name}</p>
                  <p className="text-xs text-content/40">
                    Model Output Uploaded
                  </p>
                </>
              ) : (
                <>
                  <CloudUpload className="mx-auto mb-2 text-content/50" />
                  <p>Upload Model Output</p>
                </>
              )}
            </label>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !datasetFile || !outputFile}
          className="mt-6 w-full bg-cta text-cta-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Comparing...
            </>
          ) : (
            <>
              Compare Model vs Dataset
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {data && (
        <>
      {/* ================= METRICS ================= */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard
            label="Overall Accuracy"
            value={data.stats.overallAccuracy}
            icon={Target}
          />
          <StatCard
            label="Balanced Accuracy"
            value={data.stats.balancedAccuracy}
            icon={Scale}
          />
          <StatCard
            label="AUC Score"
            value={data.stats.aucScore}
            icon={Activity}
          />
          <StatCard
            label="Fairness Score"
            value={data.overallFairness}
            icon={Scale}
          />
        </div>
      </div>

      {/* ================= CHART ================= */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h3 className="mb-4 font-semibold">
          Accuracy by Group
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.accuracyByGroup}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={`rgba(${cr},0.1)`}
            />
            <XAxis dataKey="group" />
            <YAxis domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="accuracy"
              fill="var(--primary)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ================= INSIGHTS ================= */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-xl">
          <h3 className="mb-4 font-semibold">
            Performance Gap
          </h3>
          <p className="text-4xl font-bold">
            {data.performanceGap}
          </p>
          <p className="text-sm text-content/40 mt-2">
            Gap between best and worst performing groups
          </p>

          <div className="mt-4 text-sm">
            <p>Best: {data.bestGroup}</p>
            <p>Worst: {data.worstGroup}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h3 className="mb-4 font-semibold">
            Recommendations
          </h3>

          {data.recommendations.map((r: string, i: number) => (
            <p key={i} className="text-sm mb-2">
              • {r}
            </p>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
