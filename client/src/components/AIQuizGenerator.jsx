import { useState } from 'react';
import { Sparkles, FileText, Zap, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

export default function AIQuizGenerator({ quizId, onQuestionsAdded }) {
    const [rawText, setRawText] = useState('');
    const [preview, setPreview] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const processText = () => {
        setIsProcessing(true);
        // Simple but smart parser: Look for patterns like "1. Question?" or "Q: Question"
        const lines = rawText.split('\n').filter(l => l.trim().length > 5);
        const parsed = [];
        
        let currentQ = null;
        for (let line of lines) {
            const clean = line.trim();
            // Detect Question: Starts with number or Q:
            if (/^\d+[\.\)]/.test(clean) || /^Q[:\s]/.test(clean, 'i')) {
                if (currentQ) parsed.push(currentQ);
                currentQ = {
                    question: clean.replace(/^\d+[\.\)]\s*|Q[:\s]\s*/i, ''),
                    option_a: '', option_b: '', option_c: '', option_d: '',
                    correct_option: 'a', points: 1, type: 'mcq'
                };
            } else if (currentQ) {
                // Detect Options: Starts with A), B), etc.
                if (/^[A-D][\.\)]/i.test(clean)) {
                    const label = clean[0].toLowerCase();
                    currentQ[`option_${label}`] = clean.replace(/^[A-D][\.\)]\s*/i, '');
                } else if (/^Ans[:\s]/i.test(clean)) {
                    const ans = clean.split(/[:\s]/).pop().trim().toLowerCase();
                    if (['a','b','c','d'].includes(ans)) currentQ.correct_option = ans;
                }
            }
        }
        if (currentQ) parsed.push(currentQ);
        
        setPreview(parsed);
        setIsProcessing(false);
    };

    const handleImport = async () => {
        try {
            for (const q of preview) {
                await api.post(`/quiz/${quizId}/add-question`, q);
            }
            onQuestionsAdded();
            setRawText('');
            setPreview([]);
        } catch (err) {
            alert("Partial import failed. Check question formats.");
        }
    };

    return (
        <div className="space-y-8 glass p-8 rounded-[40px] border-primary-500/20">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-primary-500/10 text-primary-500 rounded-2xl">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">AI Architect</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Paste raw text to extract questions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <textarea 
                        className="w-full h-[400px] bg-white/5 border border-white/10 rounded-[32px] p-6 text-slate-300 font-mono text-sm focus:border-primary-500 outline-none transition-all resize-none"
                        placeholder={`Paste your text here. Example:\n1. What is React?\nA) A Library\nB) A Framework\nAns: A`}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                    ></textarea>
                    <button 
                        onClick={processText}
                        disabled={!rawText || isProcessing}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? 'Architecting...' : <><Zap size={18} /> Parse Questions</>}
                    </button>
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="flex-1 bg-black/20 rounded-[32px] border border-white/5 p-6 overflow-y-auto max-h-[400px] custom-scrollbar">
                        {preview.length > 0 ? (
                            <div className="space-y-4">
                                {preview.map((q, idx) => (
                                    <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center font-black text-xs shrink-0">{idx+1}</div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-white leading-tight">{q.question}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Correct: {q.correct_option.toUpperCase()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                <FileText size={48} className="mb-4" />
                                <p className="text-sm">Parsed questions will appear here</p>
                            </div>
                        )}
                    </div>
                    {preview.length > 0 && (
                        <button 
                            onClick={handleImport}
                            className="bg-green-600 hover:bg-green-500 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl shadow-green-500/20"
                        >
                            <CheckCircle2 size={18} /> Import {preview.length} Questions
                        </button>
                    ) }
                </div>
            </div>
        </div>
    );
}
