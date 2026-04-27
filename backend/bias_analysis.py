from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import io

router = APIRouter()

@router.post("/bias")
async def bias_detection(
    file: UploadFile = File(...),
    target: str = Form(...),
    protected: str = Form(...)
):
    try:
        content = await file.read()

        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))

        df.columns = (
            df.columns.str.lower()
            .str.strip()
            .str.replace(" ", "_", regex=False)
        )

        target = target.lower().strip().replace(" ", "_")
        protected = protected.lower().strip().replace(" ", "_")

        if target not in df.columns:
            return {"error": f"Target column '{target}' not found"}

        if protected not in df.columns:
            return {"error": f"Protected column '{protected}' not found"}

        group_rates = df.groupby(protected)[target].mean() * 100

        max_rate = group_rates.max()
        min_rate = group_rates.min()

        ratio = round(float(min_rate / max_rate), 2) if max_rate else 0
        bias_score = round(1 - ratio, 2)

        outcome = {
            "biasScore": bias_score,
            "biasStatus": "High Bias" if bias_score > 0.7 else "Low Bias",
            "selectionRateData": [
                {
                    "name": str(group),
                    "value": round(float(val), 2)
                }
                for group, val in group_rates.items()
            ],
            "keyInsights": [
                "Bias calculated successfully"
            ],
            "biasMetricsSummary": [
                {
                    "name": "Disparate Impact",
                    "value": ratio
                }
            ],
            "topBiasedFeatures": []
        }        
        
        return outcome

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )