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
} from "lucide-react";

import { useState } from "react";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  // ========================================
  // ANALYZE
  // ========================================
  const handleAnalyze = async () => {
    if (!file) {
      alert("Upload file first.");
      return;
    }

    setAnalyzing(true);
    setCompleted(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setResult(data);
      setCompleted(true);
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    } finally {
      setAnalyzing(false);
    }
  };

  // ========================================
  // STEP STATUS
  // ========================================
  const currentStep = completed
    ? 4
    : analyzing
    ? 3
    : uploaded
    ? 2
    : 1;

  const steps = [
    "Upload File",
    "Ready",
    "Analyzing",
    "Complete",
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER */}
      <PageHeader
        title="Upload & Analyze"
        description="Upload your dataset and run automatic file analysis."
      />

      {/* STEP BAR */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {steps.map((step, i) => {
            const active = currentStep >= i + 1;

            return (
              <div
                key={step}
                className="flex items-center flex-1 min-w-[120px]"
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${
                      active
                        ? "bg-cta text-white border-cta"
                        : "bg-content/[0.03] text-content/30 border-content/[0.08]"
                    }`}
                  >
                    {active ? <Check className="w-4 h-4" /> : i + 1}
                  </div>

                  <span
                    className={`text-sm font-medium ${
                      active
                        ? "text-content/80"
                        : "text-content/30"
                    }`}
                  >
                    {step}
                  </span>
                </div>

                {i !== steps.length - 1 && (
                  <div className="h-[2px] w-full bg-content/[0.08] mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* UPLOAD BOX */}
      <div className="glass-card rounded-xl p-6 mb-6">
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
              setCompleted(false);
              setResult(null);
            }
          }}
          className={`border-2 border-dashed rounded-xl py-14 px-6 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-primary bg-content/[0.03]"
              : uploaded
              ? "border-content/20 bg-content/[0.02]"
              : "border-primary/30 hover:border-primary/50"
          }`}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            hidden
            id="fileUpload"
            onChange={(e) => {
              const selected = e.target.files?.[0];

              if (selected) {
                setFile(selected);
                setUploaded(true);
                setCompleted(false);
                setResult(null);
              }
            }}
          />

          <label htmlFor="fileUpload" className="cursor-pointer">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-content/[0.05]">
              {uploaded ? (
                <Check className="w-10 h-10 text-green-500" />
              ) : (
                <CloudUpload className="w-10 h-10 text-content/50" />
              )}
            </div>

            <p className="text-lg font-semibold text-content/70 mb-1">
              {uploaded ? file?.name : "Drag & Drop File Here"}
            </p>

            <p className="text-content/40 text-sm">
              CSV / Excel supported
            </p>

            {!uploaded && (
              <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-content/[0.08] bg-content/[0.04]">
                <UploadIcon className="w-4 h-4" />
                Browse File
              </button>
            )}
          </label>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleAnalyze}
          disabled={!uploaded || analyzing}
          className="w-full mt-5 inline-flex items-center justify-center gap-2 bg-cta text-cta-foreground px-5 py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze File
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* RESULT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          {result && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Before Clean
              </h3>

              <div className="space-y-2 text-content/70">
                <p>Rows: {result.before_clean.rows}</p>
                <p>Columns: {result.before_clean.columns}</p>
                <p>
                  Duplicate Rows:{" "}
                  {result.before_clean.duplicate_rows}
                </p>
                <p>
                  Missing Rows:{" "}
                  {
                    result.before_clean
                      .rows_with_missing_values
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              About Data
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-content/[0.03]">
                <FileText className="w-4 h-4 mb-2" />
                <p className="text-xs text-content/40">Rows</p>
                <p>{result ? result.file_info.rows : "--"}</p>
              </div>

              <div className="p-4 rounded-xl bg-content/[0.03]">
                <Columns className="w-4 h-4 mb-2" />
                <p className="text-xs text-content/40">
                  Columns
                </p>
                <p>
                  {result ? result.file_info.columns : "--"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-content/[0.03]">
                <HardDrive className="w-4 h-4 mb-2" />
                <p className="text-xs text-content/40">
                  Size
                </p>
                <p>
                  {result
                    ? `${result.file_info.size_kb} KB`
                    : "--"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-content/[0.03]">
                <Lightbulb className="w-4 h-4 mb-2" />
                <p className="text-xs text-content/40">Tip</p>
                <p className="text-sm">
                  Auto detects issues in dataset
                </p>
              </div>
            </div>
          </div>

          {result && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                After Clean
              </h3>

              <div className="space-y-2 text-content/70">
                <p>Rows: {result.after_clean.rows}</p>
                <p>Columns: {result.after_clean.columns}</p>
                <p>
                  Duplicate Rows:{" "}
                  {result.after_clean.duplicate_rows}
                </p>
                <p>
                  Missing Rows:{" "}
                  {
                    result.after_clean
                      .rows_with_missing_values
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
