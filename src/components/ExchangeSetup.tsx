import React, { useState } from 'react';
import { Settings, Plus, Shield, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import type { Connection } from '../App';

interface ExchangeSetupProps {
  token: string;
  connections: Connection[];
  setConnections: (connections: Connection[]) => void;
}

const SUPPORTED_EXCHANGES = [
  { id: 'binance', name: 'Binance', popular: true },
  { id: 'coinbase', name: 'Coinbase Pro', popular: true },
  { id: 'kraken', name: 'Kraken', popular: false },
  { id: 'bitfinex', name: 'Bitfinex', popular: false },
  { id: 'huobi', name: 'Huobi', popular: false },
];

export function ExchangeSetup({ token, connections, setConnections }: ExchangeSetupProps) {
  const [selectedExchange, setSelectedExchange] = useState('');
  const [isSandbox, setIsSandbox] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExchange) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/link-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          exchange: selectedExchange,
          sandbox: isSandbox,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Connection failed');
      }

      setConnections(data.connections);
      setSuccess(`Successfully connected to ${selectedExchange}`);
      setSelectedExchange('');
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
          <Settings className="h-8 w-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Exchange Setup</h2>
            <p className="text-slate-300">Connect your exchange or use demo mode</p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium">Secure Connection</p>
              <p className="text-blue-200">
                Your API keys are encrypted and stored securely. We recommend using sandbox/testnet for initial testing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Form */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">Add New Connection</h3>

        <form onSubmit={handleConnect} className="space-y-6">
          {/* Exchange Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Select Exchange
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUPPORTED_EXCHANGES.map((exchange) => (
                <button
                  key={exchange.id}
                  type="button"
                  onClick={() => setSelectedExchange(exchange.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                    selectedExchange === exchange.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{exchange.name}</span>
                    {exchange.popular && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Popular
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sandbox Toggle */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSandbox}
                onChange={(e) => setIsSandbox(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-white font-medium">Use Sandbox/Testnet</span>
                <p className="text-sm text-slate-400">
                  Recommended for testing. No real money involved.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedExchange}
            className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium py-3 rounded-lg transition-all disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
            <span>{loading ? 'Connecting...' : 'Connect Exchange'}</span>
          </button>
        </form>
      </div>

      {/* Connected Exchanges */}
      {connections.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6">Connected Exchanges</h3>
          
          <div className="space-y-4">
            {connections.map((connection, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <div>
                    <p className="font-medium text-white capitalize">{connection.exchange}</p>
                    <p className="text-sm text-slate-400">
                      {connection.sandbox ? 'Sandbox Mode' : 'Live Trading'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    Connected
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo Mode Info */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-orange-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-300 mb-2">Demo Mode Available</h4>
            <p className="text-orange-200 text-sm">
              Don't have an exchange account? No problem! You can still test all strategies in demo mode 
              with simulated market data. Simply skip the exchange setup and launch bots directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}