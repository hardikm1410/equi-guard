import os
import pandas as pd
import json
from google import genai

def ai_analyze(df_dataset, df_output):
    # Setup genai inside the function since we assume main.py handles dotenv
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    client = None
    if GEMINI_API_KEY and GEMINI_API_KEY != "" and GEMINI_API_KEY != "your_key_here":
        client = genai.Client(api_key=GEMINI_API_KEY)

    # Base pandas mathematics logic
    def clean_df(df):
        df.columns = df.columns.str.lower().str.strip().str.replace(" ", "_")
        return df

    def detect_target(df):
        for col in ["target", "label", "result", "outcome"]:
            if col in df.columns: return col
        return df.columns[-1]

    def detect_prediction(df):
        for col in ["prediction", "predicted", "output"]:
            if col in df.columns: return col
        return df.columns[-1]

    def detect_protected(df):
        for col in ["gender", "sex", "race", "group"]:
            if col in df.columns: return col
        return df.columns[0]

    dataset = clean_df(df_dataset.copy())
    output = clean_df(df_output.copy())

    target = detect_target(dataset)
    prediction = detect_prediction(output)
    protected = detect_protected(dataset)

    df = dataset.copy()
    df["prediction"] = output[prediction]

    df["correct"] = (df[target] == df["prediction"]).astype(int)
    accuracy = df["correct"].mean() * 100

    group_acc = (
        df.groupby(protected)["correct"]
        .mean()
        .sort_values(ascending=False)
    )

    accuracy_by_group = [
        {"group": str(k), "accuracy": round(v * 100, 2)}
        for k, v in group_acc.items()
    ]

    max_acc = group_acc.max()
    min_acc = group_acc.min()
    gap = round((max_acc - min_acc) * 100, 2)
    fairness = round(min_acc / max_acc, 2) if max_acc != 0 else 0

    best_group = f"{group_acc.idxmax()} ({round(max_acc*100,2)}%)"
    worst_group = f"{group_acc.idxmin()} ({round(min_acc*100,2)}%)"

    # Standard fallbacks
    ai_recommendations = [
        "Model shows performance variances across demographic groups.",
        "Generative AI diagnostics failed to load (Google API 503 overload or invalid key). Falling back to statically computed metrics."
    ]
    fairness_status = "Good" if fairness >= 0.8 else "Bias Detected"

    # Contextual Generative AI Execution
    if client:
        try:
            prompt = f"""
We have evaluated an ML model's predictions over a dataset.
- Overall Accuracy: {round(accuracy, 2)}%
- Accuracy by Demographic Group: {accuracy_by_group}
- Performance Gap (Best minus Worst): {gap}%
- Fairness Score (Min / Max Accuracy): {fairness}

Please act as a Senior AI Ethics & ML Fairness Researcher. Provide 3-5 high-impact, actionable recommendations to improve the model's fairness based exactly on the discrepancy findings seen above. 

Return ONLY a valid JSON structure containing a single key "recommendations" mapped to a list of strings. Do not include markdown code blocks or any other text.
            """

            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                )
            except Exception as primary_e:
                print(f"gemini-2.5-flash failed ({primary_e}), falling back to 2.0-flash...")
                response = client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=prompt,
                )

            # Clean JSON response from potential formatting blocks
            raw_text = response.text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(raw_text)
            
            if "recommendations" in parsed and isinstance(parsed["recommendations"], list):
                if len(parsed["recommendations"]) > 0:
                    ai_recommendations = parsed["recommendations"]
            
        except Exception as e:
            print(f"Error fetching AI recommendations: {e}")

    return {
        "accuracyByGroup": accuracy_by_group,
        "overallFairness": fairness,
        "fairnessStatus": fairness_status,
        "stats": {
            "overallAccuracy": f"{round(accuracy,2)}%",
            "balancedAccuracy": f"{round(group_acc.mean()*100,2)}%",
            "aucScore": "N/A"
        },
        "performanceGap": f"{gap}%",
        "bestGroup": best_group,
        "worstGroup": worst_group,
        "recommendations": ai_recommendations
    }
