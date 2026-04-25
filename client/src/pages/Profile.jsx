import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
    Trophy, Award, Target, Flame, ChevronRight, 
    Download, LayoutGrid, Clock, User as UserIcon, Shield, Zap, Database, MessageSquare, Mail, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

export default function Profile() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const certificateRef = useRef(null);
    const [selectedCert, setSelectedCert] = useState(null);
    const [activeTab, setActiveTab] = useState('history');

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const [statsRes, historyRes] = await Promise.all([
                api.get('/attempt/user-stats'),
                api.get('/attempt/user-history')
            ]);
            setStats(statsRes.data);
            setHistory(historyRes.data);
        } catch (err) {
            console.error("Profile Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const downloadCertificate = async () => {
        if (!certificateRef.current) return;
        const canvas = await html2canvas(certificateRef.current, { scale: 2 });
        const link = document.createElement('a');
        link.download = `Certificate_${selectedCert.quizTitle}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading Profile...</p>
        </div>
    );

    const safeStats = stats || { rank: 'N/A', xp: 0, attempts: 0, certificates: [] };
    const level = Math.floor((parseFloat(safeStats.xp) || 0) / 100) + 1;
    const progressToNextLevel = (parseFloat(safeStats.xp) || 0) % 100;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4">
            {/* Standard Profile Header */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl bg-slate-900 border border-white/5">
                <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                        <div className="relative w-36 h-36 rounded-3xl bg-slate-800 border-2 border-white/10 flex items-center justify-center text-5xl font-black text-white shadow-xl">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center font-black border-4 border-slate-900 shadow-lg text-white text-xs">
                            {level}
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <h1 className="text-4xl font-bold tracking-tight text-white">{user.name}</h1>
                                <span className="px-3 py-1 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20 text-[10px] font-bold uppercase tracking-widest">
                                    {user.role} Identity
                                </span>
                            </div>
                            <p className="text-slate-400 font-medium flex items-center gap-2 justify-center md:justify-start">
                                <Shield size={14} className="text-primary-500" /> Member since {new Date(user.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        
                        <div className="max-w-md mx-auto md:mx-0">
                            <div className="flex justify-between text-[10px] font-bold mb-2 text-slate-500 uppercase tracking-widest">
                                <span>Level {level} Progress</span>
                                <span>{progressToNextLevel}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressToNextLevel}%` }}
                                    className="h-full bg-primary-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <UserStatItem label="Global Rank" value={`#${safeStats.rank}`} icon={<Award size={20}/>} color="primary" />
                        <UserStatItem label="Total XP" value={safeStats.xp} icon={<Zap size={20}/>} color="yellow" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Secondary Stats Sidebar */}
                <div className="space-y-8 order-2 lg:order-1">
                    <div className="glass rounded-[32px] p-8 border-white/10 space-y-6 bg-white/[0.02]">
                        <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-tight text-white">
                            <Target className="text-primary-400" /> Platform Access
                        </h3>
                        <div className="space-y-3">
                            {(user.role === 'staff' || user.role === 'admin') && (
                                <QuickLink label="Staff Console" icon={<Database size={16}/>} href="/staff" color="primary" />
                            )}
                            {user.role === 'admin' && (
                                <QuickLink label="Admin Control" icon={<Shield size={16}/>} href="/admin" color="red" />
                            )}
                            <QuickLink label="My Dashboard" icon={<LayoutGrid size={16}/>} href="/dashboard" />
                        </div>
                    </div>

                    <div className="glass rounded-[32px] p-8 border-white/10 text-center bg-white/[0.02]">
                        <Trophy size={48} className="mx-auto text-yellow-500/20 mb-4" />
                        <h3 className="text-4xl font-black mb-1 text-white">{safeStats.attempts}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Quizzes Completed</p>
                    </div>
                </div>

                {/* Main Content Area: Tabs */}
                <div className="lg:col-span-3 space-y-8 order-1 lg:order-2">
                    <div className="flex gap-8 border-b border-white/5 pb-0">
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-white' : 'text-slate-500'}`}
                        >
                            Recent Activity
                            {activeTab === 'history' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-full" />}
                        </button>
                        <button 
                            onClick={() => setActiveTab('certs')}
                            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'certs' ? 'text-white' : 'text-slate-500'}`}
                        >
                            Certifications
                            {activeTab === 'certs' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-full" />}
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'history' ? (
                            <motion.div 
                                key="history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {history.length === 0 ? (
                                    <div className="col-span-full text-center py-20 bg-white/[0.02] rounded-[32px] border border-white/5 border-dashed">
                                        <Clock className="mx-auto text-slate-700 mb-4" size={48} />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No activity yet</p>
                                    </div>
                                ) : (
                                    history.map((h, i) => (
                                        <div key={i} className="glass p-6 rounded-[28px] border-white/5 hover:border-primary-500/30 transition-all flex items-center gap-5 group bg-white/[0.02]">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${h.score >= (h.total_questions * 0.5) ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {Math.round(h.score)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-lg truncate group-hover:text-primary-400 transition-colors uppercase text-white">{h.title}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{new Date(h.submitted_at).toLocaleDateString()} • {h.status}</p>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-700 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="certs"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {safeStats.certificates.length === 0 ? (
                                    <div className="col-span-full text-center py-20 bg-white/[0.02] rounded-[32px] border border-white/5 border-dashed">
                                        <Award className="mx-auto text-slate-700 mb-4" size={48} />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No certificates earned yet</p>
                                    </div>
                                ) : (
                                    safeStats.certificates.map((cert, i) => (
                                        <div key={i} className="bg-slate-900 border border-white/10 p-6 rounded-[32px] flex flex-col justify-between h-56 hover:border-primary-500 transition-all relative overflow-hidden group shadow-xl">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Award size={120} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                                                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Authenticated Certificate</p>
                                                </div>
                                                <h3 className="text-xl font-bold uppercase line-clamp-2 text-white leading-tight">{cert.quizTitle}</h3>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedCert(cert)}
                                                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-primary-600 hover:border-primary-600 transition-all flex items-center justify-center gap-3 group/btn"
                                            >
                                                <Download size={18} className="group-hover/btn:-translate-y-0.5 transition-transform" /> VIEW & DOWNLOAD
                                            </button>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Certificate Modal Overlay */}
            <AnimatePresence>
                {selectedCert && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 md:p-10"
                    >
                        <div className="max-w-4xl w-full flex flex-col gap-6">
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
                                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
                                    <Award className="text-yellow-400" /> Digital Credentials
                                </h2>
                                <button onClick={() => setSelectedCert(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white">
                                    <ChevronRight className="rotate-90" />
                                </button>
                            </div>

                            <div className="bg-white p-1 rounded-[40px] overflow-hidden shadow-2xl relative">
                                <div ref={certificateRef} className="bg-white text-slate-900 p-12 md:p-20 border-[24px] border-double border-slate-200 text-center relative overflow-hidden h-[600px] flex flex-col justify-between">
                                    {/* Subtle patterns */}
                                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                                        <Trophy size={600} className="absolute -top-40 -left-40" />
                                        <Award size={600} className="absolute -bottom-40 -right-40" />
                                    </div>
                                    
                                    <div className="relative z-10">
                                        <Trophy size={48} className="mx-auto text-yellow-600 mb-6" />
                                        <h1 className="text-6xl font-serif mb-2 text-slate-900">Certificate</h1>
                                        <h2 className="text-lg font-sans uppercase tracking-[0.4em] text-slate-400 font-bold mb-10">Of Achievement</h2>
                                        <div className="w-24 h-1 bg-yellow-600/30 mx-auto mb-10"></div>
                                        <p className="text-2xl font-serif text-slate-600 mb-6 italic">This is to certify that</p>
                                        <p className="text-5xl font-black mb-10 border-b-4 border-slate-900/5 inline-block px-12 pb-4 uppercase tracking-tighter text-slate-900">{selectedCert.user_name}</p>
                                        <p className="text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
                                            has successfully demonstrated excellence in the <br/><span className="font-black text-slate-900 uppercase">"{selectedCert.quizTitle}"</span> <br/>
                                            assessment with an outstanding score of <strong>{Math.round(selectedCert.score)} XP</strong>.
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-end px-4 relative z-10">
                                        <div className="text-left">
                                            <p className="font-mono text-[10px] text-slate-400 uppercase font-black mb-2">Issue Date</p>
                                            <p className="font-black border-t-2 border-slate-900/10 pt-2 text-slate-900">{new Date(selectedCert.submitted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-yellow-600/10 rounded-full flex items-center justify-center border-2 border-yellow-600/20 mb-2">
                                                <Zap className="text-yellow-600" fill="currentColor" />
                                            </div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verified Badge</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-[10px] text-slate-400 uppercase font-black mb-2">Issuing Authority</p>
                                            <p className="font-black border-t-2 border-slate-900/10 pt-2 text-slate-900">NexQuiz Pro Platform</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={downloadCertificate}
                                className="w-full py-5 rounded-[24px] bg-primary-600 text-white text-xl font-black shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:bg-primary-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-4"
                            >
                                <Download size={24} /> DOWNLOAD HIGH-RES IMAGE
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function UserStatItem({ label, value, icon, color }) {
    const colors = {
        primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]',
        yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
    };
    return (
        <div className={`p-6 rounded-[32px] border bg-slate-800/40 min-w-[150px] text-center backdrop-blur-xl transition-transform hover:scale-105 ${colors[color]}`}>
            <div className="flex justify-center mb-3">
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
        </div>
    );
}

function QuickLink({ label, icon, href, color = 'white' }) {
    const activeColor = color === 'red' ? 'hover:bg-red-500/10 hover:text-red-400' : 'hover:bg-primary-500/10 hover:text-primary-400';
    return (
        <button 
            onClick={() => window.location.href = href}
            className={`w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-all group ${activeColor}`}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl group-hover:rotate-12 transition-transform text-white group-hover:text-inherit">
                    {icon}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-inherit">{label}</span>
            </div>
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
        </button>
    );
}
