"use client";

import { PageHeader } from "@/components/page-components";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Check,
  CloudUpload,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import AppTour from "@/components/AppTour";
import { BIAS_DETECTION_STEPS } from "@/lib/tour-steps";
import { useAuth } from "@/components/auth-context";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";

export default function BiasDetectionPage() {
  const { contentRgb } = useTheme();
  const cr = contentRgb;

  const { user } = useAuth();
  const isDemo = user?.email === DEMO_USER_EMAIL;

  const [tourRun, setTourRun] = useState(false);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [target, setTarget] = useState("");
  const [protectedCol, setProtectedCol] = useState("");

  const [data, setData] = useState<any>(null);

  // Demo mode
  useEffect(() => {
    if (isDemo) {
      setData({
        keyInsights: [
          "Females are less likely to be selected",
          "Selection rate differs by gender",
        ],
        biasMetricsSummary: [
          {
            name: "Disparate Impact",
            value: "0.62",
            threshold: "< 0.80",
            status: "fail",
          },
        ],
        topBiasedFeatures: [
          { name: "gender", severity: 0.92 },
          { name: "experience", severity: 0.66 },
        ],
        selectionRateData: [
          {
            name: "Male",
            value: 72,
            color: "var(--primary)",
          },
          {
            name: "Female",
            value: 45,
            color: "var(--secondary-foreground)",
          },
        ],
        biasScore: 0.72,
        biasStatus: "High Bias Detected",
      });
    }
  }, [isDemo]);

  // Analyze API Call
  const handleAnalyze = async () => {
    if (!file || !target || !protectedCol) {
      alert("Upload file and fill all fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target", target);
      formData.append("protected", protectedCol);

      const response = await fetch("http://localhost:8000/bias", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      const colors = [
        "var(--primary)",
        "var(--secondary-foreground)",
        "var(--muted-foreground)",
        "#8884d8",
        "#82ca9d",
      ];

      const chartData =
        result.selectionRateData?.map((item: any, index: number) => ({
          ...item,
          color: colors[index % colors.length],
        })) || [];

      setData({
        ...result,
        selectionRateData: chartData,
      });
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: any[];
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card rounded-lg p-3 text-xs border border-content/10">
          <p className="text-content font-medium">
            {payload[0].name}: {payload[0].value}%
          </p>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-content/20 mb-4" />
        <p className="text-content/40 font-medium">
          Running bias analysis...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AppTour
        steps={BIAS_DETECTION_STEPS}
        run={tourRun}
        onFinish={() => setTourRun(false)}
      />

      <PageHeader
        title="Bias Detection"
        description="Detailed bias analysis results and fairness metrics."
        action={
          <button
            onClick={() => setTourRun(true)}
            className="p-2 rounded-xl border border-content/10"
          >
            <HelpCircle className="w-5 h-5 text-content/50" />
          </button>
        }
      />

      {/* Upload Section */}
      <div className="glass-card rounded-xl p-6 mt-6 mb-6">
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

            if (dropped) {
              setFile(dropped);
              setUploaded(true);
            }
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

              if (selected) {
                setFile(selected);
                setUploaded(true);
              }
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

        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <input
            placeholder="Target Column"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="border rounded-lg px-4 py-3 bg-background"
          />

          <input
            placeholder="Protected Column"
            value={protectedCol}
            onChange={(e) => setProtectedCol(e.target.value)}
            className="border rounded-lg px-4 py-3 bg-background"
          />
        </div>

        <button
          onClick={handleAnalyze}
          className="mt-5 w-full bg-cta text-cta-foreground rounded-xl py-3 font-semibold flex justify-center gap-2"
        >
          Analyze Bias
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {!data ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-content/20" />
          <h3 className="text-xl font-bold mb-2">
            No analysis yet
          </h3>
          <p className="text-content/40">
            Upload dataset and click Analyze Bias
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg
                    className="w-28 h-28 -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={`rgba(${cr},0.08)`}
                      strokeWidth="8"
                    />

                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${
                        2 *
                        Math.PI *
                        52 *
                        (1 - data.biasScore)
                      }`}
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">
                      {data.biasScore}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-content/60">
                    {data.biasStatus}
                  </p>
                  <h3 className="text-xl font-bold">
                    Bias Score
                  </h3>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Selection Rate by Group
              </h3>

              <div className="w-full h-64">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={data.selectionRateData}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={85}
                    >
                      {data.selectionRateData.map(
                        (entry: any, index: number) => (
                          <Cell
                            key={index}
                            fill={entry.color}
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">
            {/* Insights */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Key Insights
              </h3>

              <div className="space-y-3">
                {data.keyInsights?.map(
                  (item: string, i: number) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start"
                    >
                      <AlertTriangle className="w-4 h-4 mt-1 text-content/50" />
                      <p className="text-sm text-content/60">
                        {item}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Bias Metrics
              </h3>

              {data.biasMetricsSummary?.map(
                (m: any, i: number) => (
                  <div key={i} className="mb-4">
                    <p>{m.name}</p>
                    <p className="text-xl font-bold">
                      {m.value}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Top Features */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Top Biased Features
              </h3>

              <div className="space-y-4">
                {data.topBiasedFeatures?.map(
                  (item: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.name}</span>
                        <span>{item.severity}</span>
                      </div>

                      <div className="w-full h-2 bg-content/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${
                              item.severity * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
