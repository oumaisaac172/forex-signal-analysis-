import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { CryptoPayment } from './CryptoPayment';
import { getUserSubscription, saveUserSubscription, isUserAdmin } from '../firebase';
import { UserSubscription } from '../types';
import { Loader2, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface Props {
  user: User;
}

export function SubscriptionSelection({ user }: Props) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const isAdmin = isUserAdmin(user);

  useEffect(() => {
    async function fetchSub() {
      const sub = await getUserSubscription(user.uid);
      if (!sub) {
        // Create trial
        const trialSub: UserSubscription = {
          userId: user.uid,
          plan: 'trial',
          status: 'active',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        await saveUserSubscription(user.uid, trialSub);
        setSubscription(trialSub);
      } else {
        setSubscription(sub);
      }
      setLoading(false);
    }
    fetchSub();
  }, [user.uid]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber-500" /></div>;

  if (isAdmin) {
    return (
      <div className="p-6 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl flex flex-col items-center gap-4">
        <ShieldCheck size={48} />
        <div className="text-center">
          <p className="font-bold">You have Unlimited Admin Access!</p>
          <p className="text-sm text-amber-400">All features are available to you.</p>
        </div>
      </div>
    );
  }

  if (subscription && subscription.plan !== 'trial' && subscription.status === 'active' && new Date(subscription.expiresAt) > new Date()) {
     // Already active
     return (
       <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl flex flex-col items-center gap-4">
         <CheckCircle size={48} /> 
         <div className="text-center">
           <p className="font-bold">You have an active {subscription.plan} subscription!</p>
           <p className="text-sm text-emerald-400">Expires on {formatDate(subscription.expiresAt)}</p>
         </div>
       </div>
     );
  }

  const plans = [
    { id: 'monthly', name: 'Monthly Access', price: 35 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#0b0f19] p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xl font-bold text-white">Choose Your Plan</h3>
        {subscription && subscription.plan === 'trial' && (
           <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-300">
             <Clock />
             <span>Your 1-week free trial expires on {new Date(subscription.expiresAt).toLocaleDateString()}</span>
           </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} className={`p-4 rounded-xl border ${selectedPlan === plan.id ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-900'} hover:border-amber-500 transition-all text-left`}>
              <div className="font-bold text-white">{plan.name}</div>
              <div className="text-2xl font-bold text-amber-400">${plan.price}</div>
            </button>
          ))}
        </div>
      </div>
      
      <CryptoPayment />
    </div>
  );
}
