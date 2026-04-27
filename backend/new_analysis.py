from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import io

from models import DatasetAnalysis
from dependency import get_db

router = APIRouter()


# =====================================
# ANALYZE + STORE IN DB
# =====================================
@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        file_size = round(len(content) / 1024, 2)

        # ================================
        # READ FILE
        # ================================
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))

        elif file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(content))

        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Only CSV / Excel files allowed"}
            )

        # ================================
        # BEFORE CLEANING
        # ================================
        rows_before = int(df.shape[0])
        cols_before = int(df.shape[1])

        duplicate_before = int(df.duplicated().sum())
        missing_rows_before = int(df.isnull().any(axis=1).sum())
        missing_cells_before = int(df.isnull().sum().sum())

        before_clean = {
            "rows": rows_before,
            "columns": cols_before,
            "duplicate_rows": duplicate_before,
            "rows_with_missing_values": missing_rows_before,
            "total_missing_cells": missing_cells_before
        }

        # ================================
        # CLEANING
        # ================================
        df.columns = df.columns.str.lower().str.strip()

        df = df.drop_duplicates().copy()

        for col in df.select_dtypes(include=np.number).columns:
            df[col] = df[col].fillna(df[col].median())

        for col in df.select_dtypes(include="object").columns:
            if not df[col].mode().empty:
                df[col] = df[col].fillna(df[col].mode()[0])

        # ================================
        # AFTER CLEANING
        # ================================
        rows_after = int(df.shape[0])
        cols_after = int(df.shape[1])

        duplicate_after = int(df.duplicated().sum())
        missing_rows_after = int(df.isnull().any(axis=1).sum())
        missing_cells_after = int(df.isnull().sum().sum())

        after_clean = {
            "rows": rows_after,
            "columns": cols_after,
            "duplicate_rows": duplicate_after,
            "rows_with_missing_values": missing_rows_after,
            "total_missing_cells": missing_cells_after
        }

        # ================================
        # STORE IN POSTGRESQL
        # ================================
        record = DatasetAnalysis(
            file_name=file.filename,
            file_size_kb=file_size,
            rows_before=rows_before,
            columns_before=cols_before,
            rows_after=rows_after,
            columns_after=cols_after,
            before_clean=before_clean,
            after_clean=after_clean,
            column_names=list(df.columns)
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        # ================================
        # RESPONSE
        # ================================
        return {
            "message": "Analysis Complete",
            "db_id": record.id,

            "file_info": {
                "file_name": file.filename,
                "rows": rows_before,
                "columns": cols_before,
                "size_kb": file_size
            },

            "before_clean": before_clean,
            "after_clean": after_clean,

            "column_names": list(df.columns),

            "download_url": "/download-cleaned"
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


# =====================================
# DOWNLOAD CLEANED DATASET
# =====================================
@router.post("/download-cleaned")
async def download_cleaned(file: UploadFile = File(...)):
    try:
        content = await file.read()

        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))

        elif file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(content))

        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Only CSV / Excel files allowed"}
            )

        # CLEANING
        df.columns = df.columns.str.lower().str.strip()
        df = df.drop_duplicates().copy()

        for col in df.select_dtypes(include=np.number).columns:
            df[col] = df[col].fillna(df[col].median())

        for col in df.select_dtypes(include="object").columns:
            if not df[col].mode().empty:
                df[col] = df[col].fillna(df[col].mode()[0])

        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=cleaned_dataset.csv"
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )