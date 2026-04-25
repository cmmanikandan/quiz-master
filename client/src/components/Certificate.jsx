import { motion } from 'framer-motion';
import { Award, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function Certificate({ userName, quizTitle, score, date, passPercentage }) {
    const handleDownload = async () => {
        const element = document.getElementById('certificate-template');
        const canvas = await html2canvas(element, { scale: 3 });
        const data = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = data;
        link.download = `${userName}_Certificate.png`;
        link.click();
    };

    return (
        <div className="space-y-6">
            <div id="certificate-template" className="bg-white text-slate-900 p-16 rounded-sm border-[20px] border-double border-primary-900 relative w-[800px] h-[600px] shadow-2xl mx-auto flex flex-col items-center justify-center text-center font-serif">
                <div className="absolute top-10 flex flex-col items-center">
                    <Award size={80} className="text-primary-600 mb-2" />
                    <div className="h-1 w-40 bg-primary-600"></div>
                </div>

                <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 text-primary-900">Certificate</h1>
                <p className="text-xl italic mb-8">Of Achievement</p>
                
                <p className="text-lg text-slate-500 mb-2 uppercase tracking-widest letter-spacing-1">THIS IS PROUDLY PRESENTED TO</p>
                <h2 className="text-4xl font-bold mb-8 border-b-2 border-slate-300 pb-2 min-w-[300px]">{userName}</h2>
                
                <p className="max-w-md mx-auto text-lg leading-relaxed text-slate-700">
                    For successfully completing the assessment <strong>{quizTitle}</strong> 
                    with a score of <strong>{score}%</strong>, exceeding the passing threshold of {passPercentage}%.
                </p>

                <div className="absolute bottom-16 w-full px-20 flex justify-between items-end">
                    <div className="text-left border-t border-slate-400 pt-2 px-4">
                        <p className="text-xs text-slate-500">Date Issued</p>
                        <p className="font-bold">{new Date(date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col items-center">
                         <img src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${window.location.href}`} className="opacity-40 grayscale" alt="Verify" />
                         <p className="text-[8px] mt-1 text-slate-400 uppercase tracking-widest">Verification Link</p>
                    </div>
                    <div className="text-right border-t border-slate-400 pt-2 px-4">
                        <p className="text-xs text-slate-500">Authority Signature</p>
                        <p className="font-bold italic">QuizMaster Official</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4 no-print mt-10">
                <button onClick={handleDownload} className="btn-primary py-3 px-8 flex items-center gap-2">
                    <Download size={20} /> Download Certificate (PNG)
                </button>
                <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl flex items-center gap-2">
                    Print PDF
                </button>
            </div>
        </div>
    );
}
