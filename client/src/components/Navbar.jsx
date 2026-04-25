import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Database, User, TrendingUp, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate('/');
    };

    return (
        <nav className="glass sticky top-0 z-[100] px-4 md:px-6 py-3 border-b border-white/5 bg-[#0f172a]/95 backdrop-blur-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-indigo-400 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-lg">N</div>
                    <span>NexQuiz</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center gap-6">
                    {user ? (
                        <>
                            <NavLink to="/" icon={<LayoutDashboard size={18} />} label="Explore" />
                            <NavLink to="/dashboard" icon={<TrendingUp size={18} />} label="My Progress" />
                            {(user.role === 'staff' || user.role === 'admin') && (
                                <NavLink to="/staff" icon={<Database size={18} />} label="Staff Panel" />
                            )}
                            {user.role === 'admin' && (
                                <NavLink to="/admin" icon={<Shield size={18} />} label="Admin Master" color="text-red-400" />
                            )}
                            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                                <Link to="/profile" className="flex items-center gap-2 text-primary-400 font-bold hover:text-white transition-all">
                                    <User size={18} /> {user.name}
                                </Link>
                                <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-6">
                            <Link to="/login" className="text-slate-400 font-bold hover:text-white transition-colors">Sign In</Link>
                            <Link to="/register" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/10">Get Started</Link>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-slate-400 hover:text-white">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-slate-900 border-t border-white/5 overflow-hidden mt-3"
                    >
                        <div className="flex flex-col p-4 gap-4">
                            {user ? (
                                <>
                                    <MobileNavLink to="/" onClick={() => setIsOpen(false)} icon={<LayoutDashboard size={20} />} label="Explore" />
                                    <MobileNavLink to="/dashboard" onClick={() => setIsOpen(false)} icon={<TrendingUp size={20} />} label="My Progress" />
                                    {(user.role === 'staff' || user.role === 'admin') && (
                                        <MobileNavLink to="/staff" onClick={() => setIsOpen(false)} icon={<Database size={20} />} label="Staff Panel" />
                                    )}
                                    {user.role === 'admin' && (
                                        <MobileNavLink to="/admin" onClick={() => setIsOpen(false)} icon={<Shield size={20} />} label="Admin Console" color="text-red-400" />
                                    )}
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                        <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-primary-400 font-bold">
                                            <User size={20} /> {user.name}
                                        </Link>
                                        <button onClick={handleLogout} className="text-red-400 flex items-center gap-2 font-bold uppercase text-[10px]">
                                            Logout <LogOut size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center py-3 rounded-xl border border-white/10 font-bold">Login</Link>
                                    <Link to="/register" onClick={() => setIsOpen(false)} className="w-full text-center py-3 rounded-xl bg-primary-600 font-bold text-white shadow-lg">Sign Up</Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

function NavLink({ to, icon, label, color = "text-slate-400" }) {
    return (
        <Link to={to} className={`flex items-center gap-2 ${color} hover:text-white font-bold transition-all`}>
            {icon} <span>{label}</span>
        </Link>
    );
}

function MobileNavLink({ to, onClick, icon, label, color = "text-slate-400" }) {
    return (
        <Link to={to} onClick={onClick} className={`flex items-center gap-4 ${color} hover:text-white p-3 rounded-xl hover:bg-white/5 transition-all`}>
            {icon} <span className="font-bold">{label}</span>
        </Link>
    );
}
