"use client";

import { useState } from "react";
import {
  CloudUpload,
  Check,
  ArrowRight,
  Loader2,
  FileText,
  Columns,
  HardDrive,
  Lightbulb,
} from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [targetVar, setTargetVar] = useState("");
  const [protectedAttr, setProtectedAttr] = useState("");
  const [prediction, setPrediction] = useState("");

  // OUTPUT STATES
  const [rows, setRows] = useState("—");
  const [cols, setCols] = useState("—");
  const [size, setSize] = useState("—");

  // READ CSV + SHOW DETAILS
  const handleFileChange = async (selected: File) => {
    setFile(selected);
    setUploaded(true);

    // FILE SIZE
    const fileSizeMB = (selected.size / 1024 / 1024).toFixed(2) + " MB";
    setSize(fileSizeMB);

    // READ CSV TEXT
    const text = await selected.text();

    const lines = text.trim().split("\n");

    // ROWS
    const totalRows = lines.length - 1;
    setRows(String(totalRows));

    // COLUMNS
    const totalCols = lines[0].split(",").length;
    setCols(String(totalCols));
  };

  const handleAnalyze = async () => {
    if (!file || !targetVar || !protectedAttr) {
      alert("Please upload file and fill fields.");
      return;
    }

    setAnalyzing(true);

    setTimeout(() => {
      setAnalyzing(false);
      alert("Analysis Complete");
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Upload & Analyze</h1>
        <p className="text-gray-500">
          Upload dataset and see details instantly.
        </p>
      </div>

      {/* UPLOAD BOX */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
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

            if (dropped) handleFileChange(dropped);
          }}
          className={`border-2 border-dashed rounded-2xl p-16 text-center transition ${
            dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          <input
            type="file"
            hidden
            accept=".csv"
            id="fileUpload"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFileChange(selected);
            }}
          />

          <label htmlFor="fileUpload" className="cursor-pointer">
            {uploaded ? (
              <>
                <Check className="mx-auto text-green-500 w-12 h-12 mb-4" />
                <p className="font-semibold">{file?.name}</p>
                <p className="text-sm text-gray-500">Uploaded</p>
              </>
            ) : (
              <>
                <CloudUpload className="mx-auto w-12 h-12 mb-4 text-gray-500" />
                <p className="font-semibold">Drag & Drop CSV Here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </>
            )}
          </label>
        </div>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* LEFT */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6">
            Configure Analysis
          </h2>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Target Column
            </label>
            <input
              type="text"
              placeholder="Example: hired"
              value={targetVar}
              onChange={(e) => setTargetVar(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Protected Column
            </label>
            <input
              type="text"
              placeholder="Example: gender"
              value={protectedAttr}
              onChange={(e) => setProtectedAttr(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">
              Prediction Column
            </label>
            <input
              type="text"
              placeholder="Optional"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={
              analyzing ||
              !uploaded ||
              !targetVar ||
              !protectedAttr
            }
            className="w-full bg-black text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
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

        {/* RIGHT */}
        <div className="space-y-6">
          {/* OUTPUT SAME PAGE */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              About Your Data
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-xl p-4">
                <FileText className="mb-2 w-5 h-5" />
                <p className="text-sm text-gray-500">Rows</p>
                <p className="font-semibold">{rows}</p>
              </div>

              <div className="border rounded-xl p-4">
                <Columns className="mb-2 w-5 h-5" />
                <p className="text-sm text-gray-500">Columns</p>
                <p className="font-semibold">{cols}</p>
              </div>

              <div className="border rounded-xl p-4">
                <HardDrive className="mb-2 w-5 h-5" />
                <p className="text-sm text-gray-500">File Size</p>
                <p className="font-semibold">{size}</p>
              </div>

              <div className="border rounded-xl p-4">
                <Lightbulb className="mb-2 w-5 h-5" />
                <p className="text-sm text-gray-500">Tip</p>
                <p className="font-semibold text-xs">
                  Upload CSV to auto detect details
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Quick Guide
            </h2>

            <div className="space-y-2 text-sm text-gray-600">
              <p>1. Upload CSV</p>
              <p>2. Rows auto shown</p>
              <p>3. Columns auto shown</p>
              <p>4. Size auto shown</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
