from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import pandas as pd
import io
import os
import google.generativeai as genai
from dotenv import load_dotenv

# ==============================
# SETUP
# ==============================
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()

# ==============================
# HELPERS
# ==============================
def load_df(file: UploadFile):
    content = file.file.read()

    if file.filename.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))

    elif file_name.endswith(".xlsx") or file_name.endswith(".xls"):
        return pd.read_excel(io.BytesIO(content))

    else:
        raise ValueError("Only CSV / Excel files supported")


# ======================================================
# CLEAN COLUMNS
# ======================================================
def clean_columns(df):
    df.columns = (
        df.columns.str.lower()
        .str.strip()
        .str.replace(" ", "_", regex=False)
    )
    return df


# ======================================================
# AUTO DETECT COLUMNS
# ======================================================
def detect_target_column(df):
    possible = [
        "target",
        "label",
        "actual",
        "y_true",
        "selected",
        "approved",
        "result",
        "status"
    ]

    for col in possible:
        if col in df.columns:
            return col

    return df.columns[-1]


def detect_prediction_column(df):
    possible = [
        "prediction",
        "predicted",
        "output",
        "y_pred",
        "decision",
        "result",
        "score"
    ]

    for col in possible:
        if col in df.columns:
            return col

    raise ValueError(
        "Prediction column not found. "
        "Use one of: prediction, predicted, output, y_pred"
    )


def detect_protected_column(df):
    possible = [
        "gender",
        "sex",
        "race",
        "ethnicity",
        "group",
        "category"
    ]

    for col in possible:
        if col in df.columns:
            return col

    return df.columns[0]


# ======================================================
# SAFE BINARY CONVERTER
# ======================================================
def convert_binary(series):
    mapping = {
        "yes": 1,
        "true": 1,
        "approved": 1,
        "selected": 1,
        "pass": 1,
        "hired": 1,
        "1": 1,

        "no": 0,
        "false": 0,
        "rejected": 0,
        "fail": 0,
        "not_selected": 0,
        "0": 0
    }

    # numeric already
    if pd.api.types.is_numeric_dtype(series):
        return series.fillna(0).astype(int)

    # text column
    if series.dtype == "object":
        lower = series.astype(str).str.lower().str.strip()

        mapped = lower.map(mapping)

        # if fully mapped
        if mapped.notnull().all():
            return mapped.astype(int)

        # if exactly 2 classes → encode automatically
        unique_vals = lower.dropna().unique()

        if len(unique_vals) == 2:
            encoded = pd.factorize(lower)[0]
            return pd.Series(encoded, index=series.index)

    raise ValueError(
        f"Column '{series.name}' is not binary."
    )


# ======================================================
# METRICS
# ======================================================
def accuracy_score(y_true, y_pred):
    return round((y_true == y_pred).mean() * 100, 2)


def balanced_accuracy(y_true, y_pred):
    tp = ((y_true == 1) & (y_pred == 1)).sum()
    tn = ((y_true == 0) & (y_pred == 0)).sum()

    fp = ((y_true == 0) & (y_pred == 1)).sum()
    fn = ((y_true == 1) & (y_pred == 0)).sum()

    tpr = tp / (tp + fn) if (tp + fn) else 0
    tnr = tn / (tn + fp) if (tn + fp) else 0

    return round(((tpr + tnr) / 2) * 100, 2)


def auc_score(y_true, y_pred):
    tp = ((y_true == 1) & (y_pred == 1)).sum()
    tn = ((y_true == 0) & (y_pred == 0)).sum()

    fp = ((y_true == 0) & (y_pred == 1)).sum()
    fn = ((y_true == 1) & (y_pred == 0)).sum()

    tpr = tp / (tp + fn) if (tp + fn) else 0
    fpr = fp / (fp + tn) if (fp + tn) else 0

    auc = (1 + tpr - fpr) / 2

    return round(auc * 100, 2)


def fairness_score(df, protected, pred_col):
    rates = df.groupby(protected)[pred_col].mean()

    max_rate = rates.max()
    min_rate = rates.min()

    if max_rate == 0:
        return 0

    return round((min_rate / max_rate) * 100, 2)


def accuracy_by_group(df, protected, y_true, y_pred):
    scores = {}

    groups = df[protected].unique()

    for grp in groups:
        sub = df[df[protected] == grp]

        acc = (sub[y_true] == sub[y_pred]).mean() * 100

        scores[str(grp)] = round(acc, 2)

    return scores


def performance_gap(group_scores):
    vals = list(group_scores.values())

    if len(vals) == 0:
        return 0

    return round(max(vals) - min(vals), 2)


# ==============================
# API ENDPOINT
# ==============================
@router.post("/compare-model")
async def compare_model(
    dataset: UploadFile = File(...),
    output: UploadFile = File(...)
):
    try:
        # read files
        train_content = await train_file.read()
        output_content = await output_file.read()

        train_df = read_file(train_file.filename, train_content)
        output_df = read_file(output_file.filename, output_content)

        train_df = clean_columns(train_df)
        output_df = clean_columns(output_df)

        # detect columns
        target_col = detect_target_column(train_df)
        protected_col = detect_protected_column(train_df)
        pred_col = detect_prediction_column(output_df)

        # merge
        df = pd.concat(
            [
                train_df.reset_index(drop=True),
                output_df[[pred_col]].reset_index(drop=True)
            ],
            axis=1
        )

        # convert binary columns
        df[target_col] = convert_binary(df[target_col])
        df[pred_col] = convert_binary(df[pred_col])

        # metrics
        overall = accuracy_score(df[target_col], df[pred_col])
        balanced = balanced_accuracy(df[target_col], df[pred_col])
        auc = auc_score(df[target_col], df[pred_col])

        fairness = fairness_score(
            df,
            protected_col,
            pred_col
        )

        group_scores = accuracy_by_group(
            df,
            protected_col,
            target_col,
            pred_col
        )

        gap = performance_gap(group_scores)

        # verdict
        if fairness < 80:
            verdict = "Bias Detected"
        else:
            verdict = "Fair Model"

        return {
            "message": "Evaluation Complete",

            "columns_detected": {
                "target": target_col,
                "prediction": pred_col,
                "protected": protected_col
            },

            "metrics": {
                "overall_accuracy": overall,
                "balanced_accuracy": balanced,
                "auc_score": auc,
                "fairness_score": fairness,
                "accuracy_by_group": group_scores,
                "performance_gap": gap
            },

            "verdict": verdict
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


# ==============================
# EXISTING ROUTES
# ==============================
class ResumeInput(BaseModel):
    resume_text: str


@router.post("/evaluate-resume")
def evaluate_resume(input: ResumeInput):
    return {
        "original_score": 85,
        "shadow_score": 72,
        "bias_detected": True,
        "bias_gap": 13,
        "verdict": "BIAS DETECTED"
    }


@router.get("/evaluation-status")
def evaluation_status():
    return {"status": "Model evaluation router is active"}
