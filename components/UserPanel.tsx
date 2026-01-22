
import React, { useState, useEffect } from 'react';
import { User, AttendanceType, AttendanceRecord } from '../types.ts';
import { DBService } from '../services/dbService.ts';
import { LogOut, CheckCircle, Clock, MapPin, Network, AlertTriangle, Loader2, ArrowRightCircle, User as UserIcon, RefreshCw } from 'lucide-react';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  const [currentIp, setCurrentIp] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchIpAndStatus = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setCurrentIp(data.ip);
      
      const config = await DBService.getNetworkConfig();
      setIsWhitelisted(config.whitelistedIps.includes(data.ip));
    } catch (error) {
      console.error('Failed to fetch IP:', error);
      setMessage({ text: 'Network verification failed. Check your connection.', type: 'error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const loadLogs = async () => {
    const allLogs = await DBService.getLogs();
    setLogs(allLogs.filter(l => l.userId === user.id));
  };

  useEffect(() => {
    fetchIpAndStatus();
    loadLogs();
    
    // Auto refresh IP status every 30 seconds
    const interval = setInterval(fetchIpAndStatus, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleAction = async (type: AttendanceType) => {
    if (!isWhitelisted || isProcessing) return;

    setIsProcessing(true);
    try {
      const newLog: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userName: user.name,
        timestamp: Date.now(),
        type,
        ip: currentIp
      };

      await DBService.addLog(newLog);
      await loadLogs();
      setMessage({ 
        text: `Operation successful: ${type === AttendanceType.CHECK_IN ? 'Check-in' : 'Check-out'} recorded at ${new Date().toLocaleTimeString()}`, 
        type: 'success' 
      });
      
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ text: 'Database error. Your attendance could not be saved.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <UserIcon size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">SecureHub</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Console</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all flex items-center gap-2 group"
        >
          <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Exit</span>
          <LogOut size={20} />
        </button>
      </nav>

      <div className="max-w-5xl mx-auto w-full p-6 md:p-10 space-y-8">
        {/* Profile Card */}
        <header className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-6 items-center">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-blue-100">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{user.department}</span>
                <span>{user.position}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[240px]">
            <div className="p-2.5 bg-white rounded-xl shadow-sm text-slate-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Status</p>
              <p className="text-sm font-bold text-slate-800">No active session detected</p>
            </div>
          </div>
        </header>

        {/* Dynamic Alerts */}
        {message && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <CheckCircle size={20} />
            <p className="text-sm font-bold">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <section className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Network Authorization</h3>
              <div className="space-y-6">
                <div className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${
                  isWhitelisted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    isWhitelisted ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-amber-500 text-white shadow-amber-200'
                  }`}>
                    {isVerifying ? <Loader2 size={24} className="animate-spin" /> : 
                     isWhitelisted ? <Network size={24} /> : <AlertTriangle size={24} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {isVerifying ? 'Verifying Gateway...' : isWhitelisted ? 'Network Authorized' : 'Unknown Network'}
                    </p>
                    <p className="text-xs font-mono text-slate-500">{currentIp || 'Scanning...'}</p>
                  </div>
                </div>

                {!isWhitelisted && !isVerifying && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-600 font-bold leading-relaxed">
                    CRITICAL: Your current IP is not in the whitelist. Please connect to company Wi-Fi to unlock attendance controls.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <button
                    disabled={!isWhitelisted || isVerifying || isProcessing}
                    onClick={() => handleAction(AttendanceType.CHECK_IN)}
                    className={`w-full h-20 rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] ${
                      isWhitelisted ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <ArrowRightCircle size={28} />}
                    <span className="text-lg font-black tracking-tight">Clock In</span>
                  </button>
                  <button
                    disabled={!isWhitelisted || isVerifying || isProcessing}
                    onClick={() => handleAction(AttendanceType.CHECK_OUT)}
                    className={`w-full h-20 rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] ${
                      isWhitelisted ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-black' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <LogOut size={28} />}
                    <span className="text-lg font-black tracking-tight">Clock Out</span>
                  </button>
                </div>

                <button 
                  onClick={fetchIpAndStatus}
                  disabled={isVerifying}
                  className="w-full py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={12} className={isVerifying ? 'animate-spin' : ''} />
                  Force Network Sync
                </button>
              </div>
            </div>
          </section>

          {/* Logs */}
          <section className="lg:col-span-7">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Recent Activity</h3>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-tighter">Live Feed</span>
              </div>
              
              <div className="overflow-y-auto max-h-[500px] scrollbar-hide">
                {logs.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {logs.map(log => (
                      <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            log.type === AttendanceType.CHECK_IN ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {log.type === AttendanceType.CHECK_IN ? <Clock size={22} /> : <LogOut size={22} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {log.type.replace('_', ' ')} Recorded
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                              {new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter group-hover:text-blue-500 transition-colors">
                            {log.ip}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <Clock size={32} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium italic">No attendance records found for this user.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
