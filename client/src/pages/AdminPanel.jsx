import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    Users, Shield, AlertCircle, Settings, Trash2, 
    UserPlus, BarChart3, Search, Filter, MoreVertical,
    CheckCircle, XCircle, Zap, Globe, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPanel() {
    const [stats, setStats] = useState({ users: 0, quizzes: 0, attempts: 0 });
    const [users, setUsers] = useState([]);
    const [suspicious, setSuspicious] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [statsRes, usersRes, susRes] = await Promise.all([
                api.get('/attempt/system-stats'),
                api.get('/attempt/all-users'),
                api.get('/attempt/suspicious')
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setSuspicious(susRes.data);
        } catch (err) {
            console.error('Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        if (!window.confirm(`Change user role to ${newRole}?`)) return;
        try {
            await api.put(`/attempt/user/${userId}/role`, { role: newRole });
            fetchAdminData();
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure? This will permanently delete the user and all their records.')) return;
        try {
            await api.delete(`/attempt/user/${userId}`);
            fetchAdminData();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesFilter;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading Admin Console...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Hero Section */}
            <div className="relative p-10 rounded-3xl overflow-hidden bg-slate-900 border border-white/5 border-b-primary-500">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield size={120} className="text-primary-500" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 justify-center md:justify-start">
                            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                                <Shield size={24} className="text-white" />
                            </div>
                            Admin Console
                        </h1>
                        <p className="text-slate-400 font-medium">Manage users, monitor security, and control platform settings.</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Search Users" value={stats.users} icon={<Users />} color="primary" trend="+12% this week" />
                <StatCard label="Total Quizzes" value={stats.quizzes} icon={<Globe />} color="purple" trend="+4 today" />
                <StatCard label="Quiz Attempts" value={stats.attempts} icon={<Zap />} color="orange" trend="2.4k total" />
                <StatCard label="Security" value="100%" icon={<CheckCircle />} color="green" trend="System Secure" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass rounded-3xl overflow-hidden border-white/10">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-4">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <Users className="text-primary-400" /> User Management
                            </h2>
                            <div className="flex gap-2 w-full md:w-auto">
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    className="px-4 py-2 bg-slate-800 rounded-xl border border-white/10 text-sm outline-none"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <select 
                                    className="px-3 py-2 bg-slate-800 rounded-xl border border-white/10 text-sm outline-none"
                                    value={filterRole}
                                    onChange={e => setFilterRole(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Students</option>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admins</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs text-slate-500 uppercase font-bold tracking-wider bg-white/[0.01]">
                                    <tr>
                                        <th className="px-8 py-4">User</th>
                                        <th className="px-8 py-4">Role</th>
                                        <th className="px-8 py-4">Joined</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {filteredUsers.map((u, i) => (
                                         <tr key={i} className="hover:bg-white/[0.02] group transition-all">
                                             <td className="px-8 py-5">
                                                 <div className="flex items-center gap-4">
                                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-primary-500/20 text-primary-400'}`}>
                                                         {u.name.charAt(0)}
                                                     </div>
                                                     <div>
                                                         <p className="font-bold text-white group-hover:text-primary-400 transition-colors uppercase">{u.name}</p>
                                                         <p className="text-xs text-slate-500">{u.email}</p>
                                                     </div>
                                                 </div>
                                             </td>
                                             <td className="px-8 py-5">
                                                 <select 
                                                     value={u.role} 
                                                     onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                                     className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase border border-white/10 bg-slate-900 outline-none cursor-pointer hover:border-primary-500 transition-all ${
                                                         u.role === 'admin' ? 'text-red-400' : 
                                                         u.role === 'staff' ? 'text-blue-400' : 'text-slate-400'
                                                     }`}
                                                 >
                                                     <option value="user">User</option>
                                                     <option value="staff">Staff</option>
                                                     <option value="admin">Admin</option>
                                                 </select>
                                             </td>
                                             <td className="px-8 py-5">
                                                 <div className="flex items-center gap-2 mb-1">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                     <span className="text-xs font-bold text-slate-300">Active</span>
                                                 </div>
                                                 <p className="text-[10px] text-slate-500 font-mono tracking-widest">{new Date(u.created_at).toLocaleDateString()}</p>
                                             </td>
                                             <td className="px-8 py-5 text-right">
                                                 <div className="flex justify-end gap-2">
                                                     <button 
                                                         onClick={() => handleDeleteUser(u.id)}
                                                         disabled={u.email === 'admin@quizmaster.com'}
                                                         className="p-2.5 rounded-xl bg-white/5 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-0"
                                                     >
                                                         <Trash2 size={16} />
                                                     </button>
                                                 </div>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     </div>
                 </div>

                 {/* Sidebar */}
                 <div className="space-y-8">
                     <div className="glass rounded-[32px] p-8 border border-white/5 bg-red-500/5">
                         <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-red-400">
                             <Shield /> Security Alerts
                         </h3>
                         
                         <div className="space-y-4">
                             {suspicious.length === 0 ? (
                                 <div className="text-center py-8">
                                     <CheckCircle size={32} className="mx-auto text-green-500 opacity-20 mb-3" />
                                     <p className="text-xs font-bold uppercase text-slate-500">System Secure</p>
                                 </div>
                             ) : suspicious.map((s, i) => (
                                 <div key={i} className="bg-slate-900 p-4 rounded-2xl border border-red-500/10 flex flex-col gap-3">
                                     <div className="flex justify-between items-start">
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs uppercase">
                                                 {s.name.charAt(0)}
                                             </div>
                                             <div>
                                                 <p className="text-xs font-bold text-white">{s.name}</p>
                                                 <p className="text-[10px] text-slate-500 font-bold uppercase">Proctor Violation</p>
                                             </div>
                                         </div>
                                         <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold">{s.tab_switches}X</span>
                                     </div>
                                     <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                         <p className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">{s.title}</p>
                                         <button className="text-[10px] text-primary-400 font-bold hover:underline uppercase">Inspect</button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>

                     <div className="glass rounded-3xl p-8 border border-white/5 bg-primary-500/5">
                         <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                             <Zap className="text-yellow-400" /> Maintenance
                         </h3>
                         <div className="space-y-3">
                             <ActionButton label="Clear Sessions" desc="Log out inactive users" icon={<XCircle size={14}/>} />
                             <ActionButton label="Clean Storage" desc="Delete temp cache" icon={<Trash2 size={14}/>} />
                             <ActionButton label="Update Ranks" desc="Force global re-rank" icon={<BarChart3 size={14}/>} />
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
}

function StatCard({ label, value, icon, color, trend }) {
    const colors = {
        primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20'
    };

    return (
        <motion.div whileHover={{ y: -5 }} className={`glass p-6 rounded-[28px] border-2 ${colors[color]} relative group`}>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-all">
                    {icon}
                </div>
                <span className="text-[10px] font-black uppercase opacity-60">{trend}</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black whitespace-nowrap">{value}</p>
        </motion.div>
    );
}

function ActionButton({ label, desc, icon }) {
    return (
        <button className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-left flex items-start gap-3 group">
            <div className="p-2 bg-white/5 rounded-lg mt-1 group-hover:text-primary-400">
                {icon}
            </div>
            <div>
                <p className="text-xs font-black text-slate-300">{label}</p>
                <p className="text-[9px] text-slate-500 tracking-tight font-medium">{desc}</p>
            </div>
        </button>
    );
}
