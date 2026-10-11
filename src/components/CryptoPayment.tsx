import React from 'react';
import { ExternalLink } from 'lucide-react';

export function CryptoPayment() {
  const NOWPAYMENTS_URL = "https://nowpayments.io/payment/?iid=6060929558";

  return (
    <div className="bg-[#0b0f19] p-6 rounded-2xl border border-slate-800 space-y-6 text-center">
      <h3 className="text-xl font-bold text-white">Monthly Subscription</h3>
      <p className="text-slate-400">Please complete your payment of 35 USD to access the site.</p>
      <a 
        href={NOWPAYMENTS_URL} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors"
      >
        Pay with Crypto <ExternalLink size={18} />
      </a>
    </div>
  );
}
