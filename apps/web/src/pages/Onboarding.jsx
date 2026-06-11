import { useState } from 'react';
import { Activity, UploadCloud, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Onboarding({ onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', industry: 'Retail', revenue_range: '1Cr-10Cr' });

  const handleNext = async () => {
    if (step === 1) {
      // Save business setup
      try {
        await axios.post('http://localhost:3001/api/businesses/setup', formData);
        setStep(2);
      } catch (err) {
        console.error(err);
        setStep(2); // continue for MVP testing even if API fails
      }
    } else if (step === 2) {
      setStep(3);
    } else {
      onComplete();
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#CBD5E0] p-8">
        
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="text-[#0D7377]" size={32} />
          <h1 className="text-2xl font-black text-[#1B2A4A]">CashRadar</h1>
        </div>
        
        <div className="flex mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-2 mx-1 rounded-full bg-gray-200 overflow-hidden">
              <div className={`h-full ${step >= s ? 'bg-[#0D7377]' : 'bg-transparent'} transition-all`}></div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-[#1B2A4A]">Tell us about your business</h2>
            <p className="text-[#4A5568] text-sm mb-4">This helps us tailor your risk intelligence.</p>
            
            <div>
              <label className="block text-sm font-medium text-[#4A5568] mb-1">Business Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-[#CBD5E0] rounded-lg focus:outline-none focus:border-[#0D7377] focus:ring-1 focus:ring-[#0D7377]" 
                placeholder="e.g. Mehta Auto Parts" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4A5568] mb-1">Industry</label>
              <select 
                value={formData.industry}
                onChange={e => setFormData({...formData, industry: e.target.value})}
                className="w-full p-3 border border-[#CBD5E0] rounded-lg focus:outline-none focus:border-[#0D7377]"
              >
                <option>Retail</option>
                <option>Manufacturing</option>
                <option>Services</option>
                <option>Wholesale</option>
                <option>F&B</option>
              </select>
            </div>
            
            <button 
              onClick={handleNext}
              disabled={!formData.name}
              className="w-full mt-6 bg-[#0D7377] text-white py-3 rounded-lg font-semibold hover:bg-[#14A085] disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 text-center">
            <h2 className="text-xl font-bold text-[#1B2A4A]">Connect Data</h2>
            <p className="text-[#4A5568] text-sm mb-6">Upload your bank statement to get started.</p>
            
            <div className="border-2 border-dashed border-[#CBD5E0] p-8 rounded-xl bg-[#F7FAFC]">
              <UploadCloud className="mx-auto text-[#0D7377] mb-2" size={32} />
              <p className="text-[#1B2A4A] font-medium">Upload CSV</p>
              <p className="text-xs text-[#718096] mt-1">Supports standard bank exports</p>
            </div>
            
            <button 
              onClick={handleNext}
              className="w-full mt-6 bg-[#0D7377] text-white py-3 rounded-lg font-semibold hover:bg-[#14A085] transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 text-center py-6">
            <CheckCircle2 className="mx-auto text-[#38A169] mb-4" size={48} />
            <h2 className="text-2xl font-bold text-[#1B2A4A]">You're all set!</h2>
            <p className="text-[#4A5568] text-sm">We're setting up your risk intelligence dashboard.</p>
            
            <button 
              onClick={handleNext}
              className="w-full mt-8 bg-[#0D7377] text-white py-3 rounded-lg font-semibold hover:bg-[#14A085] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
