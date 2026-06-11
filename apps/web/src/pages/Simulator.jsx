import { useState, useEffect } from 'react';
import { Users, TrendingDown, Landmark, UserMinus, ArrowRight, Play, ArrowLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function Simulator() {
  const [baseline, setBaseline] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [scenarioParams, setScenarioParams] = useState({});
  const [scenarioResult, setScenarioResult] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    // Fetch baseline (latest standard simulation)
    axios.get('http://localhost:3001/api/dashboard').then(res => {
      if (res.data.hasData) setBaseline(res.data.simulation);
    });
  }, []);

  const scenarios = [
    { id: 'hire', title: 'Hire Employees', icon: Users, desc: 'Model the impact of increasing payroll on your cash runway.' },
    { id: 'revenue_drop', title: 'Revenue Drop', icon: TrendingDown, desc: 'Stress-test a sudden drop in sales volume.' },
    { id: 'loan', title: 'Take a Loan', icon: Landmark, desc: 'See how new debt obligations affect your survival probability.' },
    { id: 'client_loss', title: 'Lose a Client', icon: UserMinus, desc: 'Model the loss of a major revenue source.' }
  ];

  const handleRunScenario = async () => {
    setRunning(true);
    try {
      // Assuming endpoint accepts scenario params in body
      const res = await axios.post('http://localhost:3001/api/simulations/run', {
        type: 'scenario',
        scenario_params: { type: activeScenario.id, ...scenarioParams }
      });
      setScenarioResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Simulation failed.');
    } finally {
      setRunning(false);
    }
  };

  const renderConfig = () => {
    switch (activeScenario.id) {
      case 'hire':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4A5568] mb-1">Number of Employees</label>
              <input type="number" min="1" className="w-full p-2 border border-[#CBD5E0] rounded-lg" 
                value={scenarioParams.count || ''} onChange={e => setScenarioParams({...scenarioParams, count: parseInt(e.target.value)})} 
                placeholder="e.g. 3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A5568] mb-1">Monthly Salary Per Employee (₹)</label>
              <input type="number" min="0" className="w-full p-2 border border-[#CBD5E0] rounded-lg" 
                value={scenarioParams.salary || ''} onChange={e => setScenarioParams({...scenarioParams, salary: parseFloat(e.target.value)})} 
                placeholder="e.g. 40000" />
            </div>
          </div>
        );
      case 'revenue_drop':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4A5568] mb-1">Revenue Decrease (%)</label>
              <input type="range" min="5" max="80" className="w-full" 
                value={scenarioParams.drop_pct || 25} onChange={e => setScenarioParams({...scenarioParams, drop_pct: parseInt(e.target.value)})} />
              <div className="text-right text-[#0D7377] font-bold">{scenarioParams.drop_pct || 25}%</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A5568] mb-1">Duration (Months)</label>
              <select className="w-full p-2 border border-[#CBD5E0] rounded-lg"
                value={scenarioParams.duration || 3} onChange={e => setScenarioParams({...scenarioParams, duration: parseInt(e.target.value)})}>
                <option value={1}>1 Month</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
              </select>
            </div>
          </div>
        );
      default:
        return <p className="text-gray-500 italic">Configuration coming soon...</p>;
    }
  };

  const renderComparison = () => {
    if (!baseline || !scenarioResult) return null;
    
    const riskDelta = scenarioResult.risk_score - baseline.risk_score;
    const runwayDelta = (scenarioResult.cash_runway_p50 || 0) - (baseline.cash_runway_p50 || 0);

    return (
      <div className="mt-8 bg-white p-6 rounded-xl border border-[#CBD5E0] shadow-sm animate-in fade-in slide-in-from-bottom-4">
        <h3 className="text-xl font-bold text-[#1B2A4A] mb-6">Scenario Results</h3>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Baseline</h4>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Risk Score</p>
                <p className="text-2xl font-black text-[#1B2A4A]">{baseline.risk_score}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cash Runway</p>
                <p className="text-xl font-bold text-[#1B2A4A]">{baseline.cash_runway_p50} days</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#EBF4F5] p-4 rounded-xl border border-[#0D7377]">
            <h4 className="text-sm font-semibold text-[#0D7377] uppercase tracking-wider mb-4">Scenario</h4>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#0D7377]">Risk Score</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-[#1B2A4A]">{scenarioResult.risk_score}</p>
                  <p className={`text-sm font-bold mb-1 ${riskDelta > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {riskDelta > 0 ? '+' : ''}{riskDelta} pts
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-[#0D7377]">Cash Runway</p>
                <div className="flex items-end gap-2">
                  <p className="text-xl font-bold text-[#1B2A4A]">{scenarioResult.cash_runway_p50} days</p>
                  <p className={`text-sm font-bold mb-0.5 ${runwayDelta < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {runwayDelta > 0 ? '+' : ''}{runwayDelta} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <button onClick={() => { setActiveScenario(null); setScenarioResult(null); }} className="w-full py-3 border border-[#CBD5E0] text-[#4A5568] font-semibold rounded-lg hover:bg-gray-50">
          Try Another Scenario
        </button>
      </div>
    );
  };

  if (!activeScenario) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-[#1B2A4A] mb-2">Stress-Test Simulator</h2>
        <p className="text-[#4A5568] mb-8">Model major business decisions and see their impact on your cash runway instantly.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map(s => {
            const Icon = s.icon;
            return (
              <div 
                key={s.id} 
                onClick={() => { setActiveScenario(s); setScenarioParams({}); }}
                className="bg-white p-6 rounded-xl border border-[#CBD5E0] hover:border-[#0D7377] hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-[#EBF4F5] text-[#0D7377] rounded-lg group-hover:bg-[#0D7377] group-hover:text-white transition-colors">
                    <Icon size={24} />
                  </div>
                  <h3 className="font-bold text-[#1B2A4A] text-lg">{s.title}</h3>
                </div>
                <p className="text-[#4A5568] text-sm">{s.desc}</p>
                <div className="mt-4 flex items-center text-[#0D7377] text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Configure Scenario <ArrowRight size={16} className="ml-1" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => { setActiveScenario(null); setScenarioResult(null); }} 
        className="flex items-center gap-2 text-[#4A5568] hover:text-[#1B2A4A] mb-6 font-medium transition-colors"
      >
        <ArrowLeft size={18} /> Back to Scenarios
      </button>

      <div className="bg-white p-8 rounded-xl border border-[#CBD5E0] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <activeScenario.icon size={28} className="text-[#0D7377]" />
          <h2 className="text-2xl font-bold text-[#1B2A4A]">{activeScenario.title}</h2>
        </div>
        
        {renderConfig()}
        
        <button 
          onClick={handleRunScenario}
          disabled={running}
          className="w-full mt-8 bg-[#0D7377] text-white py-3 rounded-lg font-semibold hover:bg-[#14A085] disabled:opacity-70 flex justify-center items-center gap-2 transition-colors"
        >
          {running ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Play size={20} />}
          {running ? 'Running 10,000 Scenarios...' : 'Run Simulation'}
        </button>
      </div>

      {renderComparison()}
    </div>
  );
}
