"use client";

import { PageHeader } from "@/components/page-components";
import { useState } from "react";
import {
  Database,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Loader2,
  Check,
  CloudUpload,
  Download,
} from "lucide-react";

import AppTour from "@/components/AppTour";
import { DATA_SYNTHESIZER_STEPS } from "@/lib/tour-steps";
import { API_URL } from "@/lib/constants";

export default function DataSynthesizerPage() {
  const [tourRun, setTourRun] = useState(false);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [protectedCol, setProtectedCol] = useState("");
  const [targetCol, setTargetCol] = useState("");

  const [stats, setStats] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = (selected: File) => {
    setFile(selected);
    setUploaded(true);
    setStats(null);
    setResult(null);
  };

  const handleSynthesize = async () => {
    if (!file || !protectedCol || !targetCol) {
      alert("Upload file + enter Protected & Target column");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("protected", protectedCol);
      formData.append("target", targetCol);

      const response = await fetch(`${API_URL}/synthesize`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      setStats({
        rows: data.rows,
        columns: data.columns,
        missing: data.missing,
        duplicate: data.duplicate,
      });

      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !protectedCol || !targetCol) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("protected", protectedCol);
      formData.append("target", targetCol);

      const response = await fetch(
        `${API_URL}/download-synthesized`,
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
    } catch (error) {
      console.error(error);
      alert("Download failed");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-content/20 mb-4" />
        <p className="text-content/40 font-medium">
          Synthesizing fair dataset...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AppTour
        steps={DATA_SYNTHESIZER_STEPS}
        run={tourRun}
        onFinish={() => setTourRun(false)}
      />

      <PageHeader
        title="Data Synthesizer"
        description="Generate synthetic fair data from your dataset."
        action={
          <button
            onClick={() => setTourRun(true)}
            className="p-2 rounded-xl border border-content/10"
          >
            <HelpCircle className="w-5 h-5 text-content/50" />
          </button>
        }
      />

      {/* Upload */}
      <div className="glass-card rounded-xl p-6 mt-6">
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
            if (dropped) handleFileUpload(dropped);
          }}
          className={`border-2 border-dashed rounded-xl p-10 text-center ${
            dragOver ? "border-primary" : "border-content/20"
          }`}
        >
          <input
            hidden
            type="file"
            id="csvfile"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFileUpload(selected);
            }}
          />

          <label htmlFor="csvfile" className="cursor-pointer">
            {uploaded ? (
              <>
                <Check className="w-10 h-10 mx-auto mb-3 text-green-500" />
                <p>{file?.name}</p>
              </>
            ) : (
              <>
                <CloudUpload className="w-10 h-10 mx-auto mb-3 text-content/50" />
                <p>Drag CSV here or click</p>
              </>
            )}
          </label>
        </div>

        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <input
            placeholder="Protected Column"
            value={protectedCol}
            onChange={(e) =>
              setProtectedCol(e.target.value)
            }
            className="border rounded-lg px-4 py-3 bg-background"
          />

          <input
            placeholder="Target Column"
            value={targetCol}
            onChange={(e) => setTargetCol(e.target.value)}
            className="border rounded-lg px-4 py-3 bg-background"
          />
        </div>

        <button
          onClick={handleSynthesize}
          className="mt-5 w-full bg-cta text-cta-foreground rounded-xl py-3 font-semibold flex justify-center gap-2"
        >
          <Database className="w-4 h-4" />
          Synthesize Data
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-content/40">Rows</p>
            <h3 className="text-2xl font-bold">
              {stats.rows}
            </h3>
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-content/40">
              Columns
            </p>
            <h3 className="text-2xl font-bold">
              {stats.columns}
            </h3>
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-content/40">
              Missing
            </p>
            <h3 className="text-2xl font-bold">
              {stats.missing}
            </h3>
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-content/40">
              Duplicate
            </p>
            <h3 className="text-2xl font-bold">
              {stats.duplicate}
            </h3>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass-card rounded-xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              Synthesis Completed
            </h3>
          </div>

          <p className="text-content/50 mb-3">
            {result.recommendation}
          </p>

          <p className="mb-2">
            Fairness Before: {result.fairnessBefore}%
          </p>

          <p className="mb-2">
            Fairness After: {result.fairnessAfter}%
          </p>

          <p className="mb-5">
            Improvement: {result.improvement}%
          </p>

          <button
            onClick={handleDownload}
            className="w-full bg-primary text-white rounded-xl py-3 font-semibold flex justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Balanced CSV
          </button>
        </div>
      )}
    </div>
  );
}
