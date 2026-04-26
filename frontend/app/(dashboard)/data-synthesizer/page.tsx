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
  ShieldAlert,
  Sparkles,
  Download,
} from "lucide-react";

import { useState } from "react";
import { API_URL } from "@/lib/constants";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fairLoading, setFairLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);

  const [targetVar, setTargetVar] = useState("");
  const [protectedAttr, setProtectedAttr] = useState("");

  const [result, setResult] = useState<any>(null);
  const [fairResult, setFairResult] = useState<any>(null);

  // ========================================
  // ANALYZE DATA
  // ========================================
  const handleAnalyze = async () => {
    if (!file || !targetVar || !protectedAttr) {
      alert("Upload file and enter fields.");
      return;
    }

    setAnalyzing(true);
    setFairResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target", targetVar);
      formData.append("protected", protectedAttr);

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    } finally {
      setAnalyzing(false);
    }
  };

  // ========================================
  // MAKE FAIR DATASET
  // ========================================
  const handleMakeFair = async () => {
    if (!file) return;

    setFairLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/download-synthesized`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        alert("Failed to generate fair dataset");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "fair_dataset.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      setFairResult({
        success: true,
      });
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    } finally {
      setFairLoading(false);
    }
  };

  const isUnfair =
    result &&
    result.biasScore !== undefined &&
    Number(result.biasScore) > 0.4;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Upload & Analyze"
        description="Upload dataset, detect bias, and make your data fair."
      />

      {/* Upload */}
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
            }
          }}
          className={`border-2 border-dashed rounded-xl py-14 px-6 text-center ${
            dragOver
              ? "border-primary"
              : "border-content/20"
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
            {uploaded ? (
              <>
                <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="font-semibold">{file?.name}</p>
              </>
            ) : (
              <>
                <CloudUpload className="w-12 h-12 mx-auto mb-4 text-content/50" />
                <p>Drag file here or click upload</p>
              </>
            )}
          </label>
        </div>

        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <input
            value={targetVar}
            onChange={(e) => setTargetVar(e.target.value)}
            placeholder="Target Column (Ex: hired)"
            className="border rounded-lg px-4 py-3 bg-background"
          />

          <input
            value={protectedAttr}
            onChange={(e) => setProtectedAttr(e.target.value)}
            placeholder="Protected Column (Ex: gender)"
            className="border rounded-lg px-4 py-3 bg-background"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full mt-5 bg-cta text-cta-foreground rounded-xl py-3 font-semibold flex justify-center gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Dataset
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">
              Dataset Summary
            </h3>

            <div className="space-y-2 text-content/70">
              <p>Rows: {result.file_info?.rows}</p>
              <p>Columns: {result.file_info?.columns}</p>
              <p>Size: {result.file_info?.size_kb} KB</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">
              Bias Result
            </h3>

            <div className="space-y-2">
              <p>Status: {result.biasStatus}</p>
              <p>Bias Score: {result.biasScore}</p>
            </div>
          </div>
        </div>
      )}

      {/* If Unfair */}
      {isUnfair && (
        <div className="glass-card rounded-xl p-6 mt-6 border border-red-400/20">
          <div className="flex gap-3 items-start mb-4">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-bold text-lg">
                Dataset is Unfair
              </h3>
              <p className="text-content/60">
                Bias detected in this dataset. You can generate a balanced fair dataset.
              </p>
            </div>
          </div>

          <button
            onClick={handleMakeFair}
            disabled={fairLoading}
            className="w-full bg-cta text-cta-foreground rounded-xl py-3 font-semibold flex justify-center gap-2"
          >
            {fairLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Make Data Fair
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Success */}
      {fairResult?.success && (
        <div className="glass-card rounded-xl p-6 mt-6">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-green-500" />
            <p className="font-medium">
              Fair dataset downloaded successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
