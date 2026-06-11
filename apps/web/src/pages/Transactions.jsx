import { useState, useEffect } from 'react';
import { UploadCloud, Search, Filter, MoreHorizontal } from 'lucide-react';
import axios from 'axios';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error('API Error:', err);
      // Fallback for UI if API is not running during early dev
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:3001/api/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      fetchTransactions();
    } catch (err) {
      console.error('Upload Error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCategoryEdit = async (id, currentCategory) => {
    const newCategory = window.prompt("Enter new category:", currentCategory);
    if (newCategory && newCategory !== currentCategory) {
      try {
        await axios.patch(`http://localhost:3001/api/transactions/${id}/category`, {
          category: newCategory
        });
        setTransactions(transactions.map(t => t.id === id ? { ...t, category: newCategory } : t));
      } catch (err) {
        console.error('Failed to update category:', err);
        alert('Failed to update category');
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-[#1B2A4A]">Transactions</h2>
        <div className="flex gap-3">
          <label className="bg-white border border-[#CBD5E0] text-[#1B2A4A] px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors shadow-sm">
            <UploadCloud size={18} />
            Upload CSV
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={e => setFile(e.target.files[0])} 
            />
          </label>
        </div>
      </div>

      {file && (
        <div className="mb-6 bg-white p-4 rounded-xl border border-[#0D7377] flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div>
            <p className="font-medium text-[#1B2A4A]">Selected file: {file.name}</p>
            <p className="text-sm text-[#4A5568]">Click upload to ingest and categorize transactions.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFile(null)} className="px-4 py-2 text-[#4A5568] hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
            <button 
              onClick={handleFileUpload} 
              disabled={isUploading}
              className="bg-[#0D7377] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#14A085] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isUploading ? 'Uploading...' : 'Confirm Upload'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#CBD5E0] flex-1 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#CBD5E0] flex items-center justify-between shrink-0 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="pl-10 pr-4 py-2 border border-[#CBD5E0] rounded-lg focus:outline-none focus:border-[#0D7377] text-sm w-64 shadow-sm"
            />
          </div>
          <button onClick={() => alert('Filter options will open here.')} className="flex items-center gap-2 text-[#4A5568] border border-[#CBD5E0] px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#F7FAFC] shadow-[0_1px_0_#CBD5E0] z-10">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-[#4A5568] uppercase tracking-wider">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#4A5568] uppercase tracking-wider">Description</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#4A5568] uppercase tracking-wider">Category</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#4A5568] uppercase tracking-wider text-right">Amount</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#4A5568] uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD5E0]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-[#4A5568]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <UploadCloud size={32} className="text-gray-400" />
                      </div>
                      <p className="text-base font-medium text-[#1B2A4A] mb-1">No transactions yet</p>
                      <p className="text-sm max-w-sm">Upload a bank statement in CSV format to get started with your cash flow intelligence.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 text-sm text-[#4A5568] whitespace-nowrap">
                      {new Date(txn.txn_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-sm font-medium text-[#1B2A4A]">
                      {txn.merchant_name && txn.merchant_name !== 'Unknown' 
                        ? <span className="capitalize">{txn.merchant_name}</span> 
                        : txn.description_clean}
                      <div className="text-xs text-[#718096] font-normal truncate max-w-md">{txn.description_raw}</div>
                    </td>
                    <td className="py-3 px-6 text-sm">
                      <button 
                        onClick={() => handleCategoryEdit(txn.id, txn.category)}
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-[#EBF4F5] text-[#0D7377] border border-[#0D7377]/20 hover:bg-[#D5E9EB] transition-colors cursor-pointer"
                        title="Click to edit category"
                      >
                        {txn.category}
                      </button>
                    </td>
                    <td className={`py-3 px-6 text-sm font-semibold text-right tabular-nums whitespace-nowrap ${txn.direction === 'credit' ? 'text-[#38A169]' : 'text-[#1B2A4A]'}`}>
                      {txn.direction === 'credit' ? '+' : '-'}₹{Number(txn.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => alert('Transaction details will appear here.')}>
                      <MoreHorizontal size={18} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
