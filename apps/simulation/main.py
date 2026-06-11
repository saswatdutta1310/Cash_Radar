from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
from prophet import Prophet
from typing import List, Optional, Dict

app = FastAPI(title="CashRadar Simulation Engine")

@app.get("/health")
def health_check():
    return {"status": "ok"}

class Transaction(BaseModel):
    txn_date: str
    amount: float
    direction: str

class SimulationRequest(BaseModel):
    business_id: str
    transactions: List[Transaction]
    horizon_days: int = 180
    iterations: int = 10000
    starting_balance: float = 0.0
    scenario_params: Optional[Dict] = None

@app.post("/simulate")
def run_simulation(req: SimulationRequest):
    if not req.transactions:
        return {"error": "No transactions provided for simulation"}

    # 1. Convert to DataFrame
    df = pd.DataFrame([t.model_dump() if hasattr(t, 'model_dump') else t.dict() for t in req.transactions])
    df['txn_date'] = pd.to_datetime(df['txn_date'])
    df['amount'] = df.apply(lambda row: row['amount'] if row['direction'] == 'credit' else -row['amount'], axis=1)

    # 2. Aggregate weekly net cash flow
    df_weekly = df.set_index('txn_date').resample('W')['amount'].sum().reset_index()
    df_weekly.columns = ['ds', 'y']

    # 3. Fit Prophet Model
    # We use a very basic Prophet model without extensive seasonality for MVP
    model = Prophet(yearly_seasonality=False, weekly_seasonality=True, daily_seasonality=False)
    if len(df_weekly) < 2:
        return {"error": "Not enough data points for forecasting"}
    
    model.fit(df_weekly)

    # 4. Create future dataframe
    horizon_weeks = int(req.horizon_days / 7)
    future = model.make_future_dataframe(periods=horizon_weeks, freq='W')
    forecast = model.predict(future)

    # Extract future expected net flows and the historical variance
    future_forecast = forecast.tail(horizon_weeks)
    expected_flows = future_forecast['yhat'].values
    
    # --- SCENARIO ADJUSTMENTS ---
    if req.scenario_params:
        scenario_type = req.scenario_params.get('type')
        if scenario_type == 'hire':
            count = int(req.scenario_params.get('count', 1))
            salary = float(req.scenario_params.get('salary', 40000))
            # Subtract (salary * count) monthly. Convert to weekly -> (salary * count * 12) / 52
            weekly_expense = (salary * count * 12) / 52
            expected_flows -= weekly_expense
        elif scenario_type == 'revenue_drop':
            drop_pct = int(req.scenario_params.get('drop_pct', 25)) / 100.0
            duration_months = int(req.scenario_params.get('duration', 3))
            duration_weeks = int(duration_months * 4.33)
            # Find positive flows (revenue proxy) in the forecast and reduce them
            # For MVP, we'll just reduce the expected net flow if it's positive
            for w in range(min(duration_weeks, horizon_weeks)):
                if expected_flows[w] > 0:
                    expected_flows[w] *= (1 - drop_pct)
    # ---------------------------

    # Calculate standard deviation of historical weekly flows to use in Monte Carlo
    std_dev = df_weekly['y'].std()
    if pd.isna(std_dev) or std_dev == 0:
        std_dev = 1000  # fallback

    # 5. Monte Carlo Simulation
    # Generate random paths: shape (iterations, horizon_weeks)
    np.random.seed(42)
    random_shocks = np.random.normal(loc=0, scale=std_dev, size=(req.iterations, horizon_weeks))
    
    # Add shocks to expected flows
    simulated_weekly_flows = expected_flows + random_shocks
    
    # Calculate cumulative balances starting from current balance
    simulated_balances = np.zeros((req.iterations, horizon_weeks))
    current_balance = req.starting_balance
    
    for w in range(horizon_weeks):
        if w == 0:
            simulated_balances[:, w] = current_balance + simulated_weekly_flows[:, w]
        else:
            simulated_balances[:, w] = simulated_balances[:, w-1] + simulated_weekly_flows[:, w]

    # 6. Analyze Monte Carlo Results
    # Insolvency = balance < 0 at any point during the horizon
    insolvent_paths = (simulated_balances < 0).any(axis=1)
    insolvency_prob_total = insolvent_paths.mean()

    # Time to insolvency metrics (in weeks)
    insolvency_week_idx = np.argmax(simulated_balances < 0, axis=1)
    insolvency_weeks_actual = insolvency_week_idx[insolvent_paths]
    
    # Calculate probabilities for 30d, 90d, 180d
    prob_30d = float(((simulated_balances[:, :4] < 0).any(axis=1)).mean()) if horizon_weeks >= 4 else 0.0
    prob_90d = float(((simulated_balances[:, :12] < 0).any(axis=1)).mean()) if horizon_weeks >= 12 else 0.0
    prob_180d = float(((simulated_balances[:, :25] < 0).any(axis=1)).mean()) if horizon_weeks >= 25 else 0.0

    # Calculate Cash Runway (P50)
    if len(insolvency_weeks_actual) > 0:
        runway_weeks_p50 = np.median(insolvency_weeks_actual)
        cash_runway_p50 = int(runway_weeks_p50 * 7)
    else:
        cash_runway_p50 = req.horizon_days  # No insolvency in median case

    # Calculate Risk Score (0-100)
    risk_score = int(min(100, max(0, insolvency_prob_total * 100)))
    if cash_runway_p50 > 90:
        risk_score = max(0, risk_score - 20)

    return {
        "business_id": req.business_id,
        "status": "completed",
        "risk_score": risk_score,
        "cash_runway_p50": cash_runway_p50,
        "insolvency_prob_30d": prob_30d,
        "insolvency_prob_90d": prob_90d,
        "insolvency_prob_180d": prob_180d,
        "forecast_chart_data": {
            "p10": np.percentile(simulated_balances, 10, axis=0).tolist(),
            "p50": np.percentile(simulated_balances, 50, axis=0).tolist(),
            "p90": np.percentile(simulated_balances, 90, axis=0).tolist(),
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
