const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');
const merchantIntelligence = require('./services/merchantIntelligence');
const axios = require('axios');

const prisma = new PrismaClient();
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// --- Mock Authentication Middleware ---
// For Phase 1, we will mock the authenticated user/business
const mockAuth = async (req, res, next) => {
  // Ensure we have a mock user and business in the DB
  let user = await prisma.user.findFirst({ where: { email: 'test@cashradar.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        firebase_uid: 'mock_uid_123',
        email: 'test@cashradar.com',
        phone: '+919876543210',
        name: 'Rajan Mehta',
      }
    });
  }
  
  let business = await prisma.business.findFirst({ where: { user_id: user.id } });
  if (!business) {
    business = await prisma.business.create({
      data: {
        user_id: user.id,
        name: 'Mehta Auto Parts',
        industry: 'Retail',
        revenue_range: '1Cr-10Cr'
      }
    });
  }
  
  req.user = user;
  req.business = business;
  next();
};

app.use(mockAuth);

// --- Routes ---

app.post('/api/businesses/setup', async (req, res) => {
  const { name, industry, revenue_range } = req.body;
  const business = await prisma.business.update({
    where: { id: req.business.id },
    data: { name, industry, revenue_range }
  });
  res.json(business);
});

app.post('/api/transactions/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fs = require('fs');
  const fileContent = fs.readFileSync(req.file.path, 'utf8');
  
  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const transactionsToInsert = [];
      
      for (const row of results.data) {
        // Expected CSV Columns: Date, Description, Amount, Type (Credit/Debit)
        const rawDate = row['Date'] || row['date'];
        const description = row['Description'] || row['description'] || row['Narration'];
        const amountStr = row['Amount'] || row['amount'];
        const typeStr = (row['Type'] || row['type'] || '').toLowerCase();
        
        if (!rawDate || !description || !amountStr) continue;

        let amount = parseFloat(amountStr.replace(/,/g, ''));
        const direction = (typeStr === 'debit' || amount < 0) ? 'debit' : 'credit';
        amount = Math.abs(amount);
        
        // Categorize using Merchant Intelligence Layer
        const { category, merchant_name, confidence } = merchantIntelligence.categorize(description, direction);
        
        transactionsToInsert.push({
          business_id: req.business.id,
          txn_date: new Date(rawDate),
          amount,
          description_raw: description,
          description_clean: description,
          category,
          category_confidence: confidence,
          merchant_name,
          direction
        });
      }
      
      if (transactionsToInsert.length > 0) {
        await prisma.transaction.createMany({
          data: transactionsToInsert,
          skipDuplicates: true
        });
      }
      
      // Cleanup temp file
      fs.unlinkSync(req.file.path);
      
      res.json({ success: true, count: transactionsToInsert.length });
    },
    error: (err) => {
      res.status(500).json({ error: 'Failed to parse CSV' });
    }
  });
});

app.get('/api/transactions', async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { business_id: req.business.id },
    orderBy: { txn_date: 'desc' },
    take: 100 // limit for MVP view
  });
  res.json(transactions);
});

app.patch('/api/transactions/:id/category', async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;
  
  const txn = await prisma.transaction.update({
    where: { id, business_id: req.business.id },
    data: { 
      category,
      category_source: 'user',
      category_confidence: 1.0
    }
  });
  
  // In a real app, we would trigger a background task to update the simulation here
  res.json(txn);
});

// --- Alerts Route ---
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { business_id: req.business.id },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.post('/api/alerts/:id/read', async (req, res) => {
  try {
    const alert = await prisma.alert.update({
      where: { id: req.params.id, business_id: req.business.id },
      data: { is_read: true }
    });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

// --- Dashboard Route ---
app.get('/api/dashboard', async (req, res) => {
  try {
    const latestSim = await prisma.simulation.findFirst({
      where: { business_id: req.business.id, status: 'completed' },
      orderBy: { created_at: 'desc' }
    });

    if (!latestSim) {
      return res.json({ hasData: false });
    }

    // Dynamic Recommendations Engine
    const recommendations = [];
    let recId = 1;

    if (latestSim.cash_runway_p50 < 60) {
      recommendations.push({
        id: recId++,
        type: 'critical',
        title: 'Immediate Cash Crunch Warning',
        description: `Your cash runway is critically low (${latestSim.cash_runway_p50} days). Immediate action is required to secure short-term capital or drastically cut operational expenses.`,
        impact: -25
      });
    }

    if (latestSim.insolvency_prob_90d > 0.20) {
      recommendations.push({
        id: recId++,
        type: 'action',
        title: 'Delay Non-Essential Hiring',
        description: 'Your 90-day insolvency probability is over 20%. Consider delaying any new hires planned for this quarter to preserve runway.',
        impact: -12
      });
    }

    if (latestSim.risk_score > 50) {
      recommendations.push({
        id: recId++,
        type: 'alert',
        title: 'High Risk Volatility',
        description: 'Your cash flow volatility is contributing heavily to your risk score. Try to negotiate longer payment terms with suppliers or enforce 15-day terms with clients.',
        impact: -8
      });
    }

    // Default positive recommendation if healthy
    if (recommendations.length === 0) {
      recommendations.push({
        id: recId++,
        type: 'info',
        title: 'Healthy Cash Reserve',
        description: 'Your cash flow looks stable and insolvency probability is extremely low. This might be a safe time to reinvest in growth.',
        impact: 0
      });
    }

    res.json({
      hasData: true,
      simulation: latestSim,
      recommendations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// --- Simulation Routes ---
app.post('/api/simulations/run', async (req, res) => {
  try {
    // 1. Fetch all transactions
    const transactions = await prisma.transaction.findMany({
      where: { business_id: req.business.id },
      orderBy: { txn_date: 'asc' }
    });

    if (transactions.length < 5) {
      return res.status(400).json({ error: 'Not enough transactions to run simulation' });
    }

    // Map to format required by Python service
    const txnsForSim = transactions.map(t => ({
      txn_date: t.txn_date.toISOString().split('T')[0],
      amount: parseFloat(t.amount.toString()),
      direction: t.direction
    }));

    // Calculate current balance (simple sum for MVP)
    const starting_balance = txnsForSim.reduce((acc, t) => acc + (t.direction === 'credit' ? t.amount : -t.amount), 0);

    // 2. Call Python Service
    const response = await axios.post('http://localhost:8000/simulate', {
      business_id: req.business.id,
      transactions: txnsForSim,
      horizon_days: 180,
      iterations: 10000,
      starting_balance: starting_balance,
      scenario_params: req.body.scenario_params || null
    });

    const simData = response.data;
    if (simData.error) {
      return res.status(500).json({ error: simData.error });
    }

    // 3. Store Results in Postgres
    // If it's a scenario run, don't necessarily overwrite the main dashboard simulation,
    // but for MVP we can just save it or mark it as a scenario.
    const simulationStatus = req.body.type === 'scenario' ? 'scenario_run' : 'completed';
    
    const simulation = await prisma.simulation.create({
      data: {
        business_id: req.business.id,
        status: simulationStatus,
        risk_score: simData.risk_score,
        cash_runway_p50: simData.cash_runway_p50,
        insolvency_prob_30d: simData.insolvency_prob_30d,
        insolvency_prob_90d: simData.insolvency_prob_90d,
        insolvency_prob_180d: simData.insolvency_prob_180d,
        results_blob_url: JSON.stringify(simData.forecast_chart_data) // store chart data as JSON string for MVP
      }
    });

    if (simulationStatus === 'completed') {
      // Save risk score history only for baseline simulations
      await prisma.riskScore.create({
        data: {
          business_id: req.business.id,
          simulation_id: simulation.id,
          score: simData.risk_score,
          revenue_volatility_weight: 0.3,
          customer_concentration_weight: 0.2,
          cash_reserve_weight: 0.4,
          payroll_exposure_weight: 0.1,
          debt_burden_weight: 0.0
        }
      });

      // --- ALERT EVALUATION ENGINE ---
      let prefs = await prisma.alertPreference.findUnique({ where: { business_id: req.business.id } });
      if (!prefs) {
        prefs = await prisma.alertPreference.create({ data: { business_id: req.business.id } });
      }

      const generatedAlerts = [];
      // 1. Runway Threshold
      if (simData.cash_runway_p50 <= prefs.cash_runway_threshold_days) {
        generatedAlerts.push({
          business_id: req.business.id,
          type: 'runway_critical',
          severity: 'critical',
          title: `Cash Runway Critically Low (${simData.cash_runway_p50} Days)`,
          body: `Your P50 projected cash runway has dropped below your threshold of ${prefs.cash_runway_threshold_days} days. Immediate intervention recommended.`,
          triggered_value: simData.cash_runway_p50,
          threshold_value: prefs.cash_runway_threshold_days,
          notified_via: ['in_app', 'email'] // mock messaging services
        });
      }
      
      // 2. Risk Score Threshold
      if (simData.risk_score >= prefs.risk_score_threshold) {
        generatedAlerts.push({
          business_id: req.business.id,
          type: 'risk_score_high',
          severity: 'warning',
          title: `Risk Score Exceeded Threshold (${simData.risk_score})`,
          body: `Your business risk score is elevated to ${simData.risk_score}. Review the latest recommendations in the dashboard.`,
          triggered_value: simData.risk_score,
          threshold_value: prefs.risk_score_threshold,
          notified_via: ['in_app']
        });
      }

      if (generatedAlerts.length > 0) {
        await prisma.alert.createMany({ data: generatedAlerts });
        // MOCK TWILIO/RESEND: Here we would trigger actual SMS/Email APIs.
        console.log(`[MOCK ALERT DISPATCH] Dispatched ${generatedAlerts.length} alerts for Business ${req.business.id}`);
      }
    }

    res.json(simulation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
