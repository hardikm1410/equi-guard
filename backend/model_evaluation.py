import os
import pandas as pd
import io

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

import google.generativeai as genai
from dotenv import load_dotenv

# ==============================
# SETUP
# ==============================
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="EquiGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# HELPERS
# ==============================
def load_df(file: UploadFile):
    content = file.file.read()

    if file.filename.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    elif file.filename.endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError("Unsupported file format")


def clean_df(df):
    df.columns = df.columns.str.lower().str.strip().str.replace(" ", "_")
    return df


def detect_target(df):
    for col in ["target", "label", "result", "outcome"]:
        if col in df.columns:
            return col
    return df.columns[-1]


def detect_prediction(df):
    for col in ["prediction", "predicted", "output"]:
        if col in df.columns:
            return col
    return df.columns[-1]


def detect_protected(df):
    for col in ["gender", "sex", "race", "group"]:
        if col in df.columns:
            return col
    return df.columns[0]


# ==============================
# CORE ANALYSIS
# ==============================
def analyze(dataset, output):

    dataset = clean_df(dataset)
    output = clean_df(output)

    target = detect_target(dataset)
    prediction = detect_prediction(output)
    protected = detect_protected(dataset)

    # Align rows
    df = dataset.copy()
    df["prediction"] = output[prediction]

    # =========================
    # ACCURACY
    # =========================
    df["correct"] = (df[target] == df["prediction"]).astype(int)
    accuracy = df["correct"].mean() * 100

    # =========================
    # GROUP ACCURACY
    # =========================
    group_acc = (
        df.groupby(protected)["correct"]
        .mean()
        .sort_values(ascending=False)
    )

    accuracy_by_group = [
        {"group": str(k), "accuracy": round(v * 100, 2)}
        for k, v in group_acc.items()
    ]

    # =========================
    # FAIRNESS GAP
    # =========================
    max_acc = group_acc.max()
    min_acc = group_acc.min()

    gap = round((max_acc - min_acc) * 100, 2)

    fairness = round(min_acc / max_acc, 2) if max_acc != 0 else 0

    # =========================
    # BEST / WORST
    # =========================
    best_group = f"{group_acc.idxmax()} ({round(max_acc*100,2)}%)"
    worst_group = f"{group_acc.idxmin()} ({round(min_acc*100,2)}%)"

    # =========================
    # RECOMMENDATIONS
    # =========================
    recommendations = []

    if fairness < 0.8:
        recommendations.append("Model shows bias across groups")
        recommendations.append("Use re-sampling or re-weighting")
    else:
        recommendations.append("Model fairness is acceptable")

    if gap > 20:
        recommendations.append("High performance gap detected")

    # =========================
    # FINAL OUTPUT
    # =========================
    return {
        "accuracyByGroup": accuracy_by_group,
        "overallFairness": fairness,
        "fairnessStatus": "Good" if fairness >= 0.8 else "Bias Detected",
        "stats": {
            "overallAccuracy": f"{round(accuracy,2)}%",
            "balancedAccuracy": f"{round(group_acc.mean()*100,2)}%",
            "aucScore": "N/A"
        },
        "performanceGap": f"{gap}%",
        "bestGroup": best_group,
        "worstGroup": worst_group,
        "recommendations": recommendations
    }


# ==============================
# API ENDPOINT
# ==============================
@app.post("/compare-model")
async def compare_model(
    dataset: UploadFile = File(...),
    output: UploadFile = File(...)
):
    try:
        df_dataset = load_df(dataset)
        df_output = load_df(output)

        result = analyze(df_dataset, df_output)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# EXISTING ROUTES
# ==============================
class ResumeInput(BaseModel):
    resume_text: str


@app.post("/evaluate")
def evaluate(input: ResumeInput):
    return {
        "original_score": 85,
        "shadow_score": 72,
        "bias_detected": True,
        "bias_gap": 13,
        "verdict": "BIAS DETECTED"
    }


@app.get("/")
def root():
    return {"status": "EquiGuard API is running"}