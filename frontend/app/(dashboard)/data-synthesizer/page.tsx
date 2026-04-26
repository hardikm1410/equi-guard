"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-components";
import {
  Loader2,
  CloudUpload,
  Check,
  Download,
  Sparkles,
} from "lucide-react";

import { API_URL } from "@/lib/constants";

export default function DataSynthesizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<any>(null);

  const handleFile = (selected: File) => {
    setFile(selected);
    setUploaded(true);
    setData(null);
  };

  const handleSynthesize = async () => {
    if (!file) {
      alert("Upload file first");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${API_URL}/synthesize`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await res.json();

      if (result.error) {
        alert(result.error);
      } else {
        setData(result);
      }
    } catch {
      alert("Backend failed");
    }

    setLoading(false);
  };

  const handleDownload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${API_URL}/download-synthesized`,
      {
        method: "POST",
        body: formData,
      }
    );

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "balanced_dataset.csv";
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Data Synthesizer"
        description="Upload file and generate fair balanced data."
      />

      <div className="glass-card rounded-xl p-6 mt-6">
        <input
          hidden
          type="file"
          id="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <label
          htmlFor="file"
          className="cursor-pointer block border-2 border-dashed rounded-xl p-10 text-center"
        >
          {uploaded ? (
            <>
              <Check className="w-10 h-10 mx-auto text-green-500 mb-3" />
              <p>{file?.name}</p>
            </>
          ) : (
            <>
              <CloudUpload className="w-10 h-10 mx-auto mb-3" />
              <p>Upload Dataset</p>
            </>
          )}
        </label>

        <button
          onClick={handleSynthesize}
          className="w-full mt-5 bg-cta text-white py-3 rounded-xl"
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Synthesize Data
        </button>
      </div>

      {data && (
        <div className="glass-card rounded-xl p-6 mt-6">
          <p>Rows: {data.rows}</p>
          <p>Columns: {data.columns}</p>
          <p>Missing: {data.missing}</p>
          <p>Duplicate: {data.duplicate}</p>

          <p className="mt-4">
            Protected Column: {data.protected}
          </p>

          <p>Target Column: {data.target}</p>

          <p className="mt-4">
            Fairness Before: {data.fairnessBefore}%
          </p>

          <p>
            Fairness After: {data.fairnessAfter}%
          </p>

          <p>
            Improvement: {data.improvement}%
          </p>

          <button
            onClick={handleDownload}
            className="w-full mt-5 bg-primary text-white py-3 rounded-xl"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download Balanced CSV
          </button>
        </div>
      )}
    </div>
  );
}
