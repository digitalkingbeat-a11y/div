import React from 'react';
import { Activity, TrendingUp, Zap, DollarSign, Clock, Target } from 'lucide-react';
import type { User, Bot } from '../App';

interface DashboardProps {
  user: User;
  bots: Bot[];
}

export function Dashboard({ user, bots }: DashboardProps) {
  const runningBots = bots.filter(bot => bot.status === 'running').length;
  const totalBots = bots.length;

  const stats = [
    {
      label: 'Active Bots',
      value: runningBots.toString(),
      icon: Zap,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Total Bots',
      value: totalBots.toString(),
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Plan',
      value: user.plan.toUpperCase(),
      icon: Target,
      color: user.plan === 'pro' ? 'text-amber-400' : 'text-slate-400',
      bgColor: user.plan === 'pro' ? 'bg-amber-500/10' : 'bg-slate-500/10',
    },
    {
      label: 'Trading Mode',
      value: user.plan === 'pro' ? 'Live & Paper' : 'Paper Only',
      icon: DollarSign,
      color: user.plan === 'pro' ? 'text-green-400' : 'text-orange-400',
      bgColor: user.plan === 'pro' ? 'bg-green-500/10' : 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-800/50 to-blue-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-slate-300 text-lg">
              Your Divergent trading dashboard is ready to go.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">Quick Start Guide</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Connect Exchange</h4>
              <p className="text-slate-400 text-sm">
                Link your exchange account or run in demo mode
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Choose Strategy</h4>
              <p className="text-slate-400 text-sm">
                Select from RSI+MACD or Hidden Divergence strategies
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Launch Bot</h4>
              <p className="text-slate-400 text-sm">
                Configure your settings and start automated trading
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bots */}
      {bots.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Bots</h3>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>
          
          <div className="space-y-4">
            {bots.slice(0, 3).map((bot) => (
              <div
                key={bot.id}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    bot.status === 'running' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="font-medium text-white">{bot.symbol}</p>
                    <p className="text-sm text-slate-400">{bot.timeframe} • {bot.strategyId}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  bot.status === 'running' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {bot.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}