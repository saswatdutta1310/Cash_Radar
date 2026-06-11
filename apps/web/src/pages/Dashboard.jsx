import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, ChevronRight, Play } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningSim, setRunningSim] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRunSimulation = async () => {
    setRunningSim(true);
    try {
      await axios.post('http://localhost:3001/api/simulations/run');
      await fetchDashboard();
    } catch (err) {
      console.error(err);
      alert('Failed to run simulation. Ensure Python engine is running and you have uploaded at least 5 transactions.');
    } finally {
      setRunningSim(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D7377]"></div>
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="flex flex-col h-full items-center justify-center max-w-md mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <Activity size={40} className="text-[#0D7377]" />
        </div>
        <h2 className="text-2xl font-bold text-[#1B2A4A]">No Intelligence Yet</h2>
        <p className="text-[#4A5568]">We need data to build your cash flow forecast. Run your first simulation to generate the dashboard.</p>
        <button 
          onClick={handleRunSimulation}
          disabled={runningSim}
          className="bg-[#0D7377] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#14A085] transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {runningSim ? (
            <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Running 10k Scenarios...</>
          ) : (
            <><Play size={20} /> Generate Risk Intelligence</>
          )}
        </button>
      </div>
    );
  }

  const { simulation, recommendations } = data;
  const riskScore = simulation.risk_score || 0;
  
  // Format chart data
  let chartData = [];
  try {
    const rawChartData = JSON.parse(simulation.results_blob_url || "{}");
    if (rawChartData.p50) {
      chartData = rawChartData.p50.map((val, idx) => ({
        week: `Week ${idx + 1}`,
        expected: val,
        p10: rawChartData.p10[idx],
        p90: rawChartData.p90[idx],
        cone: [rawChartData.p10[idx], rawChartData.p90[idx]]
      }));
    }
  } catch (e) {
    console.error("Failed to parse chart data");
  }

  const getRiskColor = (score) => {
    if (score < 30) return '#38A169'; // Green
    if (score <= 60) return '#D69E2E'; // Amber
    return '#E53E3E'; // Red
  };

  const riskColor = getRiskColor(riskScore);

  return (
    <div className="space-y-6">
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Score Gauge */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#CBD5E0] shadow-sm p-6 flex flex-col items-center justify-center">
          <h3 className="text-[#4A5568] font-medium mb-4 w-full text-left">Overall Risk Score</h3>
          <div className="relative w-48 h-24 overflow-hidden mb-2">
            <div className="absolute w-48 h-48 rounded-full border-[16px] border-gray-100 border-t-[#38A169] border-r-[#D69E2E] border-b-[#E53E3E] border-l-[#E53E3E] rotate-45"></div>
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-2">
              <span className="text-5xl font-black tabular-nums" style={{ color: riskColor }}>{riskScore}</span>
            </div>
          </div>
          <p className="text-[#4A5568] text-sm text-center mt-2">
            You have <span className="font-bold text-[#1B2A4A]">~{simulation.cash_runway_p50} days</span> of cash runway under expected conditions.
          </p>
        </div>

        {/* Forecast Chart */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#CBD5E0] shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#1B2A4A] font-semibold">6-Month Cash Flow Forecast</h3>
            <span className="text-xs bg-[#EBF4F5] text-[#0D7377] px-2 py-1 rounded font-medium">10,000 Scenarios Run</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D7377" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0D7377" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E0" />
                <XAxis dataKey="week" tick={{fontSize: 12, fill: '#718096'}} tickLine={false} axisLine={false} />
                <YAxis 
                  tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} 
                  tick={{fontSize: 12, fill: '#718096'}} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, name === 'expected' ? 'Expected Balance' : 'Variance Bound']}
                  labelStyle={{color: '#1B2A4A', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="cone" stroke="none" fill="url(#colorCone)" />
                <Area type="monotone" dataKey="expected" stroke="#0D7377" strokeWidth={3} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Survival Probabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '30-Day Survival', prob: 1 - (simulation.insolvency_prob_30d || 0) },
          { label: '90-Day Survival', prob: 1 - (simulation.insolvency_prob_90d || 0) },
          { label: '180-Day Survival', prob: 1 - (simulation.insolvency_prob_180d || 0) },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-[#CBD5E0] shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-[#4A5568] text-sm font-medium">{item.label}</p>
              <p className="text-3xl font-black text-[#1B2A4A] tabular-nums mt-1">
                {(item.prob * 100).toFixed(1)}%
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.prob > 0.9 ? 'bg-[#EBF4F5] text-[#0D7377]' : 'bg-red-50 text-red-500'}`}>
              {item.prob > 0.9 ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#CBD5E0] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#CBD5E0]">
            <h3 className="text-[#1B2A4A] font-semibold flex items-center gap-2">
              <Activity size={18} className="text-[#0D7377]" />
              Intelligence & Recommendations
            </h3>
          </div>
          <div className="divide-y divide-[#CBD5E0]">
            {recommendations.map(rec => (
              <div key={rec.id} className="p-6 hover:bg-gray-50 transition-colors flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${rec.type === 'alert' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700 uppercase'}`}>
                      {rec.type}
                    </span>
                    <h4 className="font-semibold text-[#1B2A4A]">{rec.title}</h4>
                  </div>
                  <p className="text-sm text-[#4A5568] mt-1">{rec.description}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="text-sm font-bold text-[#38A169]">{rec.impact} Risk Pts</div>
                  <Link to="/simulator" className="inline-block text-[#0D7377] text-sm font-semibold mt-2 hover:underline">Model Scenario</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border border-[#CBD5E0] shadow-sm p-6">
          <h3 className="text-[#1B2A4A] font-semibold mb-4">Quick Stress-Test</h3>
          <div className="space-y-3">
            {[
              { title: 'Hire Employees', icon: Clock },
              { title: 'Revenue Drop', icon: AlertTriangle },
              { title: 'Take a Loan', icon: Activity }
            ].map((st, i) => (
              <Link to="/simulator" key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#CBD5E0] hover:border-[#0D7377] hover:bg-[#EBF4F5] transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-[#4A5568] group-hover:text-[#0D7377]"><st.icon size={18} /></div>
                  <span className="font-medium text-[#1B2A4A] text-sm">{st.title}</span>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-[#0D7377]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
