'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarNav from '../SideBarNav';
import { Leaf, Moon, Sun, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { DarkModeContext } from '../DarkModeContext';

export type Role = 'ADMIN' | 'MANAGER' | 'ANALYST';

export default function DashboardShell({
    children,
    session,
    role,
}: {
    children: React.ReactNode;
    session: any;
    role: Role;
}) {
    const [isDark, setIsDark]             = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed]   = useState(false);
    const pathname = usePathname();

    // Close mobile drawer on navigation
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    // Restore persisted preferences
    useEffect(() => {
        const savedDark      = localStorage.getItem('darkMode');
        const savedCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedDark      !== null) setIsDark(savedDark === 'true');
        if (savedCollapsed !== null) setIsCollapsed(savedCollapsed === 'true');
    }, []);

    const toggleDarkMode = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem('darkMode', String(next));
    };

    const toggleCollapsed = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem('sidebarCollapsed', String(next));
    };

    const sidebarBg = isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';

    return (
        <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
            <div
                className={`flex h-screen ${isDark ? 'bg-stone-950' : 'bg-[#fafaf9]'} transition-colors duration-300 overflow-hidden`}
                style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
            >
                {/* ── Mobile backdrop ─────────────────────────────────────── */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* ── Desktop sidebar ─────────────────────────────────────── */}
                <aside
                    style={{ width: isCollapsed ? 64 : 256 }}
                    className={`
                        hidden lg:flex flex-col h-screen shrink-0
                        border-r transition-[width] duration-300 ease-in-out overflow-hidden
                        ${sidebarBg}
                    `}
                >
                    {/* Logo + dark-mode toggle */}
                    <div className={`
                        shrink-0 border-b ${isDark ? 'border-stone-800' : 'border-stone-200'}
                        ${isCollapsed ? 'flex flex-col items-center gap-2 p-3' : 'flex items-center justify-between pl-5 pr-4 py-4'}
                    `}>
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 flex-1 min-w-0'}`}>
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                                className="w-9 h-9 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl grid place-items-center shrink-0 shadow-lg shadow-emerald-600/20"
                            >
                                <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </motion.div>

                            {!isCollapsed && (
                                <h2
                                    className={`text-lg font-black tracking-tight truncate ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
                                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                                >
                                    Agri<span className="text-emerald-600">Hub</span>
                                </h2>
                            )}
                        </div>

                        <motion.button
                            onClick={toggleDarkMode}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Toggle dark mode"
                            className={`p-2 rounded-lg transition-colors shrink-0 ${
                                isDark
                                    ? 'bg-stone-800 text-amber-400 hover:bg-stone-700'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            <motion.div
                                animate={{ rotate: isDark ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            </motion.div>
                        </motion.button>
                    </div>

                    {/* Nav (scrollable) */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <SidebarNav
                            isDark={isDark}
                            role={role}
                            isCollapsed={isCollapsed}
                            onToggle={toggleCollapsed}
                        />
                    </div>
                </aside>

                {/* ── Mobile sidebar (overlay drawer) ─────────────────────── */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className={`fixed z-50 h-screen w-64 border-r flex flex-col lg:hidden ${sidebarBg}`}
                        >
                            <div className={`shrink-0 p-5 border-b ${isDark ? 'border-stone-800' : 'border-stone-200'} flex items-center justify-between gap-3`}>
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <div className="w-9 h-9 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl grid place-items-center shrink-0 shadow-lg shadow-emerald-600/20">
                                        <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <h2
                                        className={`text-lg font-black tracking-tight truncate ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
                                        style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                                    >
                                        Agri<span className="text-emerald-600">Hub</span>
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    aria-label="Close menu"
                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-100'}`}
                                >
                                    <X className={`w-5 h-5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {/* Mobile always shows expanded nav, no collapse toggle */}
                                <SidebarNav
                                    isDark={isDark}
                                    role={role}
                                    isCollapsed={false}
                                    onToggle={() => {}}
                                />
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ── Main content area ───────────────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                    {/* Mobile top bar */}
                    <motion.header
                        initial={{ y: -100 }}
                        animate={{ y: 0 }}
                        className={`
                            lg:hidden sticky top-0 z-30 border-b px-4 py-3
                            flex items-center justify-between
                            ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}
                        `}
                    >
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open menu"
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-100 text-stone-600'}`}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-lg grid place-items-center">
                                <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </div>
                            <span className={`text-base font-black ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                                AgriHub
                            </span>
                        </div>

                        <motion.button
                            onClick={toggleDarkMode}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Toggle dark mode"
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-stone-800 text-amber-400' : 'hover:bg-stone-100 text-stone-600'}`}
                        >
                            <motion.div animate={{ rotate: isDark ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </motion.div>
                        </motion.button>
                    </motion.header>

                    <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            {children}
                        </motion.div>
                    </main>
                </div>
            </div>
        </DarkModeContext.Provider>
    );
}
