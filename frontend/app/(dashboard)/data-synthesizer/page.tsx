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
} from "lucide-react";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth-context";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const { user } = useAuth();

  // =====================================
  // ANALYZE
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

      const response = await fetch(`${API_URL}/synthesize`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      // Save to Firestore History
      if (db && user) {
        try {
          await addDoc(collection(db, "history"), {
            userId: user.uid,
            userEmail: user.email,
            name: file.name,
            type: "Data Synthesis",
            scoreBefore: (data.fairnessBefore / 100).toFixed(2),
            scoreAfter: (data.fairnessAfter / 100).toFixed(2),
            status: "Improved",
            date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            timestamp: serverTimestamp(),
            metrics: {
              rowsAdded: data.generatedRows,
              improvement: data.improvement,
              fairnessBefore: data.fairnessBefore,
              fairnessAfter: data.fairnessAfter
            }
          });
        } catch (fsError) {
          console.error("Firestore Error:", fsError);
        }
      }
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

      const response = await fetch(`${API_URL}/download-synthesized`,
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
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-content/70 bg-content/[0.06] border border-content/[0.1] px-4 py-2 rounded-lg hover:bg-content/[0.1]">
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

        {/* SUMMARY */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-content mb-1">
            Dataset Summary
          </h3>

          <p className="text-sm text-content/30 mb-5">
            Auto-detected structure
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-content/[0.02] p-4 rounded-lg">
              <FileText className="w-4 h-4 mb-2" />
              <p className="text-xs">Rows</p>
              <p>{result ? result.rowsBefore : "—"}</p>
            </div>

            <div className="bg-content/[0.02] p-4 rounded-lg">
              <Columns className="w-4 h-4 mb-2" />
              <p className="text-xs">Columns</p>
              <p>
                {result?.preview
                  ? Object.keys(result.preview[0] || {}).length
                  : "—"}
              </p>
            </div>

            <div className="bg-content/[0.02] p-4 rounded-lg">
              <HardDrive className="w-4 h-4 mb-2" />
              <p className="text-xs">After Rows</p>
              <p>{result ? result.rowsAfter : "—"}</p>
            </div>

            <div className="bg-content/[0.02] p-4 rounded-lg">
              <Lightbulb className="w-4 h-4 mb-2" />
              <p className="text-xs">Generated</p>
              <p>{result ? result.generatedRows : "—"}</p>
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-content/[0.02] rounded-lg">
              <p className="text-sm">Protected</p>
              <p>{result.protected}</p>
            </div>

            <div className="p-4 bg-content/[0.02] rounded-lg">
              <p className="text-sm">Target</p>
              <p>{result.target}</p>
            </div>

            <div className="p-4 bg-content/[0.02] rounded-lg">
              <p className="text-sm">Rows Added</p>
              <p>{result.generatedRows}</p>
            </div>

            <div className="p-4 bg-content/[0.02] rounded-lg">
              <p className="text-sm">Fairness Before</p>
              <p>{result.fairnessBefore?.toFixed(2)}%</p>
            </div>

            <div className="p-4 bg-content/[0.02] rounded-lg">
              <p className="text-sm">Fairness After</p>
              <p>{result.fairnessAfter?.toFixed(2)}%</p>
            </div>

            <div className="p-4 bg-content/[0.02] rounded-lg">
              <p className="text-sm">Improvement</p>
              <p>+{result.improvement?.toFixed(2)}%</p>
            </div>

            <div className="p-4 bg-content/[0.02] rounded-lg">
              <p className="text-sm">Bias Gap Before</p>
              <p>{result.biasGapBefore}</p>
            </div>

            <div className="p-4 bg-content/[0.02] rounded-lg">
              <p className="text-sm">Bias Gap After</p>
              <p>{result.biasGapAfter}</p>
            </div>
          </div>
          
          <p className="mb-5">
            Generated {result.generatedRows} synthetic rows to improve fairness.
          </p>

          <button
            onClick={handleDownload}
            className="bg-primary text-white px-5 py-3 rounded-xl"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download Balanced Dataset
          </button>

          {/* PREVIEW TABLE */}
          {result.preview && (
            <div className="mt-6 overflow-x-auto">
              <h4 className="mb-2 font-semibold">Preview</h4>
              <table className="min-w-full text-sm border">
                <thead>
                  <tr>
                    {Object.keys(result.preview[0]).map((col) => (
                      <th key={col} className="border px-2 py-1">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.preview.map((row: any, i: number) => (
                    <tr key={i}>
                      {Object.values(row).map((val: any, j: number) => (
                        <td key={j} className="border px-2 py-1">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
