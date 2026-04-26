from fastapi import APIRouter, UploadFile, File, Form
import pandas as pd
import numpy as np
import io

router = APIRouter()


# ==========================================
# HELPERS
# ==========================================
def preprocess_target(df, target):
    if df[target].dtype == "object":
        df[target] = df[target].astype(str).str.lower().str.strip()

        mapping = {
            "yes": 1, "true": 1, "approved": 1,
            "pass": 1, "selected": 1, "hired": 1,

            "no": 0, "false": 0, "denied": 0,
            "fail": 0, "rejected": 0
        }

        df[target] = df[target].map(mapping)

        if df[target].isnull().sum() > 0:
            df[target] = df[target].astype("category").cat.codes

    if df[target].dtype == "bool":
        df[target] = df[target].astype(int)

    return df


def calculate_bias(df, protected, target):
    group_rates = df.groupby(protected)[target].mean() * 100

    max_rate = group_rates.max()
    min_rate = group_rates.min()

    disparity = float(max_rate - min_rate)
    ratio = float(min_rate / max_rate) if max_rate != 0 else 0

    return group_rates, disparity, ratio


def analyze_features(df, target):
    result = []

    numeric_cols = df.select_dtypes(include=np.number).columns

    for col in numeric_cols:
        if col != target:
            try:
                corr = abs(df[col].corr(df[target]))
                if pd.notnull(corr):
                    result.append({
                        "name": col,
                        "severity": round(float(corr), 2)
                    })
            except:
                pass

    result = sorted(result, key=lambda x: x["severity"], reverse=True)

    return result[:5]


# ==========================================
# API
# ==========================================
@router.post("/bias")
async def bias_detection(
    file: UploadFile = File(...),
    target: str = Form(...),
    protected: str = Form(...)
):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))

        df.columns = df.columns.str.lower().str.strip().str.replace(" ", "_")

        target = target.lower().strip().replace(" ", "_")
        protected = protected.lower().strip().replace(" ", "_")

        df = df.drop_duplicates()

        for col in df.select_dtypes(include=np.number).columns:
            df[col] = df[col].fillna(df[col].median())

        for col in df.select_dtypes(include="object").columns:
            df[col] = df[col].fillna(df[col].mode()[0])

        df = preprocess_target(df, target)

        group_rates, disparity, ratio = calculate_bias(df, protected, target)

        bias_score = round(1 - ratio, 2)

        bias_status = (
            "High Bias Detected"
            if bias_score >= 0.70 else
            "Moderate Bias"
            if bias_score >= 0.40 else
            "Low Bias"
        )

        selection_rate_data = [
            {"name": str(group), "value": round(float(val), 2)}
            for group, val in group_rates.items()
        ]

        top_features = analyze_features(df, target)

        return {
            "biasScore": bias_score,
            "biasStatus": bias_status,
            "selectionRateData": selection_rate_data,
            "keyInsights": [
                f"Selection gap is {round(disparity,2)}%",
                "80% rule failed" if ratio < 0.80 else "80% rule passed"
            ],
            "biasMetricsSummary": [
                {
                    "name": "Disparate Impact",
                    "value": round(ratio, 2),
                    "status": "fail" if ratio < 0.80 else "pass"
                }
            ],
            "topBiasedFeatures": top_features
        }

    except Exception as e:
        return {"error": str(e)}
