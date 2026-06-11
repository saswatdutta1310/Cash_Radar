// A simple rule-based merchant intelligence layer for Phase 1 MVP
const rules = [
  { keywords: ['salary', 'payroll', 'wages'], category: 'Payroll', type: 'debit' },
  { keywords: ['amazon', 'flipkart', 'cloud', 'aws', 'gcp'], category: 'Software & IT', type: 'debit' },
  { keywords: ['rent', 'lease'], category: 'Rent', type: 'debit' },
  { keywords: ['upi', 'paytm', 'phonepe'], category: 'General Expense', type: 'debit' },
  { keywords: ['loan', 'emi', 'hdfc bank loan', 'sbi loan'], category: 'Debt Repayment', type: 'debit' },
  { keywords: ['interest', 'dividend'], category: 'Investment Income', type: 'credit' },
  { keywords: ['neft', 'rtgs', 'imps', 'upi'], category: 'Sales Revenue', type: 'credit' },
];

function categorize(description, direction) {
  const lowerDesc = description.toLowerCase();
  
  for (const rule of rules) {
    if (rule.type === direction) {
      if (rule.keywords.some(kw => lowerDesc.includes(kw))) {
        return {
          category: rule.category,
          merchant_name: rule.keywords.find(kw => lowerDesc.includes(kw)), // basic extraction
          confidence: 0.8
        };
      }
    }
  }

  // Default fallbacks
  return {
    category: direction === 'credit' ? 'Other Revenue' : 'Other Expense',
    merchant_name: 'Unknown',
    confidence: 0.4
  };
}

module.exports = { categorize };
