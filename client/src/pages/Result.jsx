import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Trophy, Clock, CheckCircle, XCircle, ChevronDown, ListFilter } from 'lucide-react';
import { motion } from 'framer-motion';
import Certificate from '../components/Certificate';

export default function Result() {
    const { id } = useParams();
    const [result, setResult] = useState(null);
    const [filter, setFilter] = useState('all'); // all, correct, wrong
    const [expandedReview, setExpandedReview] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);

    useEffect(() => {
        fetchResult();
    }, []);

    const fetchResult = async () => {
        try {
            const res = await api.get(`/attempt/result/${id}`);
            setResult(res.data);
        } catch (err) {
            alert('Error fetching result');
        }
    };

    if (!result) return <div className="text-center mt-20">Loading Results...</div>;

    const { attempt, answers } = result;
    const filteredAnswers = answers.filter(a => {
        if (filter === 'correct') return a.is_correct;
        if (filter === 'wrong') return !a.is_correct;
        return true;
    });

    const accuracy = Math.round((attempt.score / answers.length) * 100);
    const isPass = accuracy >= (attempt.pass_percentage || 50);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-12 rounded-3xl text-center relative overflow-hidden">
                {isPass && (
                    <div className="absolute top-4 left-4 flex flex-col items-center gap-1">
                        <Trophy className="text-yellow-400" size={32} />
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Certified</span>
                    </div>
                )}
                <div className="inline-block p-4 bg-yellow-500/20 text-yellow-500 rounded-full mb-6">
                    <Trophy size={64} />
                </div>
                <h1 className="text-5xl font-bold mb-2">Quiz Completed!</h1>
                <p className="text-xl text-slate-400 mb-8">{attempt.title}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<CheckCircle className="text-green-400" />} label="Final Score" value={`${attempt.score.toFixed(1)} / ${answers.length}`} />
                    <StatCard icon={<Clock className="text-blue-400" />} label="Time Spent" value={`${attempt.time_taken}s`} />
                    <StatCard icon={<ListFilter className="text-purple-400" />} label="Correct" value={`${answers.filter(a => a.is_correct).length}`} />
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
                    <Link to="/dashboard" className="btn-primary py-3 px-8 text-base">Back to Dashboard</Link>
                    {isPass && (
                        <button onClick={() => setShowCertificate(!showCertificate)} className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 py-3 px-8 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                            <Trophy size={20} /> {showCertificate ? 'Hide Certificate' : 'Claim Certificate'}
                        </button>
                    )}
                    <button onClick={() => setExpandedReview(!expandedReview)} className="bg-white/10 hover:bg-white/20 py-3 px-8 rounded-xl flex items-center justify-center gap-2 text-base">
                        {expandedReview ? 'Hide Review' : 'Review Answers'} <ChevronDown className={`transition-transform ${expandedReview ? 'rotate-180' : ''}`} />
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
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Detailed Review</h2>
                        <div className="flex bg-white/5 p-1 rounded-lg">
                            {['all', 'correct', 'wrong'].map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1 rounded-md capitalize transition-all ${filter === f ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                                    {f}
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
                                    return (
                                        <div key={opt} className={`p-4 rounded-lg border flex items-center gap-3 ${isCorrect ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                                                isUserChoice ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                                                    'bg-white/5 border-white/5'
                                            }`}>
                                            <span className="font-bold uppercase">{opt}.</span> {ans[`option_${opt}`]}
                                            {isCorrect && <CheckCircle size={16} className="ml-auto" />}
                                            {isUserChoice && !isCorrect && <XCircle size={16} className="ml-auto" />}
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
