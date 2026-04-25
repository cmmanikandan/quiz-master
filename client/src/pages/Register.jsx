import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Password strength calculator
function getStrength(password) {
    let score = 0;
    if (!password) return { score: 0, label: '', color: '' };
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-400' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-400' };
    return { score: 4, label: 'Strong', color: 'bg-green-500', textColor: 'text-green-400' };
}

const rules = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character (!@#...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Register() {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '', role: 'user'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [touched, setTouched] = useState({ password: false, confirmPassword: false });
    const { register } = useAuth();
    const navigate = useNavigate();

    const strength = useMemo(() => getStrength(formData.password), [formData.password]);
    const passwordsMatch = formData.confirmPassword === '' ? null : formData.password === formData.confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (strength.score < 2) {
            setError('Please choose a stronger password.');
            return;
        }
        try {
            await register(formData.name, formData.email, formData.password, formData.role);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[85vh] px-4 py-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-[#1e293b] border border-white/5 p-8 rounded-2xl w-full max-w-md shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-center mb-2 text-primary-400">
                    <UserPlus size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-1 text-center text-white">Create Account</h2>
                <p className="text-slate-500 text-xs text-center mb-6">Join NexQuiz to start taking or creating quizzes</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">Full Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input-field pr-12"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={(e) => {
                                    setFormData({ ...formData, password: e.target.value });
                                    setTouched(t => ({ ...t, password: true }));
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Strength Bar */}
                        {touched.password && formData.password && (
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1 flex-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                                    i <= strength.score ? strength.color : 'bg-white/10'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-bold ml-3 ${strength.textColor}`}>
                                        {strength.label}
                                    </span>
                                </div>

                                {/* Rules checklist */}
                                <div className="grid grid-cols-2 gap-1">
                                    {rules.map((rule) => {
                                        const ok = rule.test(formData.password);
                                        return (
                                            <div key={rule.label} className={`flex items-center gap-1.5 text-[10px] ${ok ? 'text-green-400' : 'text-slate-600'}`}>
                                                {ok ? <CheckCircle size={11} /> : <XCircle size={11} />}
                                                {rule.label}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                className={`input-field pr-12 transition-all ${
                                    touched.confirmPassword && formData.confirmPassword
                                        ? passwordsMatch
                                            ? 'border-green-500/50 focus:border-green-500'
                                            : 'border-red-500/50 focus:border-red-500'
                                        : ''
                                }`}
                                placeholder="Repeat your password"
                                value={formData.confirmPassword}
                                onChange={(e) => {
                                    setFormData({ ...formData, confirmPassword: e.target.value });
                                    setTouched(t => ({ ...t, confirmPassword: true }));
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {touched.confirmPassword && formData.confirmPassword && (
                            <p className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                                {passwordsMatch
                                    ? <><CheckCircle size={11} /> Passwords match</>
                                    : <><XCircle size={11} /> Passwords do not match</>
                                }
                            </p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">Account Type</label>
                        <select
                            className="input-field bg-slate-800"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="user">Student — Take Quizzes</option>
                            <option value="staff">Staff — Create & Manage Quizzes</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full py-3 mt-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
                    >
                        Create Account
                    </button>
                </form>

                <p className="mt-5 text-center text-slate-500 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold hover:underline">
                        Log in here
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
