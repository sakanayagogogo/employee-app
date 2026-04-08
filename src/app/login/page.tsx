'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ employeeNumber: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(form.employeeNumber, form.password);
        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/home');
        }
    };

    return (
        <div className="min-h-screen flex animate-fade-in bg-zinc-50">
            {/* Left: Branding panel - Premium Dark Mode Look */}
            <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 relative overflow-hidden items-center justify-center border-r border-white/5">
                {/* Background Image */}
                <img src="/login-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />

                {/* Decorative Modern Orbs */}
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[80px]" />
                <div className="absolute top-[40%] left-[10%] w-[300px] h-[300px] rounded-full bg-emerald-400/5 blur-[60px]" />

                <div className="relative z-10 text-center px-12 animate-slide-up">
                        <div className="flex items-center gap-6">
                            <div className="h-32 w-32 bg-white rounded-[2.5rem] p-4 flex items-center justify-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border-2 border-white/10 hover:scale-105 transition-transform duration-500">
                                <img src="/pwa-icon-512.png" alt="KIZUNA Logo" className="h-full w-full object-contain" />
                            </div>
                            <div className="text-left">
                                <h1 className="text-7xl font-black text-white tracking-tighter drop-shadow-lg scale-y-110 origin-left uppercase">KIZUNA</h1>
                                <p className="text-emerald-300 mt-2 text-sm font-bold tracking-[0.25em] uppercase opacity-90 text-left">とりせん労働組合連絡システム</p>
                            </div>
                        </div>
                    <p className="text-zinc-400 mt-6 text-xl font-light leading-relaxed">社内エンゲージメント<br />コミュニティプラットフォーム</p>
                </div>
            </div>

            {/* Right: Login form */}
            <div className="flex-1 flex items-center justify-center p-6 relative">
                {/* Subtle Light Mode Background Orb */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

                <div className="w-full max-w-md animate-slide-up relative z-10 card-premium p-10">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-10 flex flex-row items-center justify-center gap-5">
                        <div className="h-18 w-18 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-xl border border-zinc-100">
                            <img src="/pwa-icon-512.png" alt="KIZUNA Logo" className="h-full w-full object-contain" />
                        </div>
                        <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase">KIZUNA</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-zinc-900 font-heading">おかえりなさい</h2>
                        <p className="text-zinc-500 mt-2 text-sm font-medium">アカウントにサインインしてください</p>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50/80 border border-red-100 rounded-xl animate-fade-in text-red-700">
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">
                                社員番号
                            </label>
                            <input
                                type="text"
                                value={form.employeeNumber}
                                onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
                                placeholder="000001"
                                required
                                className="input-premium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">
                                パスワード
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="••••••••"
                                required
                                className="input-premium"
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-4 btn-primary-premium text-base"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        サインイン中...
                                    </span>
                                ) : 'サインイン'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-zinc-400 text-xs font-medium">
                        © {new Date().getFullYear()} KIZUNA — とりせん労働組合連絡システム
                    </div>
                </div>
            </div>
        </div>
    );
}
