
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { DBService } from '../services/dbService.ts';
import { ShieldCheck, User as UserIcon, Lock, Loader2, Network, AlertCircle, RefreshCw } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Network status states
  const [isVerifyingNetwork, setIsVerifyingNetwork] = useState(true);
  const [isNetworkWhitelisted, setIsNetworkWhitelisted] = useState(false);
  const [currentIp, setCurrentIp] = useState('');

  const verifyNetwork = async () => {
    setIsVerifyingNetwork(true);
    setError('');
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setCurrentIp(data.ip);
      
      const config = await DBService.getNetworkConfig();
      const whitelisted = config.whitelistedIps.includes(data.ip);
      setIsNetworkWhitelisted(whitelisted);
    } catch (err) {
      console.error('Network verification failed:', err);
      setError('Could not verify network connection. Please check your internet.');
    } finally {
      setIsVerifyingNetwork(false);
    }
  };

  useEffect(() => {
    verifyNetwork();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const users = await DBService.getUsers();
      const foundUser = users.find(u => u.id === userId && u.password === password);

      if (foundUser) {
        // Admin Bypass Logic: Admins can login from any IP. Staff are restricted.
        if (foundUser.role === UserRole.ADMIN) {
          onLogin(foundUser);
        } else if (isNetworkWhitelisted) {
          onLogin(foundUser);
        } else {
          setError('Staff access is restricted to authorized networks only.');
        }
      } else {
        setError('Invalid credentials. Please check your ID and password.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-blue-600 p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"></div>
          <div className="relative z-10">
            <div className="mx-auto w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30 transform rotate-12 transition-transform hover:rotate-0 duration-300">
              <ShieldCheck size={40} className="drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">HMAC Attendance System</h1>
            <p className="text-blue-100 mt-2 font-medium opacity-90">Login to your account</p>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          {/* Network Status Banner */}
          <div className={`p-4 rounded-2xl flex items-center gap-4 border transition-all duration-500 ${
            isVerifyingNetwork ? 'bg-slate-50 border-slate-100 text-slate-500' :
            isNetworkWhitelisted ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
            'bg-amber-50 border-amber-100 text-amber-700'
          }`}>
            <div className={`p-2.5 rounded-xl ${
              isVerifyingNetwork ? 'bg-slate-200' :
              isNetworkWhitelisted ? 'bg-emerald-500 text-white' :
              'bg-amber-500 text-white'
            }`}>
              {isVerifyingNetwork ? <Loader2 size={18} className="animate-spin" /> : 
               isNetworkWhitelisted ? <Network size={18} /> : <AlertCircle size={18} />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                Network Status
              </p>
              <p className="text-sm font-semibold">
                {isVerifyingNetwork ? 'Locating device...' : 
                 isNetworkWhitelisted ? 'Authorized Network' : 'Restricted'}
              </p>
            </div>
            {!isVerifyingNetwork && (
              <button 
                onClick={verifyNetwork}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                title="Refresh Network Status"
              >
                <RefreshCw size={14} className={isVerifyingNetwork ? 'animate-spin' : ''} />
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-sm font-semibold border border-rose-100 animate-in fade-in slide-in-from-top-4 duration-300">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Staff ID</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="Enter your ID"
                  required
                  disabled={isSubmitting || isVerifyingNetwork}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium tracking-widest"
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting || isVerifyingNetwork}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isVerifyingNetwork}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-blue-500/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Verifying Identity...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                </>
              )}
            </button>
          </form>
          
          <div className="text-center">
            <p className="text-slate-400 text-xs font-medium">
              Powered by Soun Davit - IT of HMAC • {currentIp || 'Unknown IP'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
