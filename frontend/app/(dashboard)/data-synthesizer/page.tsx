"use client";

import { PageHeader } from "@/components/page-components";
import { useState } from "react";
import {
  Database,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Loader2,
  Upload,
  Check,
  CloudUpload,
  FileText,
} from "lucide-react";

import AppTour from "@/components/AppTour";
import { DATA_SYNTHESIZER_STEPS } from "@/lib/tour-steps";

export default function DataSynthesizerPage() {
  const [tourRun, setTourRun] = useState(false);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [stats, setStats] = useState<any>(null);

  const handleFileUpload = (selected: File) => {
    setFile(selected);
    setUploaded(true);

    // Dummy preview stats
    setStats({
      rows: 1000,
      columns: 12,
      missing: 47,
      duplicate: 19,
    });
  };

  const handleSynthesize = async () => {
    if (!file) {
      alert("Upload dataset first");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert("Synthetic Data Generated Successfully");
    }, 2000);
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

      {/* Upload Card */}
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
                <p>Drag CSV here or click to upload</p>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-content/40">Rows</p>
            <h3 className="text-2xl font-bold">{stats.rows}</h3>
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-content/40">Columns</p>
            <h3 className="text-2xl font-bold">{stats.columns}</h3>
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-content/40">
              Missing Values
            </p>
            <h3 className="text-2xl font-bold">
              {stats.missing}
            </h3>
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-content/40">
              Duplicate Rows
            </p>
            <h3 className="text-2xl font-bold">
              {stats.duplicate}
            </h3>
          </div>
        </div>
      )}

      {/* Action */}
      {stats && (
        <div className="glass-card rounded-xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              Ready to Generate Fair Data
            </h3>
          </div>

          <p className="text-content/50 mb-5">
            AI will balance the dataset, reduce bias,
            preserve relationships, and generate new
            synthetic rows.
          </p>

          <button
            onClick={handleSynthesize}
            className="w-full bg-cta text-cta-foreground rounded-xl py-3 font-semibold flex justify-center gap-2"
          >
            <Database className="w-4 h-4" />
            Synthesize Data
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
