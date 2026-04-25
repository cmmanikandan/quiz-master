import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { Trophy, Medal, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import socket from '../utils/socket';

export default function Leaderboard() {
    const { quizId } = useParams();
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();

        socket.connect();
        // Since we don't have the quiz code here easily, we rely on the backend 
        // broadcasting to everyone or we need to pass quiz code somehow.
        // For now, let's just listen globally or fetch on update.
        socket.on('leaderboard_update', () => {
            fetchLeaderboard();
        });

        return () => {
            socket.off('leaderboard_update');
            socket.disconnect();
        };
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get(`/attempt/leaderboard/${quizId}`);
            setRankings(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-center mt-20">Loading Rankings...</div>;

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="text-center mb-12">
                <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
                <h1 className="text-4xl font-bold">Leaderboard</h1>
                <p className="text-slate-400 mt-2">Displaying the top 10 scores for this assessment</p>
            </div>

            <div className="glass rounded-3xl overflow-hidden border border-white/5">
                <div className="grid grid-cols-5 p-6 bg-white/5 font-bold text-slate-500 uppercase tracking-wider text-xs border-b border-white/10">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-2">Student</div>
                    <div className="col-span-1 text-center">Score</div>
                    <div className="col-span-1 text-right">Time</div>
                </div>

                <div className="divide-y divide-white/5">
                    {rankings.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                            <Users size={48} />
                            <p>No attempts recorded yet.</p>
                        </div>
                    ) : (
                        rankings.map((user, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className={`grid grid-cols-5 p-6 items-center transition-colors hover:bg-white/5 ${i < 3 ? 'bg-primary-500/5' : ''}`}
                            >
                                <div className="col-span-1 flex items-center gap-2">
                                    {i === 0 ? <Medal className="text-yellow-400" /> :
                                        i === 1 ? <Medal className="text-slate-400" /> :
                                            i === 2 ? <Medal className="text-amber-600" /> :
                                                <span className="w-6 text-center font-bold text-slate-500">{i + 1}</span>}
                                </div>
                                <div className="col-span-2 font-bold text-lg uppercase">{user.name}</div>
                                <div className="col-span-1 text-center text-primary-400 font-bold text-xl">{user.score}%</div>
                                <div className="col-span-1 text-right text-slate-400 font-mono tracking-tighter">{user.time_taken}s</div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-8 text-center">
                <button onClick={fetchLeaderboard} className="text-sm text-primary-400 hover:underline">Refresh Leaderboard</button>
            </div>
        </div>
    );
}
