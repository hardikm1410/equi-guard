"use client";

import { PageHeader } from "@/components/page-components";
import {
  Upload as UploadIcon,
  FileText,
  Columns,
  HardDrive,
  Lightbulb,
  Check,
  CloudUpload,
  Loader2,
  Download,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { useState } from "react";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  // =====================================
  // ANALYZE / SYNTHESIZE
  // =====================================
  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload file first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:8000/synthesize", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // DOWNLOAD
  // =====================================
  const handleDownload = async () => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/download-synthesized",
        {
          method: "POST",
          body: formData,
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "fair_dataset.csv";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Download failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Bias Fairness Analyzer"
        description="Upload dataset, detect unfairness, and generate corrected fair dataset."
      />

      {/* TOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* UPLOAD */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
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

              const dropped = e.dataTransfer.files[0];
              if (dropped) {
                setFile(dropped);
                setUploaded(true);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-primary/50 bg-content/[0.03]"
                : uploaded
                ? "border-content/20 bg-content/[0.02]"
                : "border-primary/30 hover:border-primary/50"
            }`}
          >
            <input
              hidden
              id="fileUpload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) {
                  setFile(selected);
                  setUploaded(true);
                }
              }}
            />

            <label htmlFor="fileUpload" className="cursor-pointer">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-content/[0.06]">
                {uploaded ? (
                  <Check className="w-10 h-10 text-content/70" />
                ) : (
                  <CloudUpload className="w-10 h-10 text-content/60" />
                )}
              </div>

              <p className="text-lg font-medium text-content/70 mb-1">
                {uploaded ? file?.name : "Drag & Drop File Here"}
              </p>

              <p className="text-sm text-content/30">
                CSV / Excel supported
              </p>

              {!uploaded && (
                <button className="mt-4 inline-flex gap-2 px-4 py-2 rounded-lg bg-content/[0.06]">
                  <UploadIcon className="w-4 h-4" />
                  Browse File
                </button>
              )}
            </label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !uploaded}
            className="w-full mt-5 py-3 rounded-xl bg-cta text-cta-foreground font-semibold hover:bg-cta/90 disabled:opacity-50 inline-flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Detect Bias & Fix
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* DATA SUMMARY */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            Dataset Summary
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Card
              icon={<FileText className="w-4 h-4" />}
              label="Rows"
              value={result?.rows ?? "—"}
            />
            <Card
              icon={<Columns className="w-4 h-4" />}
              label="Columns"
              value={result?.columns ?? "—"}
            />
            <Card
              icon={<HardDrive className="w-4 h-4" />}
              label="Missing"
              value={result?.missing ?? "—"}
            />
            <Card
              icon={<Lightbulb className="w-4 h-4" />}
              label="Duplicates"
              value={result?.duplicate ?? "—"}
            />
          </div>
        </div>
      </div>

      {/* FULL RESULT */}
      {result && (
        <div className="space-y-6">
          {/* BIAS RESULTS */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              Bias Detection Result
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              <Card
                icon={<Users className="w-4 h-4" />}
                label="Protected Column"
                value={result.protected}
              />

              <Card
                icon={<ShieldCheck className="w-4 h-4" />}
                label="Target Column"
                value={result.target}
              />

              <Card
                icon={<TrendingUp className="w-4 h-4" />}
                label="Rows Added"
                value={result.afterRows - result.beforeRows}
              />

              <Card
                label="Fairness Before"
                value={`${result.fairnessBefore}%`}
              />

              <Card
                label="Fairness After"
                value={`${result.fairnessAfter}%`}
              />

              <Card
                label="Improvement"
                value={`+${result.improvement}%`}
              />
            </div>
          </div>

          {/* GROUP RATES */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              Group Selection Rates (Before Fix)
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(result.groupRatesBefore).map(
                ([key, value]: any) => (
                  <Card
                    key={key}
                    label={key}
                    value={`${(value * 100).toFixed(2)}%`}
                  />
                )
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              Group Selection Rates (After Fix)
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(result.groupRatesAfter).map(
                ([key, value]: any) => (
                  <Card
                    key={key}
                    label={key}
                    value={`${(value * 100).toFixed(2)}%`}
                  />
                )
              )}
            </div>
          </div>

          {/* RECOMMENDATION */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">
              Recommendation
            </h3>

            <p className="text-content/70 mb-5">
              {result.recommendation}
            </p>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Download Fair Dataset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* CARD */
function Card({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: any;
}) {
  return (
    <div className="bg-content/[0.02] border border-content/[0.06] rounded-xl p-4">
      {icon && <div className="mb-2 text-content/50">{icon}</div>}
      <p className="text-xs text-content/40">{label}</p>
      <p className="text-lg font-semibold text-content/80 mt-1">
        {value}
      </p>
    </div>
  );
}
