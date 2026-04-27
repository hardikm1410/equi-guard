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
} from "lucide-react";

import { useState } from "react";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  // ========================================
  // ANALYZE
  // ========================================
  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload file first.");
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    } finally {
      setAnalyzing(false);
    }
  };

  // ========================================
  // DOWNLOAD CLEAN FILE
  // ========================================
  const handleDownload = async () => {
    if (!file) return;

    setDownloading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/download-cleaned`,
        {
          method: "POST",
          body: formData,
        }
      );

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "cleaned_dataset.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* HEADER */}
      <PageHeader
        title="Upload & Analyze"
        description="Upload your dataset and get instant analysis."
      />

      {/* TOP SECTION */}
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

              const droppedFile = e.dataTransfer.files[0];

              if (droppedFile) {
                setFile(droppedFile);
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
                CSV / Excel files supported
              </p>

              {!uploaded && (
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-content/70 bg-content/[0.06] border border-content/[0.1] px-4 py-2 rounded-lg hover:bg-content/[0.1] transition-all">
                  <UploadIcon className="w-4 h-4" />
                  Browse Files
                </button>
              )}
            </label>
          </div>

          {/* BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !uploaded}
              className="inline-flex items-center justify-center gap-2 bg-cta text-cta-foreground px-5 py-3 rounded-xl font-semibold hover:bg-cta/90 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={!result || downloading}
              className="inline-flex items-center justify-center gap-2 bg-content/[0.08] text-content px-5 py-3 rounded-xl font-semibold hover:bg-content/[0.12] disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  Download Clean File
                  <Download className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ABOUT DATA */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-content mb-1">
            About Your Data
          </h3>

          <p className="text-sm text-content/30 mb-5">
            Dataset summary and insights
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-content/[0.02] border border-content/[0.06] rounded-lg p-4">
              <FileText className="w-4 h-4 text-content/50 mb-2" />
              <span className="text-xs text-content/50">Rows</span>
              <p>{result ? result.file_info.rows : "—"}</p>
            </div>

            <div className="bg-content/[0.02] border border-content/[0.06] rounded-lg p-4">
              <Columns className="w-4 h-4 text-content/50 mb-2" />
              <span className="text-xs text-content/50">Columns</span>
              <p>{result ? result.file_info.columns : "—"}</p>
            </div>

            <div className="bg-content/[0.02] border border-content/[0.06] rounded-lg p-4">
              <HardDrive className="w-4 h-4 text-content/50 mb-2" />
              <span className="text-xs text-content/50">Size</span>
              <p>{result ? `${result.file_info.size_kb} KB` : "—"}</p>
            </div>

            <div className="bg-content/[0.02] border border-content/[0.06] rounded-lg p-4 sm:col-span-3">
              <Lightbulb className="w-4 h-4 text-content/50 mb-2" />
              <span className="text-xs text-content/50">Tip</span>
              <p>Analyze first, then download cleaned dataset.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Before Clean</h3>

            <div className="space-y-2">
              <p>Rows: {result.before_clean.rows}</p>
              <p>Columns: {result.before_clean.columns}</p>
              <p>Duplicate Rows: {result.before_clean.duplicate_rows}</p>
              <p>
                Missing Rows:{" "}
                {result.before_clean.rows_with_missing_values}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">After Clean</h3>

            <div className="space-y-2">
              <p>Rows: {result.after_clean.rows}</p>
              <p>Columns: {result.after_clean.columns}</p>
              <p>Duplicate Rows: {result.after_clean.duplicate_rows}</p>
              <p>
                Missing Rows:{" "}
                {result.after_clean.rows_with_missing_values}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
