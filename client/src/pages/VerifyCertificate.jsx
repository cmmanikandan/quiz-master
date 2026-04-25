import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Calendar, User, Zap, ChevronLeft } from 'lucide-react';

export default function VerifyCertificate() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVerification = async () => {
            try {
                const res = await api.get(`/attempt/verify/${id}`);
                setData(res.data);
            } catch (err) {
                console.error("Verification failed");
            } finally {
                setLoading(false);
            }
        };
        fetchVerification();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-center p-6">
            <ShieldCheck size={80} className="text-red-500 mb-6 opacity-20" />
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Invalid Credential</h1>
            <p className="text-slate-400 mb-8 max-w-md">The certificate you are trying to verify does not exist or has been revoked.</p>
            <Link to="/" className="btn-primary px-8 py-3">Return Home</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-6">
             <div className="max-w-2xl mx-auto">
                <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors">
                    <ChevronLeft size={20} /> <span className="uppercase text-xs font-bold tracking-widest">NexQuiz Official</span>
                </Link>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass p-10 rounded-[40px] border-green-500/30 border-2 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Award size={300} />
                    </div>

                    <div className="flex items-center gap-4 mb-10 text-green-500 bg-green-500/10 w-fit px-6 py-2 rounded-full border border-green-500/20">
                        <ShieldCheck size={20} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Verified Credential</span>
                    </div>

                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Certificate of Achievement</h1>
                    <p className="text-slate-400 text-lg mb-12">This document confirms the successful completion of the assessment.</p>

                    <div className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InfoBlock icon={<User className="text-primary-400" />} label="Recipient" value={data.student_name || data.user_name} />
                            <InfoBlock icon={<Zap className="text-yellow-400" />} label="Assessment" value={data.quiz_title} />
                            <InfoBlock icon={<Award className="text-purple-400" />} label="Grade Secured" value={`${parseFloat(data.score).toFixed(1)} / ${data.total_questions}`} />
                            <InfoBlock icon={<Calendar className="text-blue-400" />} label="Issued On" value={new Date(data.submitted_at).toLocaleDateString()} />
                        </div>
                    </div>

                    <div className="mt-16 pt-10 border-t border-white/5 flex items-center justify-between">
                         <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Issuer Signature</p>
                            <p className="text-white font-serif italic text-xl">NexQuiz Authority</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Blockchain ID</p>
                            <p className="text-xs text-slate-400 font-mono">NQ-{data.id}-{data.user_id}</p>
                         </div>
                    </div>
                </motion.div>

                <div className="mt-12 text-center">
                    <p className="text-slate-600 text-[10px] uppercase tracking-[0.3em] font-black">Powered by NexQuiz Integrity Engine</p>
                </div>
             </div>
        </div>
    );
}

function InfoBlock({ icon, label, value }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-xl font-bold text-white tracking-tight">{value}</p>
        </div>
    );
}
