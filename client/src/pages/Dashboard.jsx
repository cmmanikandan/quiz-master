import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Play, History, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ xp: 0, attempts: 0, rank: '-' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, historyRes] = await Promise.all([
                    api.get('/attempt/user-stats'),
                    api.get('/attempt/user-history')
                ]);
                setStats(statsRes.data);
                setHistory(historyRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name}!</h1>
                    <p className="text-slate-400">What would you like to learn today?</p>
                </div>
                <Link to="/" className="btn-primary flex items-center justify-center gap-2 py-4 px-8 text-lg font-bold">
                    <Play size={20} fill="currentColor" /> Take a Quiz
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardStat icon={<Award className="text-yellow-500" />} label="Global Rank" value={`#${stats.rank}`} color="yellow" />
                <DashboardStat icon={<TrendingUp className="text-green-500" />} label="Quizzes Completed" value={stats.attempts} color="green" />
                <DashboardStat icon={<History className="text-blue-500" />} label="Total Points" value={stats.xp} color="blue" />
            </div>

            <div className="glass rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <History className="text-primary-400" /> Recent Activity
                </h2>
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No recent activity found. Join a quiz to get started!</p>
                    ) : (
                        history.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-400 font-bold uppercase">
                                        {item.title.substring(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{item.title}</h3>
                                        <p className="text-xs text-slate-500">
                                            {new Date(item.submitted_at).toLocaleDateString()} at {new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-primary-400">{item.score}</p>
                                        <p className="text-xs text-slate-500">Score</p>
                                    </div>
                                    <Link to={`/result/${item.id}`} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                        <TrendingUp size={20} />
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function DashboardStat({ icon, label, value, color }) {
    return (
        <motion.div whileHover={{ y: -5 }} className="glass p-6 rounded-2xl border-b-4 border-b-primary-500">
            <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 bg-white/5 rounded-xl`}>{icon}</div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-3xl font-bold">{value}</div>
        </motion.div>
    );
}
