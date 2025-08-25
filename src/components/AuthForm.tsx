import React, { useState } from 'react';
import { TrendingUp, User, Mail, Crown } from 'lucide-react';
import type { User as UserType } from '../App';

interface AuthFormProps {
  onLogin: (token: string, user: UserType) => void;
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, plan: selectedPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-12 w-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Divergent Bot</h1>
          <p className="text-slate-400">Automated trading made simple</p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Choose Your Plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('free')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPlan === 'free'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-5 w-5 text-slate-400" />
                    <span className="font-medium text-white">Free</span>
                  </div>
                  <p className="text-xs text-slate-400">Paper trading only</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('pro')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPlan === 'pro'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Crown className="h-5 w-5 text-amber-400" />
                    <span className="font-medium text-white">Pro</span>
                  </div>
                  <p className="text-xs text-slate-400">Live trading enabled</p>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium py-3 rounded-lg transition-all disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Get Started'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            By signing up, you agree to start your trading journey with Divergent Bot
          </div>
        </div>
      </div>
    </div>
  );
}