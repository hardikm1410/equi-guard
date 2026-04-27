from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
import numpy as np
import io

router = APIRouter()

# ==========================================
# LOAD DATA
# ==========================================
def load_dataframe(file_name, content):
    if file_name.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    elif file_name.endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError("Unsupported file type")


# ==========================================
# FULL CLEANING
# ==========================================
def full_clean_data(df):
    # Standardize column names
    df.columns = (
        df.columns.str.lower()
        .str.strip()
        .str.replace(" ", "_", regex=False)
    )

    # Remove duplicates
    df = df.drop_duplicates()

    # Handle missing values
    for col in df.columns:
        if df[col].dtype in ["int64", "float64"]:
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = df[col].fillna(df[col].mode()[0])

    # Normalize categorical
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype(str).str.strip().str.lower()

    return df.reset_index(drop=True)


# ==========================================
# AUTO DETECTION
# ==========================================
def auto_detect_protected(df):
    for col in ["gender", "sex", "race", "ethnicity", "category"]:
        if col in df.columns:
            return col
    return df.columns[0]


def auto_detect_target(df):
    for col in ["selected", "approved", "target", "result", "status", "hired", "pass"]:
        if col in df.columns:
            return col
    return df.columns[-1]


# ==========================================
# TARGET PROCESSING
# ==========================================
def preprocess_target(df, target):
    if df[target].dtype == "object":
        df[target] = df[target].astype(str).str.lower()

        mapping = {
            "yes": 1, "true": 1, "approved": 1, "selected": 1,
            "hired": 1, "pass": 1,
            "no": 0, "false": 0, "rejected": 0, "fail": 0
        }

        df[target] = df[target].map(mapping)

        if df[target].isnull().sum() > 0:
            df[target] = df[target].astype("category").cat.codes

    if df[target].dtype == "bool":
        df[target] = df[target].astype(int)

    return df


# ==========================================
# FAIRNESS
# ==========================================
def calculate_bias(data, protected, target):
    rates = data.groupby(protected)[target].mean()

    max_rate = rates.max()
    min_rate = rates.min()

    ratio = min_rate / max_rate if max_rate != 0 else 0
    fairness = round(ratio * 100, 2)
    gap = round(max_rate - min_rate, 4)

    return rates, fairness, gap


def compute_imbalance(data, protected):
    counts = data[protected].value_counts()
    max_count = counts.max()

    imbalance = {
        grp: int(max_count - cnt)
        for grp, cnt in counts.items()
    }

    return counts, imbalance


# ==========================================
# UNIQUE SYNTHETIC GENERATION
# ==========================================
def generate_unique_row(row, df):
    new_row = row.copy()

    for col in df.columns:
        if df[col].dtype in ["int64", "float64"]:
            noise = np.random.normal(0, 0.01 * (df[col].std() + 1))
            new_row[col] = round(new_row[col] + noise, 4)

    return new_row


def create_synthetic_rows(data, protected, imbalance):
    synthetic_rows = []
    existing = set(data.astype(str).agg("|".join, axis=1))

    for group_name, needed in imbalance.items():
        if needed <= 0:
            continue

        group_rows = data[data[protected] == group_name]

        generated = 0
        attempts = 0

        while generated < needed and attempts < needed * 10:
            base_row = group_rows.sample(1).iloc[0]
            new_row = generate_unique_row(base_row, data)

            row_str = "|".join(new_row.astype(str))

            if row_str not in existing:
                synthetic_rows.append(new_row)
                existing.add(row_str)
                generated += 1

            attempts += 1

    if synthetic_rows:
        synthetic_df = pd.DataFrame(synthetic_rows)
        return pd.concat([data, synthetic_df], ignore_index=True)

    return data


# ==========================================
# SYNTHESIZE API
# ==========================================
@router.post("/synthesize")
async def synthesize(file: UploadFile = File(...)):
    try:
        content = await file.read()

        df = load_dataframe(file.filename, content)
        df = full_clean_data(df)

        protected = auto_detect_protected(df)
        target = auto_detect_target(df)

        df = preprocess_target(df, target)

        counts_before, imbalance = compute_imbalance(df, protected)
        _, fairness_before, gap_before = calculate_bias(df, protected, target)

        df_balanced = create_synthetic_rows(df, protected, imbalance)

        counts_after, _ = compute_imbalance(df_balanced, protected)
        _, fairness_after, gap_after = calculate_bias(df_balanced, protected, target)

        return {
            "rowsBefore": len(df),
            "rowsAfter": len(df_balanced),
            "protected": protected,
            "target": target,
            "fairnessBefore": fairness_before,
            "fairnessAfter": fairness_after,
            "biasGapBefore": gap_before,
            "biasGapAfter": gap_after,
            "improvement": round(fairness_after - fairness_before, 2),
            "generatedRows": len(df_balanced) - len(df),
            "preview": df_balanced.head(5).to_dict(orient="records")
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# ==========================================
# DOWNLOAD API
# ==========================================
@router.post("/download-synthesized")
async def download(file: UploadFile = File(...)):
    try:
        content = await file.read()

        df = load_dataframe(file.filename, content)
        df = full_clean_data(df)

        protected = auto_detect_protected(df)
        target = auto_detect_target(df)

        df = preprocess_target(df, target)

        _, imbalance = compute_imbalance(df, protected)

        df_balanced = create_synthetic_rows(df, protected, imbalance)

        output = io.StringIO()
        df_balanced.to_csv(output, index=False)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=balanced_dataset.csv"
            },
        )

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})