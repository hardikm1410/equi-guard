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

# ======================================================
# HELPERS - DATA LOADING
# ======================================================
def read_file(file_name, content):
    if file_name.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    elif file_name.endswith(".xlsx") or file_name.endswith(".xls"):
        return pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError("Only CSV / Excel files supported")


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
    possible = ["target", "label", "actual", "y_true", "selected", "approved", "result", "status"]
    for col in possible:
        if col in df.columns:
            return col
    return df.columns[-1]


def detect_prediction_column(df):
    possible = ["prediction", "predicted", "output", "y_pred", "decision", "result", "score"]
    for col in possible:
        if col in df.columns:
            return col
    # Fallback to the first column if none of the keywords match
    if len(df.columns) > 0:
        return df.columns[0]
    raise ValueError("The uploaded output file is empty or has no columns.")


def detect_protected_column(df):
    possible = ["gender", "sex", "race", "ethnicity", "group", "category"]
    for col in possible:
        if col in df.columns:
            return col
    return df.columns[0]


# ======================================================
# SAFE BINARY CONVERTER
# ======================================================
def convert_binary(series):
    mapping = {
        "yes": 1, "true": 1, "approved": 1, "selected": 1, "pass": 1, "hired": 1, "1": 1,
        "no": 0, "false": 0, "rejected": 0, "fail": 0, "not_selected": 0, "0": 0
    }

    # If numeric, ensure it is integer
    if pd.api.types.is_numeric_dtype(series):
        # If it's already 0/1 or similar, this is fine
        return series.fillna(0).astype(int)

    # If object/string, try to map then factorize
    lower = series.astype(str).str.lower().str.strip()
    mapped = lower.map(mapping)
    
    # If we managed to map at least half the values, use the mapping
    if mapped.notnull().sum() > (len(series) / 2):
        return mapped.fillna(0).astype(int)

    # Otherwise, just factorize (0, 1, 2...)
    encoded, _ = pd.factorize(lower)
    return pd.Series(encoded, index=series.index)


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
        dataset_content = await dataset.read()
        output_content = await output.read()

        dataset_df = read_file(dataset.filename, dataset_content)
        output_df = read_file(output.filename, output_content)

        dataset_df = clean_columns(dataset_df)
        output_df = clean_columns(output_df)

        # detect columns
        target_col = detect_target_column(dataset_df)
        protected_col = detect_protected_column(dataset_df)
        pred_col = detect_prediction_column(output_df)

        # merge - ensure prediction column is named uniquely to avoid name collision
        pred_series = output_df[pred_col].reset_index(drop=True)
        pred_series.name = "model_prediction_output"
        
        df = pd.concat(
            [
                dataset_df.reset_index(drop=True),
                pred_series
            ],
            axis=1
        )

        # convert binary columns
        df[target_col] = convert_binary(df[target_col])
        df["model_prediction_output"] = convert_binary(df["model_prediction_output"])

        # Update metrics to use the new column name
        overall = accuracy_score(df[target_col], df["model_prediction_output"])
        balanced = balanced_accuracy(df[target_col], df["model_prediction_output"])
        auc = auc_score(df[target_col], df["model_prediction_output"])
        fairness = fairness_score(df, protected_col, "model_prediction_output")
        group_scores = accuracy_by_group(df, protected_col, target_col, "model_prediction_output")
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
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


# ==============================
# AI REPORT GENERATION
# ==============================
class ReportInput(BaseModel):
    name: str
    type: str
    metrics: dict
    verdict: str

@router.post("/generate-ai-report")
async def generate_ai_report(input: ReportInput):
    try:
        print(f"Generating AI Report for: {input.name}")
        if not GEMINI_API_KEY:
            print("ERROR: GEMINI_API_KEY is missing from environment")
            return JSONResponse(status_code=500, content={"error": "Gemini API Key not configured"})

        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        
        metrics = input.metrics or {}
        
        prompt = f"""
        You are an AI Fairness Auditor for EquiGuard. 
        Write a professional, comprehensive Fairness Audit Report in Markdown format based on these results:
        
        Project Name: {input.name}
        Analysis Type: {input.type}
        Overall Fairness Score: {metrics.get('fairness_score', 'N/A')}%
        Overall Accuracy: {metrics.get('overall_accuracy', 'N/A')}%
        Performance Gap: {metrics.get('performance_gap', 'N/A')}%
        Verdict: {input.verdict}
        
        Detailed Accuracy by Group:
        {metrics.get('accuracy_by_group', 'Not provided')}
        
        The report should include:
        1. Executive Summary
        2. Methodology (briefly mention automated bias detection)
        3. Detailed Findings (analyze the group disparities)
        4. Technical Verdict
        5. Actionable Recommendations for bias mitigation.
        
        Format it beautifully with headers, bullet points, and tables where appropriate.
        """
        
        response = model.generate_content(prompt)
        return {"report_md": response.text}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/evaluation-status")
def evaluation_status():
    return {"status": "Model evaluation router is active"}
