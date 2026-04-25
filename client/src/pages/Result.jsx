import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Trophy, Clock, CheckCircle, XCircle, ChevronDown, ListFilter } from 'lucide-react';
import { motion } from 'framer-motion';
import Certificate from '../components/Certificate';
import { useAuth } from '../context/AuthContext';

export default function Result() {
    const { id } = useParams();
    const { user } = useAuth();
    const [result, setResult] = useState(null);
    const [filter, setFilter] = useState('all');
    const [expandedReview, setExpandedReview] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

    useEffect(() => {
        fetchResult();
    }, [id]);

    const fetchResult = async () => {
        try {
            const res = await api.get(`/attempt/result/${id}`);
            setResult(res.data);
            fetchLeaderboard(res.data.attempt.quiz_id);
        } catch (err) {
            console.error('Error fetching result');
        }
    };

    const fetchLeaderboard = async (quizId) => {
        try {
            const res = await api.get(`/attempt/leaderboard/${quizId}`);
            setLeaderboard(res.data);
        } catch (err) {
            console.error('Leaderboard error');
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    if (!result) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse font-mono">Calculating Performance...</p>
        </div>
    );

    const { attempt, answers } = result;
    const filteredAnswers = answers.filter(a => {
        if (filter === 'correct') return a.is_correct;
        if (filter === 'wrong') return !a.is_correct;
        return true;
    });

    const score = parseFloat(attempt.score) || 0;
    const correctCount = answers.filter(a => a.is_correct).length;
    const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
    const isPass = accuracy >= (attempt.pass_percentage || 50);

    return (
        <div className="max-w-4xl mx-auto space-y-8 px-2 md:px-0 pb-10">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-6 md:p-12 rounded-[32px] text-center relative overflow-hidden">
                {isPass && (
                    <div className="absolute top-4 left-4 flex flex-col items-center gap-1">
                        <Trophy className="text-yellow-400" size={32} />
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Certified</span>
                    </div>
                )}
                <div className="inline-block p-4 bg-yellow-500/20 text-yellow-500 rounded-full mb-6">
                    <Trophy size={48} className="md:w-16 md:h-16" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter uppercase">Quiz Completed!</h1>
                <p className="text-base md:text-xl text-slate-400 mb-8 font-medium italic">"{attempt.title}"</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<CheckCircle className="text-green-400" />} label="Final Score" value={`${score.toFixed(1)} / ${answers.length}`} />
                    <StatCard icon={<Clock className="text-blue-400" />} label="Time Spent" value={`${attempt.time_taken || 0}s`} />
                    <StatCard icon={<ListFilter className="text-purple-400" />} label="Correct" value={`${correctCount}`} />
                    <StatCard icon={<Trophy className="text-yellow-400" />} label="Accuracy" value={`${accuracy}%`} />
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                        <div className="p-4">
                            <p className="text-slate-500 font-bold uppercase text-[10px] mb-1">Started At</p>
                            <p className="font-mono">{new Date(attempt.started_at).toLocaleTimeString()}</p>
                        </div>
                        <div className="p-4">
                            <p className="text-slate-500 font-bold uppercase text-[10px] mb-1">Finished At</p>
                            <p className="font-mono">{new Date(attempt.submitted_at).toLocaleTimeString()}</p>
                        </div>
                        <div className="p-4">
                            <p className="text-slate-500 font-bold uppercase text-[10px] mb-1">Duration</p>
                            <p className="font-mono">{Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center">
                    <Link to="/dashboard" className="btn-primary py-4 px-8 text-sm md:text-base font-black">Back to Dashboard</Link>
                    {isPass && (
                        <button onClick={() => setShowCertificate(!showCertificate)} className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 py-4 px-8 rounded-xl font-black flex items-center justify-center gap-2 transition-all text-sm md:text-base">
                            <Trophy size={18} /> {showCertificate ? 'CERTIFICATE ON' : 'CLAIM CERTIFICATE'}
                        </button>
                    )}
                    <button onClick={() => setExpandedReview(!expandedReview)} className="bg-white/10 hover:bg-white/20 py-4 px-8 rounded-xl flex items-center justify-center gap-2 text-sm md:text-base font-black">
                        {expandedReview ? 'HIDE REVIEW' : 'REVIEW SESSION'} <ChevronDown size={18} className={`transition-transform ${expandedReview ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </motion.div>

            {showCertificate && isPass && (
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="py-10">
                    <Certificate
                        userName={result.userName || "Student"}
                        quizTitle={attempt.title}
                        score={accuracy}
                        date={attempt.submitted_at}
                        passPercentage={attempt.pass_percentage || 50}
                    />
                </motion.div>
            )}

            {expandedReview && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Detailed Review</h2>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                            {['all', 'correct', 'wrong'].map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg capitalize transition-all text-[10px] font-black tracking-widest ${filter === f ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredAnswers.map((ans, i) => (
                        <div key={ans.id} className={`glass p-6 rounded-2xl border-l-8 ${ans.is_correct ? 'border-l-green-500' : 'border-l-red-500'}`}>
                            <div className="flex justify-between mb-4">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {i + 1}</span>
                                {ans.is_correct ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                            </div>
                            <h3 className="text-xl font-medium mb-6">{ans.question}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                {['a', 'b', 'c', 'd'].map(opt => {
                                    const isUserChoice = ans.selected_option === opt;
                                    const isCorrect = ans.correct_option === opt;
                                    if (!ans[`option_${opt}`] && ans.type === 'tf' && (opt === 'c' || opt === 'd')) return null;

                                    return (
                                        <div key={opt} className={`p-4 rounded-xl border flex items-center gap-3 text-sm md:text-base font-medium ${isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                            isUserChoice ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                'bg-white/5 border-white/5 text-slate-300'
                                            }`}>
                                            <span className="font-black uppercase opacity-40">{opt}.</span>
                                            {ans.type === 'tf' ? (opt === 'a' ? 'TRUE' : 'FALSE') : ans[`option_${opt}`]}
                                            {isCorrect && <CheckCircle size={16} className="ml-auto flex-shrink-0" />}
                                            {isUserChoice && !isCorrect && <XCircle size={16} className="ml-auto flex-shrink-0" />}
                                        </div>
                                    );
                                })}
                            </div>

                            {attempt.show_explanation && ans.explanation && (
                                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                                    <p className="text-sm font-bold text-blue-400 mb-1">Explanation:</p>
                                    <p className="text-slate-300">{ans.explanation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Leaderboard Section */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass p-8 md:p-10 rounded-[32px] border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] -z-10"></div>
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20">
                        <Trophy size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Leaderboard</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Global Top 10 Performances</p>
                    </div>
                </div>

                {loadingLeaderboard ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black italic">
                                    <th className="pb-6 pl-4">Rank</th>
                                    <th className="pb-6">Competitor</th>
                                    <th className="pb-6">Score</th>
                                    <th className="pb-6">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {leaderboard.map((entry, index) => (
                                    <tr key={index} className={`group hover:bg-white/[0.02] transition-all ${entry.name === user.name ? 'bg-primary-500/10' : ''}`}>
                                        <td className="py-5 pl-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-500 text-slate-950 scale-110 shadow-[0_0_20px_rgba(234,179,8,0.3)]' :
                                                    index === 1 ? 'bg-slate-300 text-slate-950' :
                                                        index === 2 ? 'bg-orange-500 text-slate-950' :
                                                            'bg-white/5 text-slate-400'
                                                }`}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-black uppercase">
                                                    {entry.name.substring(0, 2)}
                                                </div>
                                                <span className={`font-bold ${entry.name === user.name ? 'text-primary-400' : 'text-slate-200'}`}>
                                                    {entry.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-1">
                                                <span className="font-black text-white">{entry.score.toFixed(1)}</span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase italic">XP</span>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-2 text-slate-400 text-sm font-mono">
                                                <Clock size={14} className="opacity-40" />
                                                {entry.time_taken}s
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-10 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">Awaiting first session finalization...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 border border-white/5">
            <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
            <div className="text-left">
                <p className="text-xs text-slate-500 font-bold uppercase">{label}</p>
                <p className="text-xl font-bold">{value}</p>
            </div>
        </div>
    );
}
