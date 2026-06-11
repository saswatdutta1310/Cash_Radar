import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Settings } from 'lucide-react';
import axios from 'axios';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.post(`http://localhost:3001/api/alerts/${id}/read`);
      setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="text-red-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D7377]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2A4A] flex items-center gap-2">
            <Bell size={24} className="text-[#0D7377]" />
            Alerts & Notifications
          </h2>
          <p className="text-[#4A5568] mt-1 text-sm">Monitoring your cash flow bounds and risk thresholds.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-[#CBD5E0] rounded-lg text-sm font-medium text-[#4A5568] hover:bg-gray-50 transition-colors">
          <Settings size={16} /> Notification Settings
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#CBD5E0] p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <CheckCircle size={32} className="text-[#38A169]" />
          </div>
          <h3 className="text-lg font-bold text-[#1B2A4A]">You're all caught up!</h3>
          <p className="text-[#4A5568] max-w-sm mt-2 text-sm">No new alerts. Your cash flow is running smoothly within your defined thresholds.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#CBD5E0] overflow-hidden shadow-sm">
          <div className="divide-y divide-[#CBD5E0]">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-6 flex items-start gap-4 transition-colors ${alert.is_read ? 'bg-white opacity-70' : 'bg-[#F7FAFC]'}`}
              >
                <div className="mt-1 shrink-0">
                  {getIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-bold ${alert.is_read ? 'text-[#4A5568]' : 'text-[#1B2A4A]'}`}>
                        {alert.title}
                      </h4>
                      <p className="text-[#4A5568] text-sm mt-1">{alert.body}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {!alert.is_read && (
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="mt-3 text-sm font-semibold text-[#0D7377] hover:underline"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
