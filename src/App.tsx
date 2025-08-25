import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Shield, Zap, Settings, Play, Square, Trash2, ExternalLink, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { ExchangeSetup } from './components/ExchangeSetup';
import { BotLauncher } from './components/BotLauncher';
import { BotList } from './components/BotList';

export interface User {
  id: string;
  email: string;
  plan: 'free' | 'pro';
}

export interface Bot {
  id: string;
  symbol: string;
  timeframe: string;
  strategyId: string;
  status: string;
  pid: string;
}

export interface Strategy {
  id: string;
  label: string;
}

export interface Connection {
  exchange: string;
  sandbox: boolean;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'exchange' | 'launch' | 'bots'>('dashboard');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);

  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      // In a real app, you'd have a /me endpoint
      const [strategiesRes, botsRes] = await Promise.all([
        fetch('/api/strategies', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/bots', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (strategiesRes.ok) {
        const data = await strategiesRes.json();
        setStrategies(data.strategies);
      }

      if (botsRes.ok) {
        const data = await botsRes.json();
        setBots(data.bots);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  if (!token || !user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">Divergent Bot</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 ml-8">
                <div className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${user.plan === 'pro' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                  : 'bg-slate-700 text-slate-300'
                }`}>
                  {user.plan === 'pro' ? 'PRO' : 'FREE'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-slate-300">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-1 mt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'exchange', label: 'Exchange', icon: Settings },
              { id: 'launch', label: 'Launch Bot', icon: Play },
              { id: 'bots', label: 'My Bots', icon: Zap }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-blue-600/80 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <Dashboard user={user} bots={bots} />}
        {activeTab === 'exchange' && (
          <ExchangeSetup 
            token={token} 
            connections={connections} 
            setConnections={setConnections} 
          />
        )}
        {activeTab === 'launch' && (
          <BotLauncher 
            token={token} 
            user={user} 
            strategies={strategies} 
            onBotLaunched={() => fetchUserData()}
          />
        )}
        {activeTab === 'bots' && (
          <BotList 
            token={token} 
            bots={bots} 
            onBotStopped={() => fetchUserData()}
          />
        )}
      </main>
    </div>
  );
}

export default App;