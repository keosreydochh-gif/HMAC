
import React, { useState, useEffect } from 'react';
import { User, UserRole, AttendanceRecord, NetworkConfig } from '../types.ts';
import { DBService } from '../services/dbService.ts';
import { LogOut, Users, Settings, ClipboardList, Plus, Trash2, Download, Server, Loader2, Globe, Check, Shield } from 'lucide-react';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'network'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [network, setNetwork] = useState<NetworkConfig>({ whitelistedIps: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [currentIp, setCurrentIp] = useState('');

  // User form state
  const [newUser, setNewUser] = useState<Partial<User>>({
    id: '', name: '', position: '', department: '', password: '', role: UserRole.STAFF
  });
  const [newIp, setNewIp] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allUsers, allLogs, netConfig] = await Promise.all([
        DBService.getUsers(),
        DBService.getLogs(),
        DBService.getNetworkConfig()
      ]);
      setUsers(allUsers);
      setLogs(allLogs);
      setNetwork(netConfig);
      
      // Also get current admin IP for convenience
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      setCurrentIp(ipData.ip);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.id === newUser.id)) {
      alert('User ID already exists!');
      return;
    }
    
    setIsLoading(true);
    try {
      await DBService.saveUser(newUser as User);
      await loadData();
      setNewUser({ id: '', name: '', position: '', department: '', password: '', role: UserRole.STAFF });
    } catch (err) {
      alert('Failed to create user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    // Protect primary admin account from deletion
    if (id === 'admin') {
      alert('The primary admin account cannot be deleted for security reasons.');
      return;
    }

    if (confirm(`Are you sure you want to permanently delete user ID: ${id}?`)) {
      setIsLoading(true);
      try {
        await DBService.deleteUser(id);
        await loadData();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete user. Please check database permissions.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddIp = async (ipToAdd: string) => {
    if (!ipToAdd.trim()) return;
    if (network.whitelistedIps.includes(ipToAdd)) {
      alert('This IP is already on the whitelist.');
      return;
    }
    
    setIsLoading(true);
    try {
      const updatedConfig = { ...network, whitelistedIps: [...network.whitelistedIps, ipToAdd] };
      await DBService.saveNetworkConfig(updatedConfig);
      await loadData();
      setNewIp('');
    } catch (err) {
      alert('Failed to update whitelist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveIp = async (ip: string) => {
    if (confirm(`Remove IP ${ip} from the authorized hosts?`)) {
      setIsLoading(true);
      try {
        const updatedConfig = { 
          ...network, 
          whitelistedIps: network.whitelistedIps.filter(i => i !== ip) 
        };
        await DBService.saveNetworkConfig(updatedConfig);
        await loadData(); // Refresh all data to ensure sync
      } catch (err) {
        console.error('IP remove error:', err);
        alert('Failed to remove IP from database.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const downloadReport = () => {
    const headers = ['ID', 'Name', 'Type', 'Date', 'Time', 'IP'];
    const rows = logs.map(log => [
      log.userId,
      log.userName,
      log.type,
      new Date(log.timestamp).toLocaleDateString(),
      new Date(log.timestamp).toLocaleTimeString(),
      log.ip
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Shield size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Portal</h1>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">HMAC Management</p>
        </div>
        
        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Users size={20} className={activeTab === 'users' ? 'text-blue-600' : 'text-slate-400'} />
            <span className="font-semibold text-sm">Staff Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${activeTab === 'logs' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <ClipboardList size={20} className={activeTab === 'logs' ? 'text-blue-600' : 'text-slate-400'} />
            <span className="font-semibold text-sm">Activity Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${activeTab === 'network' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Server size={20} className={activeTab === 'network' ? 'text-blue-600' : 'text-slate-400'} />
            <span className="font-semibold text-sm">Network Config</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-semibold text-sm"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Bar */}
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeTab === 'users' ? 'Staff Directory' : activeTab === 'logs' ? 'Attendance Logs' : 'Network Settings'}
              </h2>
              <p className="text-slate-500 mt-1 font-medium">Manage your system's security and workforce.</p>
            </div>
            {isLoading && (
              <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                <Loader2 className="animate-spin text-blue-600" size={16} />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Syncing...</span>
              </div>
            )}
          </div>

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Plus size={18} />
                  </div>
                  Add New Employee
                </h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Staff ID</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-001"
                      value={newUser.id}
                      onChange={e => setNewUser({ ...newUser, id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={newUser.name}
                      onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Job Title</label>
                    <input
                      type="text"
                      placeholder="Senior Engineer"
                      value={newUser.position}
                      onChange={e => setNewUser({ ...newUser, position: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Department</label>
                    <input
                      type="text"
                      placeholder="Engineering"
                      value={newUser.department}
                      onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Pin Code</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-[46px] bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:bg-slate-300"
                    >
                      Enroll Staff Member
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Department</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{u.name}</div>
                                <div className="text-xs text-slate-400 font-medium">ID: {u.id} • {u.position}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${u.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{u.department}</td>
                          <td className="px-6 py-4 text-right">
                            {u.id !== 'admin' ? (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={isLoading}
                                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                                title="Delete user"
                              >
                                <Trash2 size={18} />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter pr-3">Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Historical Records</p>
                    <p className="text-xs text-slate-400 font-medium">Tracking {logs.length} check-in/out events.</p>
                  </div>
                </div>
                <button
                  onClick={downloadReport}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/10"
                >
                  <Download size={18} />
                  Export to CSV
                </button>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Time & Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Verification IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.length > 0 ? logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-900">{log.userName}</div>
                            <div className="text-xs text-slate-400 font-medium">Staff ID: {log.userId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${log.type === 'CHECK_IN' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                              {log.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-[11px] font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded text-slate-500">
                              {log.ip}
                            </code>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium italic">No activity detected within the system logs yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-8 max-w-3xl">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Globe size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Whitelist Infrastructure</h3>
                    <p className="text-slate-500 text-sm font-medium">Configure fixed IP addresses for authorized site locations.</p>
                  </div>
                </div>
                
                {currentIp && (
                  <div className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500 text-white rounded-lg">
                        <Check size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Current Admin IP</p>
                        <p className="font-mono text-lg font-bold text-slate-700">{currentIp}</p>
                      </div>
                    </div>
                    {!network.whitelistedIps.includes(currentIp) && (
                      <button 
                        onClick={() => handleAddIp(currentIp)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                      >
                        Whitelist My Network
                      </button>
                    )}
                  </div>
                )}
                
                <form onSubmit={(e) => { e.preventDefault(); handleAddIp(newIp); }} className="flex gap-3 mb-8">
                  <input
                    type="text"
                    placeholder="Enter Public IP Address (e.g. 192.168.1.1)"
                    value={newIp}
                    onChange={e => setNewIp(e.target.value)}
                    className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                  >
                    Add Host
                  </button>
                </form>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-4">Authorized Hosts ({network.whitelistedIps.length})</h4>
                  {network.whitelistedIps.length > 0 ? network.whitelistedIps.map(ip => (
                    <div key={ip} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group hover:border-blue-200 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="font-mono text-sm font-bold text-slate-700">{ip}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveIp(ip)}
                        disabled={isLoading}
                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                        title="Remove IP"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )) : (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                      <p className="text-slate-400 text-sm font-medium italic">No IP restrictions configured. System is currently open.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
