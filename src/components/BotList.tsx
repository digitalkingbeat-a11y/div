import React from 'react';
import { Square, Trash2, Activity, Clock, TrendingUp, Eye } from 'lucide-react';
import type { Bot } from '../App';
import { LiveLogs } from './LiveLogs';

interface BotListProps {
  token: string;
  bots: Bot[];
  onBotStopped: () => void;
}

export function BotList({ token, bots, onBotStopped }: BotListProps) {
  const [stopping, setStopping] = React.useState<Set<string>>(new Set());
  const [viewingLogs, setViewingLogs] = React.useState<string | null>(null);

  const handleStopBot = async (botId: string) => {
    setStopping(prev => new Set(prev).add(botId));
    
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onBotStopped();
      } else {
        console.error('Failed to stop bot');
      }
    } catch (error) {
      console.error('Error stopping bot:', error);
    } finally {
      setStopping(prev => {
        const next = new Set(prev);
        next.delete(botId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
        <div className="flex items-center space-x-4 mb-4">
          <Activity className="h-8 w-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">My Bots</h2>
            <p className="text-slate-300">Manage your active trading bots</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{bots.length}</p>
              <p className="text-slate-400 text-sm">Total Bots</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {bots.filter(bot => bot.status === 'running').length}
              </p>
              <p className="text-slate-400 text-sm">Running</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                {bots.filter(bot => bot.status === 'stopped').length}
              </p>
              <p className="text-slate-400 text-sm">Stopped</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bot List */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
        {bots.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">No bots running</h3>
            <p className="text-slate-500">Launch your first Divergent bot to start trading!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-6">Active Bots</h3>
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${
                      bot.status === 'running' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`} />
                    
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="text-lg font-semibold text-white">{bot.symbol}</h4>
                        <span className="text-sm text-slate-400">•</span>
                        <span className="text-sm text-slate-300">{bot.timeframe}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span>Strategy: {bot.strategyId}</span>
                        <span>•</span>
                        <span>PID: {bot.pid}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bot.status === 'running' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                      </span>
                    </div>

                    {bot.status === 'running' && (
                      <button
                        onClick={() => setViewingLogs(bot.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-700 text-white font-medium rounded-lg transition-all mr-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Logs</span>
                      </button>
                    )}

                    {bot.status === 'running' && (
                      <button
                        onClick={() => handleStopBot(bot.id)}
                        disabled={stopping.has(bot.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600/80 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                      >
                        <Square className="h-4 w-4" />
                        <span>{stopping.has(bot.id) ? 'Stopping...' : 'Stop'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {bot.status === 'running' && (
                  <div className="mt-4 pt-4 border-t border-slate-700/30">
                    <div className="flex items-center space-x-6 text-sm text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Running since launch</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Monitoring divergences</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Logs Modal */}
      {viewingLogs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-5/6">
            <LiveLogs
              botId={viewingLogs}
              token={token}
              symbol={bots.find(b => b.id === viewingLogs)?.symbol || ''}
              onClose={() => setViewingLogs(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}