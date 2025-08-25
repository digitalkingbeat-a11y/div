import React, { useState } from 'react';
import { Play, Settings, TrendingUp, Clock, Target, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import type { User, Strategy } from '../App';

interface BotLauncherProps {
  token: string;
  user: User;
  strategies: Strategy[];
  onBotLaunched: () => void;
}

const TRADING_PAIRS = [
  'BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'DOT/USDT', 'SOL/USDT',
  'MATIC/USDT', 'LINK/USDT', 'UNI/USDT', 'AAVE/USDT', 'SUSHI/USDT'
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
];

export function BotLauncher({ token, user, strategies, onBotLaunched }: BotLauncherProps) {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('5m');
  const [strategyId, setStrategyId] = useState('');
  const [paper, setPaper] = useState(true);
  const [sandbox, setSandbox] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    if (strategies.length > 0 && !strategyId) {
      setStrategyId(strategies[0].id);
    }
  }, [strategies, strategyId]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategyId) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol,
          timeframe,
          strategyId,
          paper,
          sandbox,
          config: {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to launch bot');
      }

      setSuccess(`Bot launched successfully! Trading ${symbol} on ${timeframe} timeframe.`);
      onBotLaunched();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
        <div className="flex items-center space-x-4 mb-4">
          <Play className="h-8 w-8 text-green-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Launch Divergent Bot</h2>
            <p className="text-slate-300">Configure and start your automated trading bot</p>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-6">
          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-green-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-green-300 font-medium">Divergent Engine Ready</p>
              <p className="text-green-200">
                Advanced divergence detection strategies powered by RSI, MACD, and price action analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Launch Form */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">Bot Configuration</h3>

        <form onSubmit={handleLaunch} className="space-y-6">
          {/* Trading Pair */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Trading Pair
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TRADING_PAIRS.map((pair) => (
                  <option key={pair} value={pair}>
                    {pair}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Strategy Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              HPS Quad Divergence Strategy
            </label>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <Target className="h-5 w-5 text-blue-400" />
                <span className="font-medium text-white">HPS Quad Divergence (Holy Grail)</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Advanced multi-timeframe Stochastic divergence detection with two-stage pullback confirmation.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div>• 4 Stochastic bands (9,14,21,34)</div>
                <div>• Stage-1: All bands &lt; 20 or &gt; 80</div>
                <div>• Stage-2: Divergence confirmation</div>
                <div>• Entry: Stoch(9,3) cross + EMA filter</div>
              </div>
            </div>
            
            {/* Strategy Configuration */}
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Risk Per Trade (%)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    defaultValue="1"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Risk/Reward Ratio
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    defaultValue="1.5"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">Use EMA(20) trend filter</span>
                </label>
              </div>
            </div>
          </div>

          {/* Remove old strategy selection */}
          <div style={{ display: 'none' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  type="button"
                  onClick={() => setStrategyId(strategy.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    strategyId === strategy.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-white">{strategy.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Trading Mode */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              Trading Mode
            </label>
            
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="tradingMode"
                  checked={paper}
                  onChange={() => setPaper(true)}
                  className="w-5 h-5 text-blue-600 rounded-full mt-0.5 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="text-white font-medium">Paper Trading</span>
                  <p className="text-sm text-slate-400">
                    Simulate trades with virtual money. Perfect for testing strategies.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="tradingMode"
                  checked={!paper}
                  onChange={() => setPaper(false)}
                  disabled={user.plan === 'free'}
                  className="w-5 h-5 text-blue-600 rounded-full mt-0.5 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">Live Trading</span>
                    {user.plan === 'free' && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                        Pro Only
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    Trade with real money. {user.plan === 'free' ? 'Upgrade to Pro to enable.' : 'Use with caution.'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Sandbox Toggle */}
          <div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sandbox}
                onChange={(e) => setSandbox(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded mt-0.5 focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-white font-medium">Use Sandbox/Testnet</span>
                <p className="text-sm text-slate-400">
                  Connect to exchange testnet instead of production. Recommended for first runs.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !strategyId}
            className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium py-4 rounded-lg transition-all disabled:cursor-not-allowed text-lg"
          >
            <Play className="h-5 w-5" />
            <span>{loading ? 'Launching Bot...' : 'Launch Divergent Bot'}</span>
          </button>
        </form>
      </div>

      {/* Strategy Details */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">HPS Quad Divergence Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Multi-Band Stochastic</h4>
                <p className="text-sm text-slate-400">
                  Uses 4 Stochastic periods (9,14,21,34) to identify high-probability setups when all bands align.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Target className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Two-Stage Confirmation</h4>
                <p className="text-sm text-slate-400">
                  Stage-1: All Stoch bands below 20 (oversold) or above 80 (overbought). Stage-2: Price makes new low/high but Stoch diverges.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Precise Entry Timing</h4>
                <p className="text-sm text-slate-400">
                  Entry triggered when Stoch(9,3) crosses back through 20/80 levels with optional EMA trend confirmation.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Advanced Risk Management</h4>
                <p className="text-sm text-slate-400">
                  ATR-based stops, risk/reward targets, and trailing stops to maximize profits while protecting capital.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-300 font-medium mb-1">John Kurisko's HPS Method</p>
              <p className="text-amber-200">
                This implements the "Holy Grail" quad divergence setup from the HPS trading methodology. 
                Best suited for trending markets with clear pullback structures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}