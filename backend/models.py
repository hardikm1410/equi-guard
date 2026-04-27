from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from datetime import datetime
from db import Base


class DatasetAnalysis(Base):
    __tablename__ = "dataset_analysis"

    id = Column(Integer, primary_key=True, index=True)

    file_name = Column(String)
    file_size_kb = Column(Float)

    rows_before = Column(Integer)
    columns_before = Column(Integer)

    rows_after = Column(Integer)
    columns_after = Column(Integer)

    before_clean = Column(JSON)
    after_clean = Column(JSON)

    column_names = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)