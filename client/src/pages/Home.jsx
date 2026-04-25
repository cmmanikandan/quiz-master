import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Search, ArrowRight, Trash2, Hash, Sparkles, Code, BrainCircuit, Zap, BookOpen, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
    { name: 'All', icon: <Sparkles size={16} /> },
    { name: 'Coding', icon: <Code size={16} /> },
    { name: 'General', icon: <BrainCircuit size={16} /> },
    { name: 'Science', icon: <Zap size={16} /> },
    { name: 'History', icon: <BookOpen size={16} /> },
    { name: 'Language', icon: <Globe size={16} /> }
];

export default function Home() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [joinCode, setJoinCode] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchQuizzes();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search, activeCategory]);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/quiz/public?category=${activeCategory}&search=${search}`);
            if (Array.isArray(res.data)) {
                setQuizzes(res.data);
            } else {
                setQuizzes([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (joinCode.trim()) {
            navigate(`/quiz/${joinCode.trim().toUpperCase()}`);
        }
    };

    const deleteQuiz = async (id) => {
        if (!window.confirm('Delete this assessment?')) return;
        try {
            await api.delete(`/quiz/${id}/admin`);
            fetchQuizzes();
        } catch (err) {
            alert('Action failed');
        }
    };

    return (
        <div className="space-y-12">
            {/* Standard Hero Section */}
            <section className="bg-[#0f172a] rounded-[24px] py-20 px-6 text-center shadow-lg mx-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <span className="bg-primary-500/10 text-primary-400 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary-500/20">
                        Modern Assessment Platform
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold text-white">
                        Learn, Test, and <br /> Grow Your Skills.
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Join our community of learners to take live quizzes, earn verified certificates, and track your progress globally.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                        {!user ? (
                            <>
                                <button onClick={() => navigate('/register')} className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-3 rounded-lg font-bold transition-all shadow-md">
                                    Get Started
                                </button>
                                <button onClick={() => navigate('/login')} className="bg-white/5 hover:bg-white/10 text-white px-10 py-3 rounded-lg font-bold border border-white/10 transition-all">
                                    Sign In
                                </button>
                            </>
                        ) : (
                            <form onSubmit={handleJoin} className="flex bg-white/5 border border-white/10 p-1.5 rounded-xl focus-within:border-primary-500 transition-all max-w-md w-full">
                                <input
                                    type="text"
                                    placeholder="Enter Access Code..."
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-white font-bold px-4 flex-1 placeholder:text-slate-600"
                                />
                                <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-lg font-bold uppercase text-xs transition-all">
                                    Join Quiz
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Filter Hub */}
            <div className="max-w-7xl mx-auto px-6 space-y-8">
                <div className="bg-[#1e293b]/50 p-2 rounded-2xl border border-white/5 flex flex-wrap gap-2 items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search quizzes, topics, or creators..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-white focus:ring-0 placeholder:text-slate-600"
                        />
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>
                    <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCategory === cat.name ? 'bg-primary-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <TrendingUp className="text-primary-400" size={24} /> Trending Assessments
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white/5 rounded-2xl animate-pulse"></div>)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {Array.isArray(quizzes) && quizzes.map((quiz) => (
                                    <motion.div
                                        key={quiz.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group bg-[#1e293b] rounded-2xl overflow-hidden border border-white/5 hover:border-primary-500/30 transition-all flex flex-col shadow-lg"
                                    >
                                        <div className="relative h-44 bg-slate-800">
                                            <img
                                                src={quiz.thumbnail_url || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop`}
                                                alt={quiz.title}
                                                className="w-full h-full object-cover opacity-60"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                                    {quiz.category || 'General'}
                                                </span>
                                            </div>
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => deleteQuiz(quiz.id)}
                                                    className="absolute top-4 right-4 p-2 bg-red-600/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1e293b] to-transparent">
                                                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1 italic">By {quiz.creator || 'Verified Staff'}</p>
                                                <h3 className="text-xl font-bold text-white line-clamp-1">{quiz.title}</h3>
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col flex-1">
                                            <p className="text-slate-400 text-sm line-clamp-2 h-10 mb-6 font-medium">
                                                {quiz.description || "Unlock high-level insights with this verified assessment."}
                                            </p>

                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Enrollment</p>
                                                    <p className="text-white font-bold text-sm uppercase">Free Access</p>
                                                </div>
                                                <Link
                                                    to={`/quiz/${quiz.code}`}
                                                    className="w-10 h-10 bg-white/5 hover:bg-primary-600 text-primary-400 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-md group-hover:translate-x-1"
                                                >
                                                    <ArrowRight size={20} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Footer */}
            <footer className="mt-20 border-t border-white/5 bg-[#0f172a]/50 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        {/* Brand Col */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-primary-600 p-2 rounded-xl text-white shadow-lg shadow-primary-500/20">
                                    <BrainCircuit size={24} />
                                </div>
                                <span className="text-xl font-bold text-white tracking-tight">NexQuiz</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
                                The ultimate modern assessment platform. Build, deploy, and analyze professional quizzes with real-time proctoring and analytics.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="p-2 bg-white/5 text-slate-400 hover:text-primary-400 hover:bg-white/10 rounded-xl transition-all">
                                    <Globe size={18} />
                                </a>
                                <a href="https://github.com/cmmanikandan" target="_blank" rel="noreferrer" className="p-2 bg-white/5 text-slate-400 hover:text-primary-400 hover:bg-white/10 rounded-xl transition-all">
                                    <Code size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Links Col 1 */}
                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Platform</h4>
                            <ul className="space-y-4">
                                <li><Link to="/register" className="text-slate-400 hover:text-primary-400 text-sm font-medium transition-colors">Create Account</Link></li>
                                <li><Link to="/login" className="text-slate-400 hover:text-primary-400 text-sm font-medium transition-colors">Sign In</Link></li>
                                <li><a href="#" className="text-slate-400 hover:text-primary-400 text-sm font-medium transition-colors">Explore Quizzes</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-primary-400 text-sm font-medium transition-colors">Leaderboards</a></li>
                            </ul>
                        </div>

                        {/* Links Col 2 */}
                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Legal &amp; Support</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-slate-400 hover:text-primary-400 text-sm font-medium transition-colors">Help Center</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-primary-400 text-sm font-medium transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-primary-400 text-sm font-medium transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-primary-400 text-sm font-medium transition-colors">Contact Dept</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} NexQuiz System. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">Built for Education</span>
                            <span className="text-primary-900 text-xs font-black uppercase tracking-widest bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">v1.0.0</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function TrendingUp(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}
