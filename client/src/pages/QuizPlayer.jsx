import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, ChevronLeft, Send, AlertTriangle, Users, Zap, RefreshCw } from 'lucide-react';
import socket from '../utils/socket';
import { useAuth } from '../context/AuthContext';

export default function QuizPlayer() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState([]); 
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [warnings, setWarnings] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [isLiveReady, setIsLiveReady] = useState(false);
    const [hasSubmittedDetails, setHasSubmittedDetails] = useState(false);
    const [studentForm, setStudentForm] = useState({ name: '', regNo: '', dept: '', year: '' });
    const [attemptId, setAttemptId] = useState(null);

    const timerRef = useRef(null);

    const syncStatus = async () => {
        try {
            const res = await api.get(`/attempt/status/${code}`);
            if (res.data.hasActive) {
                if (res.data.status === 'blocked') {
                    setIsBlocked(true);
                } else if (res.data.status === 'ongoing') {
                    // Resume logic
                    setAttemptId(res.data.attempt.id);
                    setWarnings(res.data.attempt.tab_switches || 0);
                    setStartTime(res.data.attempt.started_at);
                    if (res.data.attempt.responses) {
                        try {
                            setAnswers(JSON.parse(res.data.attempt.responses));
                        } catch(e) {}
                    }
                }
            }
        } catch (err) {
            console.error("Status Check Error:", err);
        }
    };

    const handleBlockUser = async () => {
        if (isBlocked) return;
        setIsBlocked(true);
        try {
            await api.post(`/quiz/block-my-attempt/${code}`); 
        } catch (err) {
            console.error("Block sync failed");
        }
    };

    useEffect(() => {
        const initialize = async () => {
            await fetchQuiz();
            await syncStatus();
            setLoading(false);
        };
        initialize();
        socket.connect();

        const handleVisibilityChange = () => {
            if (document.hidden && isLiveReady && !loading && !isBlocked) {
                handleBlockUser();
            }
        };

        const handleBlur = () => {
            if (isLiveReady && !loading && !isBlocked) {
                handleBlockUser();
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isLiveReady && !loading && !isBlocked) {
                handleBlockUser();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("blur", handleBlur);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [isLiveReady, loading, isBlocked]);

    const [shuffledOptions, setShuffledOptions] = useState({});

    const fetchQuiz = async () => {
        try {
            const res = await api.get(`/quiz/join/${code.trim()}`);
            let qData = res.data.questions;
            const quizData = res.data.quiz;

            if (quizData.shuffle_questions) {
                qData = [...qData].sort(() => Math.random() - 0.5);
            }

            if (quizData.shuffle_options) {
                const newShuffles = {};
                qData.forEach(q => {
                    if (q.type === 'mcq') {
                        newShuffles[q.id] = ['a', 'b', 'c', 'd'].sort(() => Math.random() - 0.5);
                    } else if (q.type === 'tf') {
                        newShuffles[q.id] = ['a', 'b'];
                    }
                });
                setShuffledOptions(newShuffles);
            }

            setQuiz(quizData);
            setQuestions(qData);
            setStartTime(prev => prev || new Date().toISOString());
            if (quizData.timer > 0) setTimeLeft(quizData.timer);
        } catch (err) {
            console.error('Join Error:', err.response?.data || err.message);
            alert(`Error: ${err.response?.data?.message || 'Quiz not found'}`);
            navigate('/');
        }
    };

    useEffect(() => {
        if (timeLeft === 0) handleSubmit(true);
        if (timeLeft && !timerRef.current) {
            timerRef.current = setInterval(() => {
                setTimeLeft(t => Math.max(0, t - 1));
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, [timeLeft]);

    useEffect(() => {
        if (quiz && !loading && isLiveReady) {
            socket.emit('student_update', {
                quizId: quiz.id,
                userId: user.id,
                userName: user.name,
                progress: currentIdx + 1,
                tabSwitches: warnings
            });
        }
    }, [currentIdx, warnings, quiz, loading, isLiveReady]);

    const handleSelect = (option) => {
        const newAnswers = [...answers];
        const existingIdx = newAnswers.findIndex(a => a.question_id === questions[currentIdx].id);
        if (existingIdx > -1) {
            newAnswers[existingIdx].selected_option = option;
        } else {
            newAnswers.push({ question_id: questions[currentIdx].id, selected_option: option });
        }
        setAnswers(newAnswers);
        syncProgress(newAnswers);
    };

    const syncProgress = async (currentAnswers) => {
        try {
            await api.post(`/attempt/save-progress/${code}`, {
                answers: currentAnswers,
                tab_switches: warnings
            });
        } catch (err) {
            console.error("Progress Sync Failed");
        }
    };

    const handleSubmit = async (isAuto = false) => {
        if (isBlocked) return;
        if (!isAuto) {
            if (!window.confirm("CONFIRM SUBMISSION: Are you sure you want to finalize your assessment?")) return;
        }

        try {
            const finishTime = new Date().toISOString();
            const duration = Math.floor((new Date(finishTime) - new Date(startTime)) / 1000);

            const res = await api.post('/attempt/submit', {
                quiz_id: quiz.id,
                answers,
                time_taken: duration,
                tab_switches: warnings,
                started_at: startTime,
                finished_at: finishTime,
                student_details: studentForm
            });

            socket.emit('new_submission', {
                quizCode: code,
                userName: res.data.user_name || user.name,
                score: res.data.score
            });

            if (document.fullscreenElement) {
                try { await document.exitFullscreen(); } catch(e) {}
            }
            
            navigate(`/result/${res.data.attempt_id || res.data.attemptId || attemptId}`);
        } catch (err) {
            console.error("Submission Error:", err);
            alert('CRITICAL: Submission failed. We are attempting to cache your answers. Do not close this tab.');
        }
    };

    useEffect(() => {
        const checkAccess = () => {
            if (!quiz) return;
            if (quiz.quiz_type === 'live') {
                setIsLiveReady(!!quiz.is_live);
                socket.on('quiz_started', () => {
                    setQuiz(prev => ({ ...prev, is_live: true }));
                    setIsLiveReady(true);
                });
            } else if (quiz.quiz_type === 'scheduled') {
                const now = new Date();
                const start = new Date(quiz.scheduled_start);
                const end = new Date(quiz.scheduled_end);
                setIsLiveReady(now >= start && now <= end);
            } else {
                setIsLiveReady(true); 
            }
        };

        checkAccess();
        const interval = setInterval(checkAccess, 10000); 
        return () => {
            socket.off('quiz_started');
            clearInterval(interval);
        };
    }, [quiz]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse font-mono">Syncing Session...</p>
        </div>
    );

    if (isBlocked) {
        return (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[999] flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-12 rounded-[40px] max-w-lg text-center border-red-500/50 border-2 shadow-2xl">
                    <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <AlertTriangle size={48} />
                    </div>
                    <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter text-red-500">Security Lockdown</h1>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        A security violation was detected (Tab Switch or Loss of Focus). Your session has been terminated to preserve integrity.
                    </p>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
                        <p className="text-xs font-black text-primary-400 uppercase mb-2 tracking-widest">Administrator Action Required</p>
                        <p className="text-slate-300 text-sm italic">"Please provide your Register Number to the staff to request a manual unblock."</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => window.location.reload()} className="flex-1 py-4 rounded-xl bg-primary-600 hover:bg-primary-500 font-bold transition-all transition-all flex items-center justify-center gap-2">
                            <RefreshCw size={18} /> Retry Sync
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold transition-all">Exit Player</button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!isLiveReady || !isFullScreen || (quiz?.require_details && !hasSubmittedDetails)) return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-6 overflow-y-auto">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass p-12 rounded-[40px] max-w-2xl w-full text-center border-primary-500/30 border-2 my-10 shadow-3xl">
                
                {quiz?.require_details && !hasSubmittedDetails ? (
                    <div className="text-left space-y-6">
                        <div className="text-center mb-8">
                             <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Users size={40} className="text-primary-400" />
                             </div>
                             <h2 className="text-4xl font-black tracking-tighter uppercase text-white">Identity Check</h2>
                             <p className="text-slate-500 text-sm font-medium mt-1">Official identification required for this proctored session.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Full Name</label>
                                 <input type="text" className="input-field py-4" placeholder="e.g. John Doe" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Register Number</label>
                                 <input type="text" className="input-field py-4 font-mono" placeholder="21BCS001" value={studentForm.regNo} onChange={e => setStudentForm({...studentForm, regNo: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Department</label>
                                 <input type="text" className="input-field py-4" placeholder="CSE" value={studentForm.dept} onChange={e => setStudentForm({...studentForm, dept: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Academic Year</label>
                                 <select className="input-field py-4 bg-slate-800" value={studentForm.year} onChange={e => setStudentForm({...studentForm, year: e.target.value})}>
                                     <option value="">Select Year</option>
                                     <option value="I">I Year</option>
                                     <option value="II">II Year</option>
                                     <option value="III">III Year</option>
                                     <option value="IV">IV Year</option>
                                 </select>
                             </div>
                        </div>
                        <button 
                            disabled={!studentForm.name || !studentForm.regNo || !studentForm.dept || !studentForm.year}
                            onClick={() => setHasSubmittedDetails(true)} 
                            className="bg-primary-600 hover:bg-primary-500 w-full py-5 text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary-500/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl transition-all"
                        >
                            VERIFY & ENTER LOBBY
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-10 relative">
                            <div className="w-32 h-32 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                {quiz?.quiz_type === 'live' ? <Users size={64} className="text-primary-400 animate-pulse" /> : <Zap size={64} className="text-primary-400" />}
                            </div>
                        </div>
                        
                        <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter text-white">
                            {quiz?.quiz_type === 'live' ? 'Synchronizing...' : 'Secure Assessment'}
                        </h1>
                        
                        <p className="text-slate-400 text-lg mb-12 font-medium leading-relaxed">
                            {quiz?.quiz_type === 'live' ? 'Awaiting start signal from proctor. Do not close this window.' : 
                             quiz?.quiz_type === 'scheduled' ? `Assessment Window: ${new Date(quiz.scheduled_start).toLocaleString()}` : 
                             'Your secure environment is ready. Click below to begin.'}
                        </p>
                        
                        <div className="flex flex-col items-center justify-center gap-6 mt-8">
                            {isLiveReady ? (
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        document.documentElement.requestFullscreen().catch(() => {});
                                        setIsFullScreen(true);
                                    }}
                                    className="bg-primary-600 hover:bg-primary-500 text-white px-16 py-6 rounded-[24px] text-xl font-black uppercase tracking-widest flex items-center gap-4 shadow-3xl"
                                >
                                    <Zap fill="currentColor" /> INITIATE SESSION
                                </motion.button>
                            ) : (
                                <div className="space-y-4">
                                     <div className="flex items-center gap-3 text-yellow-500 font-black text-xs uppercase tracking-[0.2em] bg-yellow-500/10 px-6 py-2 rounded-full border border-yellow-500/20">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                                        {quiz?.quiz_type === 'live' ? 'Awaiting Staff Authorization' : 'Assessment Window Not Open'}
                                    </div>
                                    <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-white underline text-[10px] font-black uppercase tracking-widest">Abandon Session</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );

    const currentQ = questions[currentIdx];
    const userAns = answers.find(a => a.question_id === currentQ?.id)?.selected_option;

    // Guard: questions not yet loaded or index out of range
    if (!currentQ) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse text-sm">Loading Questions...</p>
        </div>
    );

    return (
        <div className="min-h-screen -m-8 p-8 transition-all duration-1000 bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* HUD */}
                <div className="flex justify-between items-center glass p-6 rounded-[32px] border-white/5 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-400 font-black border border-primary-500/20">
                            {currentIdx + 1}
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white uppercase tracking-tighter truncate max-w-md">{quiz.title}</h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Module Progress • {Math.round(((currentIdx + 1)/questions.length)*100)}%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        {timeLeft !== null && (
                            <div className={`flex items-center gap-3 text-4xl font-black italic tracking-tighter ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                <Clock size={32} className="opacity-20" /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                        )}
                        <button onClick={() => window.location.reload()} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-500" title="Sync Progress">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} className="h-full bg-gradient-to-r from-primary-600 to-indigo-500" />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={currentIdx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="glass p-10 rounded-[48px] min-h-[500px] flex flex-col justify-between border-white/5 bg-white/[0.01]">
                        <div className="space-y-10">
                            <div className="flex justify-between items-start">
                                <h2 className="text-3xl font-black text-white leading-tight max-w-3xl">{currentQ.question}</h2>
                                <span className="bg-primary-500/10 text-primary-400 px-5 py-2 rounded-2xl text-xs font-black tracking-widest border border-primary-500/20 uppercase whitespace-nowrap">
                                    {currentQ.points} Units
                                </span>
                            </div>

                            {currentQ.image_url && (
                                <div className="rounded-[32px] overflow-hidden border border-white/10 max-h-80 flex justify-center bg-black/40 p-4 shadow-inner">
                                    <img src={currentQ.image_url} alt="Reference media" className="object-contain h-full rounded-2xl" />
                                </div>
                            )}

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {(shuffledOptions[currentQ.id] || (currentQ.type === 'tf' ? ['a', 'b'] : ['a', 'b', 'c', 'd'])).map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => handleSelect(opt)}
                                        className={`group p-8 text-left rounded-[28px] border-2 transition-all flex items-center gap-6 ${userAns === opt
                                            ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_40px_rgba(59,130,246,0.1)]'
                                            : 'border-white/5 hover:border-white/20 hover:bg-white/[0.03]'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${userAns === opt ? 'bg-primary-600 text-white' : 'bg-white/5 text-slate-500 group-hover:bg-white/10'}`}>
                                            {opt.toUpperCase()}
                                        </div>
                                        <span className={`text-lg font-bold transition-all ${userAns === opt ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                            {currentQ.type === 'tf' ? (opt === 'a' ? 'TRUE' : 'FALSE') : currentQ[`option_${opt}`]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between items-center mt-16 pt-8 border-t border-white/5">
                            <button
                                disabled={currentIdx === 0}
                                onClick={() => setCurrentIdx(prev => prev - 1)}
                                className="w-16 h-16 rounded-[24px] bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-10 transition-all text-white border border-white/5 shadow-xl"
                            >
                                <ChevronLeft size={32} />
                            </button>

                            <div className="flex gap-4">
                                {currentIdx === questions.length - 1 ? (
                                    <button onClick={() => handleSubmit(false)} className="bg-primary-600 hover:bg-primary-500 text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all shadow-3xl hover:-translate-y-1 active:translate-y-0">
                                        <Send size={20} /> FINALIZE ASSESSMENT
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentIdx(prev => prev + 1)}
                                        className="bg-primary-600 hover:bg-primary-500 text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all shadow-3xl hover:-translate-y-1 active:translate-y-0"
                                    >
                                        NEXT MODULE <ChevronRight size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Progress Grid */}
                <div className="grid grid-cols-10 md:grid-cols-20 gap-3 justify-center pt-8">
                    {questions.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIdx(i)}
                            className={`w-10 h-10 rounded-xl transition-all font-black text-xs border ${currentIdx === i ? 'bg-primary-600 border-primary-600 text-white scale-125 shadow-2xl z-10' :
                                answers.find(a => a.question_id === q.id) ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-700'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
