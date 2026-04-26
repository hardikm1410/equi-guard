"use client";

import { PageHeader } from "@/components/page-components";
import {
  Upload as UploadIcon,
  FileText,
  Columns,
  HardDrive,
  Lightbulb,
  ArrowRight,
  Check,
  CloudUpload,
  Loader2,
  Download,
  Sparkles,
} from "lucide-react";

import { useState } from "react";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  // =====================================
  // SYNTHESIZE DATA
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
  // DOWNLOAD SYNTHESIZED FILE
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
      a.download = "balanced_dataset.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Download failed.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* HEADER */}
      <PageHeader
        title="Bias Synthesis Tool"
        description="Upload dataset and generate balanced synthetic data."
      />

      {/* TOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* UPLOAD */}
        <div className="glass-card rounded-xl p-6">
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
                : "border-primary/30 hover:border-primary/50 hover:bg-content/[0.02]"
            }`}
          >
            <input
              type="file"
              hidden
              id="fileUpload"
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
              <div
                className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  uploaded ? "bg-content/[0.08]" : "bg-content/[0.06]"
                }`}
              >
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
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-content/70 bg-content/[0.06] border border-content/[0.1] px-4 py-2 rounded-lg hover:bg-content/[0.1] transition-all">
                  <UploadIcon className="w-4 h-4" />
                  Browse File
                </button>
              )}
            </label>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !uploaded}
            className="w-full mt-5 inline-flex items-center justify-center gap-2 bg-cta text-cta-foreground px-5 py-3 rounded-xl font-semibold hover:bg-cta/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Generate Balanced Dataset
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* DATA INFO */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-content mb-1">
            Dataset Summary
          </h3>

          <p className="text-sm text-content/30 mb-5">
            Automatic detection of protected + target columns
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-content/[0.02] rounded-lg p-4 border border-content/[0.06]">
              <FileText className="w-4 h-4 text-content/50 mb-2" />
              <span className="text-xs text-content/50">Rows</span>
              <p>{result ? result.rows : "—"}</p>
            </div>

            <div className="bg-content/[0.02] rounded-lg p-4 border border-content/[0.06]">
              <Columns className="w-4 h-4 text-content/50 mb-2" />
              <span className="text-xs text-content/50">Columns</span>
              <p>{result ? result.columns : "—"}</p>
            </div>

            <div className="bg-content/[0.02] rounded-lg p-4 border border-content/[0.06]">
              <HardDrive className="w-4 h-4 text-content/50 mb-2" />
              <span className="text-xs text-content/50">Missing</span>
              <p>{result ? result.missing : "—"}</p>
            </div>

            <div className="bg-content/[0.02] rounded-lg p-4 border border-content/[0.06]">
              <Lightbulb className="w-4 h-4 text-content/50 mb-2" />
              <span className="text-xs text-content/50">Duplicates</span>
              <p>{result ? result.duplicate : "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            Synthesis Result
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-content/[0.02] rounded-lg p-4">
              <p className="text-sm text-content/40">Protected</p>
              <p>{result.protected}</p>
            </div>

            <div className="bg-content/[0.02] rounded-lg p-4">
              <p className="text-sm text-content/40">Target</p>
              <p>{result.target}</p>
            </div>

            <div className="bg-content/[0.02] rounded-lg p-4">
              <p className="text-sm text-content/40">Rows Added</p>
              <p>{result.afterRows - result.beforeRows}</p>
            </div>

            <div className="bg-content/[0.02] rounded-lg p-4">
              <p className="text-sm text-content/40">Fairness Before</p>
              <p>{result.fairnessBefore}%</p>
            </div>

            <div className="bg-content/[0.02] rounded-lg p-4">
              <p className="text-sm text-content/40">Fairness After</p>
              <p>{result.fairnessAfter}%</p>
            </div>

            <div className="bg-content/[0.02] rounded-lg p-4">
              <p className="text-sm text-content/40">Improvement</p>
              <p>+{result.improvement}%</p>
            </div>
          </div>

          <p className="text-content/70 mb-5">
            {result.recommendation}
          </p>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Download Balanced Dataset
          </button>
        </div>
      )}
    </div>
  );
}
