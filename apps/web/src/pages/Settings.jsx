import { useState } from 'react';
import { Settings as SettingsIcon, CreditCard, Lock, Shield, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
  const [upgrading, setUpgrading] = useState(false);
  const [plan, setPlan] = useState('free');

  const handleUpgrade = async () => {
    setUpgrading(true);
    // Mock Razorpay integration delay
    setTimeout(() => {
      setPlan('pro');
      setUpgrading(false);
      alert('Mock Razorpay: Payment Successful! You are now on the Pro Plan.');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1B2A4A] flex items-center gap-2">
          <SettingsIcon size={24} className="text-[#0D7377]" />
          Settings & Billing
        </h2>
        <p className="text-[#4A5568] mt-1 text-sm">Manage your account, API connections, and subscription plan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white p-6 rounded-xl border border-[#CBD5E0] shadow-sm">
            <h3 className="font-bold text-[#1B2A4A] mb-4">Business Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4A5568] mb-1">Business Name</label>
                <input type="text" disabled value="Mehta Auto Parts" className="w-full p-2 border border-[#CBD5E0] bg-gray-50 rounded-lg text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4A5568] mb-1">Email</label>
                <input type="email" disabled value="test@cashradar.com" className="w-full p-2 border border-[#CBD5E0] bg-gray-50 rounded-lg text-gray-500" />
              </div>
            </div>
          </div>

          {/* Data Connections */}
          <div className="bg-white p-6 rounded-xl border border-[#CBD5E0] shadow-sm">
            <h3 className="font-bold text-[#1B2A4A] mb-4">Data Integrations</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-[#CBD5E0] rounded-lg bg-[#F7FAFC]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-[#CBD5E0] rounded flex items-center justify-center font-bold text-[#1B2A4A]">CSV</div>
                  <div>
                    <p className="font-semibold text-[#1B2A4A]">Manual CSV Upload</p>
                    <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12}/> Connected</p>
                  </div>
                </div>
                <button onClick={() => alert('CSV Configuration options will open here.')} className="text-sm font-medium text-[#4A5568] border border-[#CBD5E0] px-3 py-1.5 rounded bg-white hover:bg-gray-50">Configure</button>
              </div>

              <div className="flex items-center justify-between p-3 border border-[#CBD5E0] rounded-lg bg-white opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFDCA8] border border-[#F6A820] rounded flex items-center justify-center font-bold text-[#D08400]">TL</div>
                  <div>
                    <p className="font-semibold text-[#1B2A4A]">Tally Prime (Sync)</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Lock size={12}/> Requires Pro Plan</p>
                  </div>
                </div>
                <button disabled onClick={() => alert('Upgrade to Pro to connect Tally Prime.')} className="text-sm font-medium text-gray-400 border border-[#CBD5E0] px-3 py-1.5 rounded bg-gray-50">Connect</button>
              </div>
            </div>
          </div>
        </div>

        {/* Billing / Subscription Card */}
        <div className="lg:col-span-1">
          <div className={`p-6 rounded-xl border shadow-sm ${plan === 'pro' ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]' : 'bg-white border-[#0D7377]'}`}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={20} className={plan === 'pro' ? 'text-[#14A085]' : 'text-[#0D7377]'} />
              <h3 className={`font-bold ${plan === 'pro' ? 'text-white' : 'text-[#1B2A4A]'}`}>Subscription Plan</h3>
            </div>
            
            {plan === 'free' ? (
              <>
                <p className="text-[#0D7377] font-black text-3xl mb-1">Free</p>
                <p className="text-sm text-[#4A5568] mb-6">Current active plan.</p>
                
                <ul className="space-y-2 mb-6 text-sm text-[#4A5568]">
                  <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#0D7377]" /> 1,000 Transactions/mo</li>
                  <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#0D7377]" /> Basic Risk Dashboard</li>
                  <li className="flex items-center gap-2 text-gray-400 line-through"><Lock size={16} /> Tally Prime Integration</li>
                  <li className="flex items-center gap-2 text-gray-400 line-through"><Lock size={16} /> Multi-user Access</li>
                </ul>

                <button 
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full bg-[#0D7377] text-white py-2.5 rounded-lg font-bold hover:bg-[#14A085] transition-colors flex justify-center items-center gap-2"
                >
                  {upgrading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Upgrade to Pro - ₹999/mo'}
                </button>
                <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1"><Shield size={12}/> Secure Mock Razorpay Checkout</p>
              </>
            ) : (
              <>
                <p className="text-[#14A085] font-black text-3xl mb-1">Pro</p>
                <p className="text-sm text-gray-300 mb-6">Active until Jul 11, 2026.</p>
                
                <ul className="space-y-2 mb-6 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#14A085]" /> Unlimited Transactions</li>
                  <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#14A085]" /> Advanced Risk Dashboard</li>
                  <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#14A085]" /> Tally Prime Integration</li>
                  <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#14A085]" /> Priority Support</li>
                </ul>

                <button onClick={() => alert('Redirecting to Stripe/Razorpay Billing Portal...')} className="w-full bg-white text-[#1B2A4A] py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Manage Billing
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
