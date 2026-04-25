import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import {
    Users, Trophy, Clock, AlertTriangle, FileText,
    Download, PieChart, TrendingUp, CheckCircle, XCircle, Search, Zap, ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import socket from '../utils/socket';

export default function StaffReport() {
    const { id } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [liveUsers, setLiveUsers] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        avgScore: 0,
        passRate: 0,
        totalAttempts: 0,
        avgTime: 0
    });

    useEffect(() => {
        fetchData();
        socket.emit('join_proctor', id);
        socket.on('user_status_update', (data) => {
            setLiveUsers(prev => ({ ...prev, [data.userId]: data }));
        });
        return () => {
            socket.off('user_status_update');
        };
    }, [id]);

    const handleStartQuiz = async () => {
        try {
            await api.post(`/quiz/${id}/start-live`);
            socket.emit('start_quiz', { quizId: id, quizCode: quiz.code });
            setQuiz({ ...quiz, is_live: true });
        } catch (err) {
            alert("Failed to start quiz");
        }
    };

    const handleUnblock = async (attemptId) => {
        try {
            await api.post(`/quiz/unblock/${attemptId}`);
            fetchData();
        } catch (err) {
            alert("Failed to unblock");
        }
    };

    const fetchData = async () => {
        try {
            const quizRes = await api.get(`/quiz/${id}/edit-details`);
            const attemptsRes = await api.get(`/quiz/${id}/attempts`);
            setQuiz(quizRes.data.quiz);
            if (Array.isArray(attemptsRes.data)) {
                setAttempts(attemptsRes.data);
                calculateStats(attemptsRes.data, quizRes.data.quiz);
            } else {
                setAttempts([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const calculateStats = (data, q) => {
        if (data.length === 0) {
            setStats({ avgScore: 0, passRate: 0, totalAttempts: 0, avgTime: 0 });
            return;
        }
        const total = data.length;
        const sum = data.reduce((a, b) => a + parseFloat(b.score), 0);
        const avg = sum / total;
        const passCount = data.filter(a => (a.score / (q.total_questions || 10) * 100) >= (q.pass_percentage || 50)).length;

        setStats({
            avgScore: avg.toFixed(1),
            passRate: Math.round((passCount / total) * 100),
            totalAttempts: total,
            avgTime: Math.round(data.reduce((a, b) => a + b.time_taken, 0) / total)
        });
    };

    const handleExport = async () => {
        const res = await api.get(`/attempt/export/${id}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_quiz_${id}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    if (!quiz) return <div className="p-20 text-center font-bold text-slate-500">Loading Proctor Hub...</div>;

    const filteredAttempts = attempts.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4">
            {/* Standard Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">{quiz.title}</h1>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${quiz.quiz_type === 'live' ? 'bg-primary-500 text-white' : 'bg-green-600 text-white'}`}>
                            {quiz.quiz_type}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                        <Shield size={12} /> Proctoring Session Active
                    </div>
                </div>

                <div className="flex gap-3">
                    {quiz.quiz_type === 'live' && !quiz.is_live && (
                        <button onClick={handleStartQuiz} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <Zap size={14} fill="currentColor" /> Start Quiz
                        </button>
                    )}
                    <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                        <Download size={14} /> Export CSV
                    </button>
                    <Link to="/staff" className="bg-white/5 hover:bg-white/10 text-slate-400 px-6 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2">
                        <ChevronLeft size={14} /> Back
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Users size={20} />} label="Participants" value={stats.totalAttempts} color="primary" />
                <StatCard icon={<TrendingUp size={20} />} label="Avg. Score" value={stats.avgScore} color="yellow" />
                <StatCard icon={<PieChart size={20} />} label="Pass Rate" value={`${stats.passRate}%`} color="green" />
                <StatCard icon={<Clock size={20} />} label="Avg. Time" value={`${Math.floor(stats.avgTime / 60)}m`} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Live Feed */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-6 shadow-lg h-full">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            Live Feed
                        </h2>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.values(liveUsers).length === 0 ? (
                                <div className="text-center py-20 bg-black/10 rounded-xl border border-dashed border-white/5">
                                    <p className="text-slate-600 text-xs font-bold uppercase tracking-tight">No Active Students</p>
                                </div>
                            ) : (
                                Object.values(liveUsers).map(u => (
                                    <div key={u.userId} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-bold text-white">{u.userName}</span>
                                            <span className={u.tabSwitches > 0 ? 'text-red-500 font-bold text-[10px]' : 'text-primary-400 font-bold text-[10px]'}>
                                                {u.tabSwitches} Warning{u.tabSwitches !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-600 transition-all duration-300"
                                                style={{ width: `${(u.progress / (quiz.total_questions || 10)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-6 shadow-lg">
                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={16} /> Assessment History
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Find student..."
                                    className="bg-black/20 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-xs w-full md:w-64 focus:outline-none focus:border-primary-500 transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Score</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Violations</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredAttempts.map((a, i) => {
                                        const isPass = (a.score / (quiz.total_questions || 10) * 100) >= (quiz.pass_percentage || 50);
                                        return (
                                            <tr key={i} className="hover:bg-white/5 transition-all">
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-bold text-white">{a.name}</p>
                                                    <p className="text-[10px] text-slate-600 uppercase">{new Date(a.submitted_at).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-4 py-4 font-mono text-sm">{parseFloat(a.score).toFixed(1)}</td>
                                                <td className="px-4 py-4">
                                                    {a.status === 'blocked' ? (
                                                        <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-[10px] font-bold border border-red-500/20">BLOCKED</span>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${isPass ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                            {isPass ? 'PASSED' : 'FAILED'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`text-[10px] font-bold ${a.tab_switches > 2 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                                        {a.tab_switches} TAB SWITCHES
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {a.status === 'blocked' && (
                                                        <button
                                                            onClick={() => handleUnblock(a.id)}
                                                            className="text-primary-500 hover:text-white hover:bg-primary-600 px-3 py-1 rounded-md text-[10px] font-bold border border-primary-500/30 transition-all uppercase"
                                                        >
                                                            Unblock User
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    const colors = {
        primary: 'text-primary-400',
        green: 'text-green-500',
        yellow: 'text-yellow-500',
        blue: 'text-blue-500'
    };

    return (
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-lg flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-all">
            <div className={`p-3 bg-black/20 rounded-xl ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
}

function Shield(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>;
}
