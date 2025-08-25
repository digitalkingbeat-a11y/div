import React, { useState, useEffect, useRef } from 'react';
import { Activity, Maximize2, Minimize2, Trash2, Pause, Play } from 'lucide-react';

interface LiveLogsProps {
  botId: string;
  token: string;
  symbol: string;
  onClose: () => void;
}

export function LiveLogs({ botId, token, symbol, onClose }: LiveLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!botId || isPaused) return;

    const eventSource = new EventSource(`/api/logs/${botId}`, {
      // Note: EventSource doesn't support custom headers, so we'll need to modify the server endpoint
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connected to bot logs...`]);
    };

    eventSource.onmessage = (event) => {
      if (event.data && event.data !== 'bot-exited') {
        setLogs(prev => [...prev.slice(-99), event.data]); // Keep last 100 lines
      }
    };

    eventSource.addEventListener('end', () => {
      setIsConnected(false);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Bot stopped.`]);
      eventSource.close();
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connection error. Retrying...`]);
    };

    return () => {
      eventSource.close();
    };
  }, [botId, isPaused]);

  useEffect(() => {
    if (!isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  const clearLogs = () => {
    setLogs([]);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const formatLogLine = (line: string) => {
    // Highlight different types of log messages
    if (line.includes('LONG ENTRY') || line.includes('SHORT ENTRY')) {
      return 'text-green-400 font-semibold';
    }
    if (line.includes('EXIT') || line.includes('Stop Loss') || line.includes('Take Profit')) {
      return 'text-blue-400 font-semibold';
    }
    if (line.includes('ERROR') || line.includes('error')) {
      return 'text-red-400';
    }
    if (line.includes('PnL:')) {
      return 'text-yellow-400 font-medium';
    }
    return 'text-slate-300';
  };

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-lg transition-all ${
      isMaximized ? 'fixed inset-4 z-50' : 'h-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Activity className={`h-5 w-5 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
          <div>
            <h3 className="font-semibold text-white">Live Bot Logs</h3>
            <p className="text-sm text-slate-400">{symbol} • Bot ID: {botId.slice(0, 8)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePause}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          
          <button
            onClick={clearLogs}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Logs Content */}
      <div className="h-full overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Waiting for bot logs...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className={formatLogLine(log)}>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="border-t border-slate-700 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span className={`flex items-center space-x-1 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </span>
            {isPaused && (
              <span className="text-yellow-400">Paused</span>
            )}
          </div>
          <span>{logs.length} lines</span>
        </div>
      </div>
    </div>
  );
}