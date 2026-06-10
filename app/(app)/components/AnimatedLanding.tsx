'use client';

import Link from 'next/link';
import { TrendingUp, Shield, BarChart3, FileUp, CheckCircle2, ArrowRight, ArrowUpRight, Leaf, Globe, Package, Moon, Sun } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

type AnimatedLandingProps = {
    session: any;
};

const TICKER_ITEMS = [
    "Real-time Stock Updates",
    "CSV Bulk Import",
    "Role-Based Access Control",
    "Low Stock Alerts",
    "Multi-Region Tracking",
    "Export to CSV",
    "Transaction History",
    "Analytics Dashboard",
];

function Ticker({ isDark }: { isDark: boolean }) {
    return (
        <div className={`overflow-hidden border-b ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-stone-100'} py-2.5`}>
            <motion.div
                className="flex gap-12 whitespace-nowrap"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            >
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                    <span key={i} className={`flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        <span className="w-1 h-1 rounded-full bg-emerald-600 shrink-0" />
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started) {
                setStarted(true);
                let start = 0;
                const duration = 1600;
                const step = (timestamp: number) => {
                    if (!start) start = timestamp;
                    const progress = Math.min((timestamp - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setCount(Math.floor(eased * target));
                    if (progress < 1) requestAnimationFrame(step);
                    else setCount(target);
                };
                requestAnimationFrame(step);
            }
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, started]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function TerrainBg() {
    return (
        <svg
            className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
            viewBox="0 0 1200 600"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
        >
            {[0, 55, 110, 165, 220].map((offset, i) => (
                <path
                    key={i}
                    d={`M0,${280 + offset} Q200,${160 + offset} 400,${240 + offset} Q600,${320 + offset} 800,${180 + offset} Q1000,${100 + offset} 1200,${260 + offset} L1200,700 L0,700 Z`}
                    fill="#166534"
                    opacity={0.35 - i * 0.05}
                />
            ))}
        </svg>
    );
}

const features = [
    { icon: FileUp,       tag: "Import",      title: "Bulk CSV Upload",   description: "Smart validation processes thousands of records in seconds with granular error reporting." },
    { icon: BarChart3,    tag: "Analytics",   title: "Live Dashboard",    description: "KPIs, stock alerts, and inventory value visualized in real-time as transactions land." },
    { icon: TrendingUp,   tag: "Reporting",   title: "Deep Filtering",    description: "Slice by date, type, region, product. Export any filtered view directly to CSV." },
    { icon: Shield,       tag: "Security",    title: "Role Permissions",  description: "Admin, Manager, Analyst. Fine-grained control over who reads vs. who modifies." },
    { icon: Package,      tag: "Catalog",     title: "Stock Management",  description: "Quantities, reorder points, unit costs. Search your entire catalog instantly." },
    { icon: CheckCircle2, tag: "Reliability", title: "Error Recovery",    description: "Downloadable error reports let you fix and retry imports without starting over." },
];

export default function AnimatedLanding({ session }: AnimatedLandingProps) {
    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
    const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
    const [isDark, setIsDark] = useState(false);

    // Load dark mode preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('agri-dark-mode');
        if (saved !== null) {
            setIsDark(saved === 'true');
        }
    }, []);

    // Save dark mode preference
    const toggleDarkMode = () => {
        const newMode = !isDark;
        setIsDark(newMode);
        localStorage.setItem('agri-dark-mode', String(newMode));
    };

    return (
        <div
            className={`min-h-screen ${isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#fafaf9] text-stone-800'} overflow-x-hidden transition-colors duration-300`}
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* ─── NAV ─────────────────────────────────────────── */}
            <motion.nav
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`sticky top-0 z-50 border-b ${isDark ? 'border-stone-800 bg-stone-950/90' : 'border-stone-200 bg-[#fafaf9]/90'} backdrop-blur-md`}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-emerald-600 rounded-md grid place-items-center shrink-0">
                            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
                        </div>
                        <span className={`text-sm font-semibold ${isDark ? 'text-stone-100' : 'text-stone-800'} tracking-tight`}>
                            Rwanda <span className="text-emerald-600">AgriHub</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={`hidden md:block text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                            Inventory for agri-distributors
                        </span>
                        
                        {/* Dark Mode Toggle */}
                        <motion.button
                            onClick={toggleDarkMode}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-2 rounded-lg ${isDark ? 'bg-stone-900 text-stone-400 hover:text-stone-200' : 'bg-stone-100 text-stone-600 hover:text-stone-800'} transition-colors`}
                            aria-label="Toggle dark mode"
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </motion.button>

                        {!session ? (
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                                >
                                    Sign In <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Link
                                    href="/dashboard"
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                                >
                                    Dashboard <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* ─── TICKER ──────────────────────────────────────── */}
            <Ticker isDark={isDark} />

            {/* ─── HERO ────────────────────────────────────────── */}
            <motion.section
                ref={heroRef}
                style={{ y: heroY, opacity: heroOpacity }}
                className={`relative min-h-[88vh] flex flex-col justify-center overflow-hidden ${isDark ? 'bg-stone-950' : 'bg-[#fafaf9]'}`}
            >
                <TerrainBg />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-125 rounded-full ${isDark ? 'bg-emerald-950/40' : 'bg-emerald-100/60'} blur-[120px] pointer-events-none`} />

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
                    <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-end">

                        {/* Left */}
                        <div className="pt-16 pb-12">
                            <motion.div
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className="flex items-center gap-2 mb-8"
                            >
                                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-xs font-mono uppercase tracking-widest text-emerald-600">
                                    Rwanda · Agri-Input Distribution
                                </span>
                            </motion.div>

                            <div className="space-y-1 mb-8">
                                {["Smarter", "Supply", "Chain."].map((word, wi) => (
                                    <div key={wi} className="overflow-hidden">
                                        <motion.h1
                                            initial={{ y: '110%' }}
                                            animate={{ y: '0%' }}
                                            transition={{ delay: 0.2 + wi * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                                            className={`text-7xl lg:text-9xl font-black leading-none tracking-tighter ${wi === 2 ? 'text-emerald-600' : isDark ? 'text-stone-100' : 'text-stone-900'}`}
                                            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                                        >
                                            {word}
                                        </motion.h1>
                                    </div>
                                ))}
                            </div>

                            <motion.p
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                                className={`text-base ${isDark ? 'text-stone-400' : 'text-stone-600'} max-w-md leading-relaxed mb-10`}
                            >
                                Modern inventory management for agri-input distributors across Rwanda.
                                Track stock, manage transactions, and act on data — not guesses.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.5 }}
                                className="flex flex-wrap gap-3"
                            >
                                {!session ? (
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                        <Link
                                            href="/login"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                                        >
                                            Get Started <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </motion.div>
                                ) : (
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                        <Link
                                            href="/dashboard"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
                                        >
                                            Open Dashboard <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>

                        {/* Right — Dashboard preview card (Desktop) */}
                        <motion.div
                            initial={{ opacity: 0, x: 32 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="hidden lg:block pb-12 w-64"
                        >
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} border rounded-2xl p-5 shadow-xl space-y-4`}
                            >
                                <div className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                    Dashboard preview
                                </div>

                                {[
                                    { label: 'Fulfillment Rate', value: '94%', color: 'text-emerald-600' },
                                    { label: 'Low Stock Items',  value: '12',  color: 'text-amber-500'  },
                                    { label: 'Stockouts',        value: '3',   color: 'text-rose-500'   },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{label}</span>
                                        <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
                                    </div>
                                ))}

                                <div className={`border-t ${isDark ? 'border-stone-800' : 'border-stone-100'} pt-3 space-y-2`}>
                                    <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>Weekly trend</div>
                                    <div className="flex items-end gap-1.5 h-10">
                                        {[58, 72, 65, 88, 79, 94, 82].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ delay: 0.6 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
                                                className="flex-1 bg-emerald-600/70 rounded-sm"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Mobile Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="lg:hidden mt-10"
                    >
                        <div className={`text-[9px] font-mono uppercase tracking-widest ${isDark ? 'text-stone-600' : 'text-stone-400'} mb-3`}>Dashboard preview</div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Fulfillment', value: '94%', color: 'text-emerald-600' },
                                { label: 'Low Stock',   value: '12',  color: 'text-amber-500'  },
                                { label: 'Stockouts',   value: '3',   color: 'text-rose-500'   },
                            ].map(({ label, value, color }) => (
                                <div key={label} className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} border rounded-xl p-3 text-center`}>
                                    <div className={`text-lg font-black tabular-nums ${color}`}>{value}</div>
                                    <div className={`${isDark ? 'text-stone-500' : 'text-stone-400'} text-[10px] mt-0.5`}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Trust strip */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                        className={`border-t ${isDark ? 'border-stone-800' : 'border-stone-200'} pt-8 pb-16 flex flex-wrap items-center gap-8 text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}
                    >
                        {['No setup fees', '3 user roles', 'Export anytime'].map((item, i) => (
                            <span key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {item}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </motion.section>

            {/* ─── STATS ───────────────────────────────────────── */}
            <section className={`border-y ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`}>
                <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { n: 3,    suf: '',  label: 'User roles' },
                        { n: 2000, suf: '+', label: 'Rows per import' },
                        { n: 12,   suf: '',  label: 'Weeks of trend data' },
                        { n: 100,  suf: '%', label: 'Import validation' },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.07, duration: 0.45 }}
                        >
                            <div className="text-4xl font-black text-emerald-600 tracking-tight tabular-nums">
                                <Counter target={s.n} suffix={s.suf} />
                            </div>
                            <div className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'} mt-1 uppercase tracking-widest`}>{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── FEATURES ────────────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-14 flex items-end justify-between flex-wrap gap-4"
                >
                    <div>
                        <p className="text-xs font-mono uppercase tracking-widest text-emerald-600 mb-3">Platform features</p>
                        <h2
                            className={`text-4xl lg:text-5xl font-black ${isDark ? 'text-stone-100' : 'text-stone-900'} tracking-tight leading-tight max-w-lg`}
                            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                        >
                            Built for the way distributors actually work.
                        </h2>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'} max-w-xs leading-relaxed`}>
                        Every feature was designed around real workflows in Rwanda's agricultural supply chain.
                    </p>
                </motion.div>

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px ${isDark ? 'bg-stone-800 border-stone-800' : 'bg-stone-200 border-stone-200'} border rounded-2xl overflow-hidden`}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06, duration: 0.4 }}
                            onHoverStart={() => setHoveredFeature(i)}
                            onHoverEnd={() => setHoveredFeature(null)}
                            className={`relative ${isDark ? 'bg-stone-900 hover:bg-stone-850' : 'bg-white hover:bg-stone-50'} p-8 cursor-default transition-colors duration-200`}
                        >
                            <motion.div
                                className="absolute top-0 left-0 h-0.5 bg-emerald-600"
                                initial={{ width: 0 }}
                                animate={{ width: hoveredFeature === i ? '100%' : '0%' }}
                                transition={{ duration: 0.25 }}
                            />

                            <div className="flex items-start justify-between mb-5">
                                <div className="w-9 h-9 rounded-lg bg-emerald-600/10 border border-emerald-600/20 grid place-items-center">
                                    <f.icon className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? 'text-stone-500 border-stone-700' : 'text-stone-400 border-stone-200'} border px-2 py-1 rounded-full`}>
                                    {f.tag}
                                </span>
                            </div>

                            <h3 className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'} mb-2`}>{f.title}</h3>
                            <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'} leading-relaxed`}>{f.description}</p>

                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── HOW IT WORKS ────────────────────────────────── */}
            <section className={`border-y ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'} py-24`}>
                <div className="max-w-7xl mx-auto px-6">
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-xs font-mono uppercase tracking-widest text-emerald-600 mb-12"
                    >
                        How it works
                    </motion.p>

                    <div className="grid md:grid-cols-3 gap-10">
                        {[
                            { n: '01', title: 'Import your data',  body: 'Upload existing stock and transaction history via CSV. The validator catches every mismatch before it lands.' },
                            { n: '02', title: 'Assign your team',  body: 'Set up Admin, Manager, and Analyst roles. Control read/write access per user with no code required.' },
                            { n: '03', title: 'Act on insights',   body: 'Monitor your dashboard for real-time alerts, filter by region or product, and export reports instantly.' },
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.45 }}
                                className="relative"
                            >
                                <div
                                    className={`text-5xl font-black ${isDark ? 'text-stone-800' : 'text-stone-100'} mb-4 tabular-nums tracking-tighter select-none`}
                                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                                >
                                    {step.n}
                                </div>
                                <h3 className={`text-base font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'} mb-2`}>{step.title}</h3>
                                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'} leading-relaxed`}>{step.body}</p>
                                {i < 2 && (
                                    <div className={`hidden md:block absolute top-8 right-0 translate-x-1/2 ${isDark ? 'text-stone-700' : 'text-stone-300'}`}>
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─────────────────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative bg-emerald-600 rounded-3xl p-12 lg:p-20 overflow-hidden shadow-2xl shadow-emerald-600/20"
                >
                    <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
                        {[0, 40, 80, 120, 160].map((o, i) => (
                            <path key={i}
                                d={`M0,${200 + o} Q300,${120 + o} 600,${180 + o} Q900,${240 + o} 1200,${160 + o}`}
                                fill="none" stroke="white" strokeWidth="1" opacity={0.4 - i * 0.07}
                            />
                        ))}
                    </svg>

                    <div className="relative z-10 max-w-2xl">
                        <p className="text-xs font-mono uppercase tracking-widest text-emerald-200 mb-4">Ready to begin</p>
                        <h2
                            className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-5"
                            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                        >
                            Optimize your supply chain today.
                        </h2>
                        <p className="text-sm text-emerald-100 mb-10 max-w-md leading-relaxed">
                            Track every stock movement, surface low stock before it becomes a stockout, and give your team the right level of access — no spreadsheets required.
                        </p>

                        {!session ? (
                            <div className="flex flex-wrap gap-3">
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold text-sm hover:bg-stone-50 transition-colors shadow-lg"
                                    >
                                        Get Started Now <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                                <motion.a
                                    href="https://github.com/Zolender/rwanda-agri-hub"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-emerald-400 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-colors"
                                >
                                    View on GitHub <ArrowUpRight className="w-4 h-4" />
                                </motion.a>
                            </div>
                        ) : (
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold text-sm hover:bg-stone-50 transition-colors"
                                >
                                    Open Dashboard <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </section>

            {/* ─── FOOTER ──────────────────────────────────────── */}
            <footer className={`border-t ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'} py-10`}>
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 bg-emerald-600 rounded-md grid place-items-center shrink-0">
                            <Leaf className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                        </div>
                        <span className={`text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                            Rwanda <span className="text-emerald-600">AgriHub</span>
                        </span>
                    </div>
                    <div className={`flex items-center gap-5 text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        <span>© 2026 Rwanda AgriHub</span>
                        <span className={`w-px h-3 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />
                        <motion.a
                            href="https://github.com/Zolender/rwanda-agri-hub"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ color: '#059669' }}
                            className="hover:text-emerald-600 transition-colors"
                        >
                            GitHub
                        </motion.a>
                        <span className={`w-px h-3 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />
                        <span>Built by Zolender</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}