import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
    Plus, Upload, FileText, BarChart3, Trash2, CheckCircle, Zap, Trophy, MessageSquare,
    Smartphone, Mail, Send, Settings, ChevronLeft, Search, X, Shield, Globe, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIQuizGenerator from '../components/AIQuizGenerator';

export default function StaffBoard() {
    const [quizzes, setQuizzes] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', answer_mode: 'after_submit', timer: 60, show_explanation: true, allow_review: true, is_team: false, shuffle_questions: false, shuffle_options: false, negative_marking: 0
    });
    const [csvFile, setCsvFile] = useState(null);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [uploadMode, setUploadMode] = useState('csv'); // 'csv', 'manual', 'settings', 'invite'
    const [inviteSubMode, setInviteSubMode] = useState('email'); // 'email' or 'whatsapp'
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [whatsappList, setWhatsappList] = useState([]);
    const [manualPhone, setManualPhone] = useState('');

    const selectedQuizObj = quizzes.find(q => q.id === selectedQuiz);

    useEffect(() => {
        if (selectedQuiz) {
            fetchQuizQuestions();
            const q = quizzes.find(item => item.id === selectedQuiz);
            if (q) setEditingQuiz(q);
        }
    }, [selectedQuiz]);

    const fetchQuizQuestions = async () => {
        try {
            const res = await api.get(`/quiz/${selectedQuiz}/edit-details`);
            const qArr = res.data.questions;
            if (Array.isArray(qArr)) {
                setQuizQuestions(qArr);
            } else {
                setQuizQuestions([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const [manualQuestion, setManualQuestion] = useState({
        question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', explanation: '', type: 'mcq', points: 1, image_url: ''
    });

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        const res = await api.get('/quiz/my-quizzes');
        if (Array.isArray(res.data)) {
            setQuizzes(res.data);
        } else {
            setQuizzes([]);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
        try {
            await api.delete(`/quiz/${id}`);
            fetchQuizzes();
            if (selectedQuiz === id) setSelectedQuiz(null);
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await api.delete(`/quiz/question/${id}`);
            fetchQuizQuestions();
        } catch (err) {
            alert('Failed to delete question');
        }
    };

    const handleEditQuestion = (q) => {
        setEditingQuestionId(q.id);
        setManualQuestion({
            question: q.question,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option,
            explanation: q.explanation,
            type: q.type,
            points: q.points,
            image_url: q.image_url || ''
        });
        setUploadMode('manual');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/quiz/create', { ...formData, timer: parseInt(formData.timer) || 0 });
            setShowCreate(false);
            setFormData({ title: '', description: '', answer_mode: 'after_submit', timer: 60, show_explanation: true, allow_review: true, is_team: false, shuffle_questions: false, shuffle_options: false });
            fetchQuizzes();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create quiz');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!csvFile || !selectedQuiz) return;
        const data = new FormData();
        data.append('file', csvFile);
        try {
            await api.post(`/quiz/${selectedQuiz}/upload-csv`, data);
            alert('Questions uploaded successfully');
            setCsvFile(null);
            fetchQuizQuestions();
        } catch (err) {
            alert('Failed to upload questions');
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingQuestionId) {
                await api.put(`/quiz/question/${editingQuestionId}`, manualQuestion);
                setEditingQuestionId(null);
            } else {
                await api.post(`/quiz/${selectedQuiz}/add-question`, manualQuestion);
            }
            setManualQuestion({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', explanation: '', type: 'mcq', points: 1, image_url: '' });
            fetchQuizQuestions();
        } catch (err) {
            alert('Operation failed');
        }
    };


    const handleWhatsappCsv = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            // Strip all non-digit characters (commas, spaces, \r, quotes, etc.) per line
            const lines = text
                .split('\n')
                .map(l => l.replace(/[^\d]/g, '').trim())
                .filter(l => l.length >= 7 && l !== 'phone');
            const newNumbers = lines.filter(num => !whatsappList.find(p => p.phone === num));
            setWhatsappList(prev => [...prev, ...newNumbers.map(p => ({ phone: p, sent: false }))]);
        };
        reader.readAsText(file);
    };

    // Build the formatted WhatsApp message
    const buildMessage = () => {
        const quizTitle = selectedQuizObj?.title || 'Quiz';
        const quizCode = selectedQuizObj?.code || '';
        const quizLink = `${window.location.origin}/quiz/${quizCode}`;

        // Use fromCodePoint so emojis aren't corrupted by Windows file encoding
        const E = {
            rocket: String.fromCodePoint(0x1F680), // 🚀
            star: String.fromCodePoint(0x2728),  // ✨
            trophy: String.fromCodePoint(0x1F3C6), // 🏆
            lock: String.fromCodePoint(0x1F512), // 🔒
            link: String.fromCodePoint(0x1F517), // 🔗
            wave: String.fromCodePoint(0x1F44B), // 👋
        };

        return [
            `${E.rocket} *NexQuiz \u2014 Secure Assessment*`,
            ``,
            `${E.wave} Hello! You've been selected to participate in a proctored assessment on NexQuiz.`,
            ``,
            `${E.star} *Quiz:* ${quizTitle}`,
            `${E.lock} *Access Code:* \`${quizCode}\``,
            `${E.link} *Start Now:*`,
            quizLink,
            ``,
            `*Instructions:*`,
            `1. Ensure a stable internet connection.`,
            `2. Do not switch tabs during the session (Security Tracked).`,
            `3. Use the code above if prompted.`,
            ``,
            `${E.trophy} Aim for the top!`,
            `\u2014 The NexQuiz AI Platform`
        ].join('\n');
    };


    // Clean phone number: digits only
    const cleanPhone = (phone) => phone.replace(/[^\d]/g, '');

    const sendWhatsapp = (phone) => {
        const num = cleanPhone(phone);
        if (!num || num.length < 7) { alert('Invalid phone number: ' + phone); return; }
        const msg = encodeURIComponent(buildMessage());
        // Use api.whatsapp.com/send which works on both mobile & desktop WhatsApp Web
        window.open(`https://api.whatsapp.com/send?phone=${num}&text=${msg}`, '_blank');
        setWhatsappList(prev => prev.map(item => item.phone === phone ? { ...item, sent: true } : item));
    };

    const copyMessage = () => {
        navigator.clipboard.writeText(buildMessage())
            .then(() => alert('Message copied! Paste it in any WhatsApp chat or broadcast list.'))
            .catch(() => alert('Copy failed — please copy manually.'));
    };

    const copyAllLinks = () => {
        const msg = encodeURIComponent(buildMessage());
        const links = whatsappList.map(p => `wa.me/${p.phone}?text=${msg}`).join('\n');
        navigator.clipboard.writeText(links)
            .then(() => alert(`${whatsappList.length} links copied! Open each in your browser.`))
            .catch(() => alert('Copy failed.'));
    };

    const downloadLinksFile = () => {
        const msg = encodeURIComponent(buildMessage());
        const lines = [
            `NexQuiz — WhatsApp Invite Links`,
            `Quiz: ${selectedQuizObj?.title} | Code: ${selectedQuizObj?.code}`,
            `Generated: ${new Date().toLocaleString()}`,
            ``,
            ...whatsappList.map((p, i) => `${i + 1}. https://api.whatsapp.com/send?phone=${cleanPhone(p.phone)}&text=${msg}`)
        ].join('\n');
        const blob = new Blob([lines], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `whatsapp_links_${selectedQuizObj?.code}.txt`);
        link.click();
    };

    const addManualPhone = () => {
        const num = manualPhone.replace(/\D/g, '');
        if (!num) return;
        if (whatsappList.find(p => p.phone === num)) return alert('This number is already in the list.');
        setWhatsappList(prev => [...prev, { phone: num, sent: false }]);
        setManualPhone('');
    };

    const removePhone = (phone) => {
        setWhatsappList(prev => prev.filter(p => p.phone !== phone));
    };

    return (
        <div className="space-y-5 max-w-[1600px] mx-auto px-3 sm:px-6 pb-20 pt-4">
            {/* Header */}
            <div className="flex justify-between items-center gap-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">NexQuiz Staff Panel</h1>
                    <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-widest mt-0.5">Management & Proctoring Hub</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="bg-primary-600 hover:bg-primary-500 text-white flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shrink-0">
                    <Plus size={14} /> New Quiz
                </button>
            </div>

            {showCreate && (
                <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-xl z-[100] flex items-center justify-center p-3">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1e293b] p-6 sm:p-8 rounded-2xl w-full max-w-xl border border-white/5 shadow-2xl overflow-hidden relative overflow-y-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500"></div>
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            <Plus className="text-primary-500" size={18} /> Create Quiz
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-[10px] mb-1.5 text-slate-500 uppercase font-bold tracking-widest">Title</label>
                                <input type="text" className="input-field" placeholder="e.g. JavaScript Core Concepts" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] mb-1.5 text-slate-500 uppercase font-bold tracking-widest">Description</label>
                                <textarea className="input-field h-20 text-sm" placeholder="Explain the rules to students..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] mb-1.5 text-slate-500 uppercase font-bold tracking-widest">Time Limit (sec)</label>
                                    <input type="number" className="input-field" value={formData.timer} onChange={e => setFormData({ ...formData, timer: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] mb-1.5 text-slate-500 uppercase font-bold tracking-widest">Negative Penalty</label>
                                    <input type="number" step="0.25" className="input-field" value={formData.negative_marking} onChange={e => setFormData({ ...formData, negative_marking: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                                <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Create</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <div className={`grid gap-4 sm:gap-6 ${selectedQuiz ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {/* Quiz List */}
                <div className={selectedQuiz ? 'lg:col-span-1 space-y-3' : 'sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
                    {!selectedQuiz && <div className="col-span-full border-b border-white/5 pb-3"><h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Your Quizzes</h2></div>}
                    {Array.isArray(quizzes) && quizzes.map(quiz => (
                        <div
                            key={quiz.id}
                            className={`bg-[#1e293b] p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${selectedQuiz === quiz.id ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-white/5 hover:border-primary-500/30'}`}
                        >
                            {selectedQuiz === quiz.id && <div className="absolute top-0 right-0 p-2"><Zap className="text-primary-500 fill-primary-500" size={14} /></div>}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-white p-1.5 rounded-xl shadow-md shrink-0">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${window.location.origin}/quiz/${quiz.code}`} alt="QR" className="w-full h-full" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm truncate max-w-[110px] sm:max-w-[140px]">{quiz.title}</h3>
                                        <code className="text-primary-400 font-bold text-[10px] uppercase tracking-wider">{quiz.code}</code>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${quiz.quiz_type === 'live' ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-800 text-slate-500'} mb-1 inline-block`}>
                                        {quiz.quiz_type}
                                    </span>
                                    <p className="text-[9px] font-bold text-slate-600 uppercase">{quiz.total_questions || 0} Qs</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                                <button onClick={() => setSelectedQuiz(quiz.id)} className="bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1">
                                    <Plus size={12} /> Edit
                                </button>
                                <Link to={`/staff/report/${quiz.id}`} className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500 hover:text-slate-900 rounded-lg py-2 text-[10px] font-bold text-center uppercase tracking-wider transition-all flex items-center justify-center gap-1">
                                    <BarChart3 size={12} /> Results
                                </Link>
                                <Link to={`/leaderboard/${quiz.id}`} target="_blank" className="bg-white/5 border border-white/5 text-slate-500 hover:text-white rounded-lg py-2 text-[10px] font-bold text-center uppercase tracking-wider transition-all flex items-center justify-center gap-1">
                                    <Trophy size={12} /> Ranks
                                </Link>
                                <button onClick={() => handleDelete(quiz.id)} className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1">
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedQuiz && (
                    <>
                        {/* Editor (center) */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-[#1e293b] p-4 sm:p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
                                {/* Header + Tabs */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-5 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-primary-600/10 rounded-xl flex items-center justify-center text-primary-500 border border-primary-500/20">
                                            {uploadMode === 'manual' ? <Plus size={18} /> : uploadMode === 'settings' ? <Settings size={17} /> : uploadMode === 'invite' ? <MessageSquare size={17} /> : <FileText size={17} />}
                                        </div>
                                        <h2 className="text-base font-bold uppercase tracking-tight text-white">
                                            {uploadMode === 'manual' ? 'Add Question' : uploadMode === 'settings' ? 'Settings' : uploadMode === 'invite' ? 'Broadcast' : uploadMode === 'ai' ? 'AI Architect' : 'Import CSV'}
                                        </h2>
                                    </div>
                                    {/* Scrollable tab bar */}
                                    <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 overflow-x-auto w-full sm:w-auto gap-0.5">
                                        {[
                                            { id: 'csv', label: 'CSV', icon: <Upload size={12} /> },
                                            { id: 'ai', label: 'AI', icon: <Sparkles size={12} /> },
                                            { id: 'manual', label: 'Manual', icon: <Plus size={12} /> },
                                            { id: 'settings', label: 'Settings', icon: <Settings size={12} /> },
                                            { id: 'invite', label: 'Invite', icon: <MessageSquare size={12} /> },
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setUploadMode(tab.id)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${uploadMode === tab.id ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:text-white'
                                                    }`}
                                            >
                                                {tab.icon} {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {uploadMode === 'ai' ? (
                                        <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                            <AIQuizGenerator quizId={selectedQuiz} onQuestionsAdded={fetchQuizQuestions} />
                                        </motion.div>
                                    ) : uploadMode === 'settings' ? (
                                        <motion.form key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} onSubmit={async (e) => {
                                            e.preventDefault();
                                            try { await api.put(`/quiz/${selectedQuiz}`, editingQuiz); alert('Configuration Synchronized'); fetchQuizzes(); } catch (err) { alert('Sync Failed'); }
                                        }} className="space-y-8 text-left">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="col-span-2">
                                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block tracking-widest">Base Assessment Title</label>
                                                    <input type="text" className="input-field py-4" value={editingQuiz?.title || ''} onChange={e => setEditingQuiz({ ...editingQuiz, title: e.target.value })} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block tracking-widest">Strategic Instructions</label>
                                                    <textarea className="input-field h-32" value={editingQuiz?.description || ''} onChange={e => setEditingQuiz({ ...editingQuiz, description: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block tracking-widest">Session Logic</label>
                                                    <select className="input-field bg-slate-800" value={editingQuiz?.quiz_type || 'async'} onChange={e => setEditingQuiz({ ...editingQuiz, quiz_type: e.target.value })}>
                                                        <option value="async">Open Entry (Self-Paced)</option>
                                                        <option value="live">Proctored Live (Invigilator Required)</option>
                                                        <option value="scheduled">Synchronized Start (Time-Window)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block tracking-widest">Approval Threshold (%)</label>
                                                    <input type="number" className="input-field" value={editingQuiz?.pass_percentage || 50} onChange={e => setEditingQuiz({ ...editingQuiz, pass_percentage: e.target.value })} />
                                                </div>
                                                <div className="col-span-2 grid grid-cols-3 gap-4">
                                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Security</span>
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input type="checkbox" className="w-4 h-4 accent-primary-500" checked={editingQuiz?.shuffle_questions} onChange={e => setEditingQuiz({ ...editingQuiz, shuffle_questions: e.target.checked })} />
                                                            <span className="text-xs font-bold">Randomize Sequence</span>
                                                        </label>
                                                    </div>
                                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Accessibility</span>
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input type="checkbox" className="w-4 h-4 accent-primary-500" checked={editingQuiz?.is_public} onChange={e => setEditingQuiz({ ...editingQuiz, is_public: e.target.checked })} />
                                                            <span className="text-xs font-bold">Public Listing</span>
                                                        </label>
                                                    </div>
                                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Identity</span>
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input type="checkbox" className="w-4 h-4 accent-primary-500" checked={editingQuiz?.require_details} onChange={e => setEditingQuiz({ ...editingQuiz, require_details: e.target.checked })} />
                                                            <span className="text-xs font-bold">ID Verification</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <button type="submit" className="bg-primary-600 hover:bg-primary-500 w-full py-5 rounded-2xl text-white font-black uppercase text-xs tracking-widest transition-all">Synchronize Configuration</button>
                                        </motion.form>
                                    ) : uploadMode === 'invite' ? (
                                        <motion.div key="invite" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-left">
                                            <div className="flex gap-4 p-1.5 bg-black/30 rounded-2xl border border-white/5 w-fit">
                                                <button onClick={() => setInviteSubMode('email')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inviteSubMode === 'email' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Mail size={16} /> Email</button>
                                                <button onClick={() => setInviteSubMode('whatsapp')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inviteSubMode === 'whatsapp' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Smartphone size={16} /> WhatsApp</button>
                                            </div>
                                            {inviteSubMode === 'email' ? (
                                                <div className="space-y-6 bg-black/10 p-8 rounded-[2rem] border border-white/5">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Recipient Directory (CSV)</h3>
                                                        <button onClick={() => {
                                                            const content = "email\nstudent@example.com";
                                                            const blob = new Blob([content], { type: 'text/csv' });
                                                            const url = window.URL.createObjectURL(blob);
                                                            const link = document.createElement('a');
                                                            link.href = url; link.setAttribute('download', 'invite_template.csv'); link.click();
                                                        }} className="text-[10px] font-black text-primary-400 hover:underline">Download Format</button>
                                                    </div>
                                                    <form onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const fd = new FormData(); fd.append('csv', e.target.csv.files[0]);
                                                        try { await api.post(`/quiz/${selectedQuiz}/invite`, fd); alert('Invitations Distributed'); } catch (err) { alert('Broadcast Failed'); }
                                                    }} className="space-y-6">
                                                        <div className="border-2 border-dashed border-white/10 p-12 rounded-3xl text-center hover:border-primary-500/50 transition-all cursor-pointer bg-white/[0.01]">
                                                            <input type="file" name="csv" accept=".csv" className="text-slate-500 font-bold" />
                                                        </div>
                                                        <button type="submit" className="bg-primary-600 hover:bg-primary-500 w-full py-5 rounded-2xl text-white font-bold uppercase text-xs tracking-widest">Send Invites</button>
                                                    </form>
                                                </div>
                                            ) : (
                                                <div className="space-y-5">
                                                    {/* Manual Add */}
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="tel"
                                                            placeholder="Add number (e.g. 919876543210)"
                                                            value={manualPhone}
                                                            onChange={e => setManualPhone(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManualPhone())}
                                                            className="input-field flex-1 h-12 text-sm"
                                                        />
                                                        <button onClick={addManualPhone} className="bg-green-600 hover:bg-green-500 text-white px-5 h-12 rounded-xl font-bold text-sm transition-all">
                                                            + Add
                                                        </button>
                                                    </div>

                                                    {/* CSV Upload */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-px bg-white/5"></div>
                                                        <span className="text-[10px] text-slate-600 font-bold uppercase">or upload CSV</span>
                                                        <div className="flex-1 h-px bg-white/5"></div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input type="file" onChange={handleWhatsappCsv} accept=".csv" className="text-slate-400 text-xs flex-1 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs file:font-bold" />
                                                        <button onClick={() => {
                                                            const blob = new Blob(["phone\n919876543210"], { type: 'text/csv' });
                                                            const link = document.createElement('a');
                                                            link.href = URL.createObjectURL(blob);
                                                            link.setAttribute('download', 'whatsapp_template.csv');
                                                            link.click();
                                                        }} className="text-[10px] font-bold text-green-400 hover:underline whitespace-nowrap">Download Template</button>
                                                    </div>

                                                    {/* Number List */}
                                                    {whatsappList.length > 0 && (
                                                        <>
                                                            {/* Toolbar */}
                                                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3">
                                                                <p className="text-[10px] font-bold text-yellow-400 mb-1">⚠ Browser Limitation</p>
                                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                                    Browsers block automatic multi-tab popups. Use <strong className="text-white">Copy Message</strong> to paste into a WhatsApp broadcast list or group, or use <strong className="text-white">Download Links</strong> to open each link manually.
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center justify-between">
                                                                <p className="text-xs font-bold text-slate-400">{whatsappList.length} number{whatsappList.length !== 1 ? 's' : ''} &mdash; {whatsappList.filter(p => p.sent).length} opened</p>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={copyMessage}
                                                                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1"
                                                                        title="Copy the message text to paste in WhatsApp"
                                                                    >
                                                                        📋 Copy Message
                                                                    </button>
                                                                    <button
                                                                        onClick={downloadLinksFile}
                                                                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1"
                                                                        title="Download all wa.me links as a text file"
                                                                    >
                                                                        💾 Download Links
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                                {whatsappList.map((p, i) => (
                                                                    <div key={i} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${p.sent ? 'bg-green-600/5 border-green-500/20' : 'bg-white/5 border-white/5'
                                                                        }`}>
                                                                        <span className="text-[10px] font-bold text-slate-600 w-5">{i + 1}.</span>
                                                                        <span className={`font-mono text-sm flex-1 ${p.sent ? 'text-slate-500 line-through' : 'text-white'}`}>{p.phone}</span>
                                                                        <button
                                                                            onClick={() => sendWhatsapp(p.phone)}
                                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${p.sent ? 'bg-slate-800 text-slate-500 hover:bg-green-600 hover:text-white' : 'bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white'
                                                                                }`}
                                                                            title="Open WhatsApp chat for this number"
                                                                        >
                                                                            {p.sent ? 'Resend' : 'Open'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => removePhone(p.phone)}
                                                                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : uploadMode === 'csv' ? (
                                        <motion.div key="csv" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                            <div className="bg-primary-500/5 p-8 rounded-[2rem] border border-primary-500/10 flex justify-between items-center text-left">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold flex items-center gap-2 text-primary-400">Upload Questions via CSV</h3>
                                                    <p className="text-sm text-slate-400">Upload multiple questions at once using a CSV file.</p>
                                                </div>
                                                <button onClick={() => {
                                                    const content = "question,option_a,option_b,option_c,option_d,correct_answer,explanation,points,type\nWhat is React?,Library,Framework,Language,Database,a,Library is correct,1,mcq";
                                                    const blob = new Blob([content], { type: 'text/csv' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a'); link.href = url; link.setAttribute('download', 'bulk_format.csv'); link.click();
                                                }} className="bg-primary-600 hover:bg-primary-500 text-white py-3 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20">Download Template</button>
                                            </div>
                                            <form onSubmit={handleUpload} className="space-y-8">
                                                <div className="border-2 border-dashed border-white/5 rounded-[2.5rem] p-16 text-center bg-white/[0.01] hover:border-primary-500/30 transition-colors">
                                                    {csvFile ? <div className="text-primary-400 font-bold mb-4 flex items-center justify-center gap-2"><Upload size={20} /> {csvFile.name}</div> : <div className="text-slate-600 font-bold mb-4">Select or Drop CSV File</div>}
                                                    <input type="file" onChange={e => setCsvFile(e.target.files[0])} accept=".csv" className="text-slate-400 text-sm file:mr-6 file:py-3 file:px-8 file:rounded-xl file:border-0 file:bg-primary-600 file:text-white font-black file:uppercase file:text-[10px]" />
                                                </div>
                                                <div className="flex gap-4">
                                                    <button type="submit" className="bg-primary-600 hover:bg-primary-500 flex-1 py-5 rounded-[1.5rem] text-white font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-primary-500/20">Upload CSV</button>
                                                    <button type="button" onClick={() => setSelectedQuiz(null)} className="px-10 py-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-widest transition-all">Close</button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    ) : (
                                        <motion.form key="manual" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} onSubmit={handleManualSubmit} className="space-y-6 text-left">
                                            {editingQuestionId && (
                                                <div className="flex items-center gap-3 bg-primary-500/10 border border-primary-500/20 rounded-xl px-4 py-3">
                                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                                                    <p className="text-xs font-bold text-primary-400">Editing existing question — changes will update immediately.</p>
                                                </div>
                                            )}
                                            <div className="bg-black/20 p-6 md:p-8 rounded-2xl border border-white/5 space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Question</label>
                                                    <textarea className="input-field h-28 py-3 text-base" required placeholder="Type your question here..." value={manualQuestion.question} onChange={e => setManualQuestion({ ...manualQuestion, question: e.target.value })} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {['a', 'b', 'c', 'd'].map(opt => (
                                                        <div key={opt} className="relative">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">{opt.toUpperCase()}</div>
                                                            <input type="text" className="input-field pl-8 text-sm h-12" placeholder={`Option ${opt.toUpperCase()}`} required value={manualQuestion[`option_${opt}`]} onChange={e => setManualQuestion({ ...manualQuestion, [`option_${opt}`]: e.target.value })} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Correct Answer</label>
                                                        <select className="input-field bg-slate-800 h-12" value={manualQuestion.correct_option} onChange={e => setManualQuestion({ ...manualQuestion, correct_option: e.target.value })}>
                                                            {['a', 'b', 'c', 'd'].map(a => <option key={a} value={a}>Option {a.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Points</label>
                                                        <input type="number" className="input-field h-12" value={manualQuestion.points} onChange={e => setManualQuestion({ ...manualQuestion, points: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Explanation (optional)</label>
                                                    <input type="text" className="input-field h-12" placeholder="Explain why this answer is correct..." value={manualQuestion.explanation} onChange={e => setManualQuestion({ ...manualQuestion, explanation: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button type="submit" className="bg-primary-600 hover:bg-primary-500 grow py-4 rounded-xl text-white font-bold uppercase text-xs tracking-widest transition-all">
                                                    {editingQuestionId ? 'Save Changes' : 'Add Question'}
                                                </button>
                                                {editingQuestionId && (
                                                    <button type="button" onClick={() => {
                                                        setEditingQuestionId(null);
                                                        setManualQuestion({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', explanation: '', type: 'mcq', points: 1, image_url: '' });
                                                    }} className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-xs">Cancel</button>
                                                )}
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Sidebar (Right 1/4) */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl h-[750px] md:h-[850px] flex flex-col">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                    <h2 className="text-base font-bold flex items-center gap-2 text-white">
                                        <CheckCircle className="text-green-500" size={20} /> Question List
                                    </h2>
                                    <span className="bg-primary-600 text-white text-[10px] px-3 py-1 rounded-full font-bold">{quizQuestions.length} Total</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                    {quizQuestions.length === 0 ? (
                                        <div className="text-center py-16 text-slate-600 space-y-3">
                                            <FileText size={40} className="mx-auto opacity-20" />
                                            <p className="text-xs font-bold text-slate-600">No questions added yet</p>
                                        </div>
                                    ) : (
                                        Array.isArray(quizQuestions) && quizQuestions.map((q, idx) => (
                                            <div
                                                key={q.id}
                                                onClick={() => handleEditQuestion(q)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all group ${editingQuestionId === q.id
                                                    ? 'bg-primary-600/10 border-primary-500/40'
                                                    : 'bg-white/[0.02] border-white/5 hover:border-primary-500/30 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] text-primary-400 font-bold uppercase">Q{idx + 1}</span>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                                                        className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-slate-300 line-clamp-2 leading-snug">{q.question}</p>
                                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                                                    <span className="text-[9px] font-bold text-slate-500">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                                                    <span className="text-[9px] font-bold text-slate-600 uppercase">{q.type}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

