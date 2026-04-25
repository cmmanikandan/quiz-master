import { motion } from 'framer-motion';
import { Award, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function Certificate({ userName, quizTitle, score, date, passPercentage, attemptId }) {
    const handleDownload = async () => {
        const element = document.getElementById('certificate-template');
        const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#020617' });
        const data = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = data;
        link.download = `${userName}_NexQuiz_Credential.png`;
        link.click();
    };

    const verifyUrl = `${window.location.origin}/verify/${attemptId}`;

    return (
        <div className="space-y-10">
            <div id="certificate-template" className="bg-[#020617] text-white p-20 rounded-sm border-[12px] border-[#fbbf24]/30 relative w-[1000px] h-[700px] shadow-3xl mx-auto flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-yellow-600/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 border-2 border-[#fbbf24]/20 p-12 w-full h-full flex flex-col items-center justify-center">
                    <div className="mb-6">
                        <Award size={90} className="text-[#fbbf24] mb-2" />
                        <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent"></div>
                    </div>

                    <h1 className="text-6xl font-black uppercase tracking-[0.2em] mb-4 text-transparent bg-clip-text bg-gradient-to-b from-[#fbbf24] to-[#d97706]">Official Credential</h1>
                    <p className="text-xl text-slate-400 uppercase tracking-[0.4em] font-light mb-12">Achievement Excellence Award</p>
                    
                    <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-[0.3em]">PROUDLY CONFERRED UPON</p>
                    <h2 className="text-5xl font-serif font-black mb-10 text-white italic border-b border-white/10 pb-4 min-w-[500px]">{userName}</h2>
                    
                    <p className="max-w-2xl mx-auto text-lg leading-relaxed text-slate-300 font-light">
                        For demonstrating exceptional mastery in <b>{quizTitle}</b>. 
                        Achieving a distinguished final score of <span className="text-[#fbbf24] font-bold">{score}%</span>, 
                        securing official certification based on the NexQuiz global standards.
                    </p>

                    <div className="absolute bottom-12 w-full px-16 flex justify-between items-end">
                        <div className="text-left">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Date of Issue</p>
                            <p className="font-bold text-white tracking-widest">{new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        
                        <div className="flex flex-col items-center bg-white p-2 rounded-lg shadow-xl translate-y-4">
                             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${verifyUrl}`} className="w-16 h-16" alt="Verify" />
                             <p className="text-[6px] mt-1 text-slate-900 font-black uppercase tracking-tighter">Scan to Verify</p>
                        </div>

                        <div className="text-right">
                             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Authority Signature</p>
                             <p className="text-2xl font-serif text-[#fbbf24] italic tracking-tighter">NexQuiz Board</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-6 no-print">
                <button onClick={handleDownload} className="btn-primary py-5 px-10 flex items-center gap-3 shadow-2xl shadow-primary-500/20 active:scale-95 transition-all">
                    <Download size={22} /> <span className="font-black uppercase tracking-widest text-xs">Secure PNG Download</span>
                </button>
                <button onClick={() => window.print()} className="bg-white/5 hover:bg-white/10 px-10 py-5 rounded-2xl flex items-center gap-3 transition-all">
                    <Share2 size={20} className="text-slate-400" /> <span className="font-black uppercase tracking-widest text-xs text-slate-400">Public Share</span>
                </button>
            </div>
        </div>
    );
}
