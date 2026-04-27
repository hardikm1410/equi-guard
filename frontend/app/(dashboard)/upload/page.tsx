"use client";

import { PageHeader } from "@/components/page-components";
import {
  FileText,
  Columns,
  HardDrive,
  Lightbulb,
  ArrowRight,
  Check,
  CloudUpload,
  ChevronDown,
  HelpCircle,
  Loader2,
} from "lucide-react";

import { useState } from "react";
import AppTour from "@/components/AppTour";
import { UPLOAD_STEPS } from "@/lib/tour-steps";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/constants";

export default function UploadPage() {
  const router = useRouter();

  const [dragOver, setDragOver] = useState(false);
  const [tourRun, setTourRun] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const [targetVar, setTargetVar] = useState("");
  const [protectedAttr, setProtectedAttr] = useState("");
  const [prediction, setPrediction] = useState("");

  const [analyzing, setAnalyzing] = useState(false);

  const [summary, setSummary] = useState({
    rows: "—",
    columns: "—",
    size: "—",
  });

  const handleFile = (selected: File) => {
    setFile(selected);
    setUploaded(true);

    const sizeMB = (selected.size / 1024 / 1024).toFixed(2);

    setSummary({
      rows: "Ready",
      columns: "Auto Detect",
      size: `${sizeMB} MB`,
    });
  };

  const handleAnalyze = async () => {
    if (!file || !targetVar || !protectedAttr) return;

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target", targetVar);
      formData.append("protected", protectedAttr);

<<<<<<< HEAD
      // If predictions are provided, we use the evaluate-model endpoint
      // Otherwise, we use the bias detection endpoint
      const endpoint = prediction ? "/evaluate-model" : "/bias";
      
      // Note: for evaluate-model, backend expects 'dataset' and 'predictions' fields
      // but here we are sending as a single file if prediction is just a column name.
      // If prediction is a column name, we use /bias which handles it better.
      // The backend /bias endpoint doesn't currently take prediction column, 
      // but it calculates correlation with target.
      
      const response = await fetch(`${API_URL}/bias`, {
=======
      const response = await fetch("http://localhost:8000/analyze", {
>>>>>>> 992e7170fb964bd4580c8b63cc1310ef9d156910
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const result = await response.json();
      localStorage.setItem("last_bias_result", JSON.stringify(result));
      router.push("/bias-detection");
    } catch (error) {
      console.error(error);
      alert("Failed to analyze file. Please check if the backend is running and the columns exist.");
    } finally {
      setAnalyzing(false);
    }
  };

<<<<<<< HEAD
  const aboutItems = [
    { icon: FileText, label: "Rows", value: summary.rows },
    { icon: Columns, label: "Columns", value: summary.columns },
    { icon: HardDrive, label: "File Size", value: summary.size },
    {
      icon: Lightbulb,
      label: "Tip",
      value: "Make sure your dataset contains target and protected columns.",
    },
  ];
=======
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
        "http://localhost:8000/download-cleaned",
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
>>>>>>> 992e7170fb964bd4580c8b63cc1310ef9d156910

  return (
    <div className="max-w-5xl mx-auto">
      <AppTour
        steps={UPLOAD_STEPS}
        run={tourRun}
        onFinish={() => setTourRun(false)}
      />

      <div className="mb-6">
        <PageHeader
          title="Upload & Analyze"
          description="Upload dataset and detect fairness issues automatically."
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

      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex gap-2 mb-4 flex-wrap">
          {["Upload Data", "Configure", "Analyze", "Complete"].map(
            (step, i) => (
              <span
                key={step}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  i === 0
                    ? "bg-content/[0.1] text-content border border-content/[0.1]"
                    : "bg-content/[0.03] text-content/40 border border-transparent"
                }`}
              >
                {step}
              </span>
            )
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) handleFile(dropped);
          }}
          className={`border-2 border-dashed rounded-xl text-center py-16 px-6 transition-all cursor-pointer ${
            dragOver
              ? "border-primary bg-content/[0.03]"
              : uploaded ? "border-content/30 bg-content/[0.02]" : "border-content/20 hover:bg-content/[0.01]"
          }`}
          onClick={() => !uploaded && document.getElementById('fileUpload')?.click()}
        >
          <input
            id="fileUpload"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFile(selected);
            }}
          />

          <div className="w-20 h-20 mx-auto rounded-full bg-content/[0.05] flex items-center justify-center mb-4 transition-transform hover:scale-110">
            {uploaded ? (
              <Check className="w-10 h-10 text-content/70" />
            ) : (
              <CloudUpload className="w-10 h-10 text-content/40" />
            )}
          </div>

          {uploaded ? (
            <>
              <p className="text-lg font-bold text-content">{file?.name}</p>
              <p className="text-sm text-content/40 mt-1">File selected successfully</p>
              <button 
                onClick={(e) => { e.stopPropagation(); setUploaded(false); setFile(null); }}
                className="mt-4 text-xs font-medium text-content/30 hover:text-content/60 underline"
              >
                Change File
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-content">Drag & Drop your dataset</p>
              <p className="text-sm text-content/40 mt-1">CSV or Excel files up to 100MB</p>
              <div className="inline-flex mt-6 px-6 py-2.5 rounded-xl border border-content/10 bg-content/[0.04] text-sm font-semibold text-content/60 hover:bg-content/[0.08] transition-all">
                Browse Files
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-bold text-lg text-content mb-4">Configure Analysis</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-content/60 mb-2">Target Column</label>
              <div className="relative">
                <input
                  type="text"
                  value={targetVar}
                  onChange={(e) => setTargetVar(e.target.value)}
                  placeholder="e.g. hired, approved, selected"
                  className="w-full bg-content/[0.03] border border-content/[0.08] rounded-lg px-4 py-2.5 text-sm text-content/80 focus:outline-none focus:border-content/30 focus:ring-2 focus:ring-content/10 transition-all"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-content/60 mb-2">Protected Column</label>
              <div className="relative">
                <input
                  type="text"
                  value={protectedAttr}
                  onChange={(e) => setProtectedAttr(e.target.value)}
                  placeholder="e.g. gender, race, age"
                  className="w-full bg-content/[0.03] border border-content/[0.08] rounded-lg px-4 py-2.5 text-sm text-content/80 focus:outline-none focus:border-content/30 focus:ring-2 focus:ring-content/10 transition-all"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-content/60 mb-2">Prediction Column (Optional)</label>
              <input
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                placeholder="Column containing model predictions"
                className="w-full bg-content/[0.03] border border-content/[0.08] rounded-lg px-4 py-2.5 text-sm text-content/80 focus:outline-none focus:border-content/30 focus:ring-2 focus:ring-content/10 transition-all"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !file || !targetVar || !protectedAttr}
              className="w-full bg-cta text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold hover:bg-cta/90 transition-all shadow-lg shadow-cta/10 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze & Detect Bias
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-bold text-lg text-content mb-4">About Your Data</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {aboutItems.map((item) => (
                <div key={item.label} className={cn("bg-content/[0.02] border border-content/[0.06] rounded-xl p-4", item.label === "Tip" ? "sm:col-span-3" : "")}>
                  <div className="flex gap-2 items-center mb-2">
                    <item.icon className="w-4 h-4 text-content/40" />
                    <span className="text-xs font-bold text-content/30 uppercase tracking-wider">{item.label}</span>
                  </div>
                  <p className="text-sm font-medium text-content/70">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-bold text-lg text-content mb-4">Quick Guide</h3>
            <div className="space-y-4">
              {["Upload dataset file (CSV/Excel)", "Identify the target/outcome column", "Identify the protected demographic column", "Run analysis to find selection disparities"].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-content/[0.08] border border-content/[0.12] flex items-center justify-center text-xs font-bold text-content/60 shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-content/50 mt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
