"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useDarkMode } from "@/app/(app)/components/DarkModeContext";
import { checkPasswordStrength } from "@/app/lib/utils/password";
import { changePasswordAction } from "@/app/lib/actions/profile";
import { format } from "date-fns";

type Props = {
    user: {
        name: string | null;
        email: string | null;
        role: string;
        createdAt: Date;
    };
};

const roleBadge: Record<string, string> = {
    ADMIN:   "bg-rose-100 text-rose-700",
    MANAGER: "bg-amber-100 text-amber-700",
    ANALYST: "bg-sky-100 text-sky-700",
};

const roleBadgeDark: Record<string, string> = {
    ADMIN:   "bg-rose-900/40 text-rose-400",
    MANAGER: "bg-amber-900/40 text-amber-400",
    ANALYST: "bg-sky-900/40 text-sky-400",
};

export default function ProfileForm({ user }: Props) {
    const { isDark } = useDarkMode();
    const [isPending, startTransition] = useTransition();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword]         = useState("");
    const [showCurrent, setShowCurrent]         = useState(false);
    const [showNew, setShowNew]                 = useState(false);
    const [result, setResult]                   = useState<{ success: boolean; error?: string } | null>(null);

    // Reuse the same strength checker from CreateUserModal
    const strength = checkPasswordStrength(newPassword);
    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500"];
    const strengthLabels = ["Too weak", "Weak", "Good", "Strong"];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);

        startTransition(async () => {
            const res = await changePasswordAction({ currentPassword, newPassword });
            setResult(res);
            if (res.success) {
                setCurrentPassword("");
                setNewPassword("");
            }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Page header */}
            <div className="flex flex-col gap-1">
                <p className={`text-xs font-mono uppercase tracking-widest ${
                    isDark ? "text-emerald-400" : "text-emerald-600"
                }`}>
                    Account
                </p>
                <h1
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                        isDark ? "text-stone-100" : "text-stone-900"
                    }`}
                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                    My Profile
                </h1>
            </div>

            {/* Account info card */}
            <div className={`rounded-2xl border p-6 space-y-4 ${
                isDark ? "bg-stone-900 border-stone-700" : "bg-white border-stone-200"
            }`}>
                <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDark ? "bg-stone-800" : "bg-stone-100"
                    }`}>
                        <User className={`w-4 h-4 ${isDark ? "text-stone-400" : "text-stone-500"}`} />
                    </div>
                    <h2 className={`text-sm font-bold uppercase tracking-wider ${
                        isDark ? "text-stone-400" : "text-stone-500"
                    }`}>
                        Account Info
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                            isDark ? "text-stone-500" : "text-stone-400"
                        }`}>Name</p>
                        <p className={`text-sm font-medium ${isDark ? "text-stone-200" : "text-stone-800"}`}>
                            {user.name ?? "—"}
                        </p>
                    </div>

                    {/* Email */}
                    <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                            isDark ? "text-stone-500" : "text-stone-400"
                        }`}>Email</p>
                        <p className={`text-sm font-medium ${isDark ? "text-stone-200" : "text-stone-800"}`}>
                            {user.email ?? "—"}
                        </p>
                    </div>

                    {/* Role */}
                    <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                            isDark ? "text-stone-500" : "text-stone-400"
                        }`}>Role</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            isDark ? roleBadgeDark[user.role] : roleBadge[user.role]
                        }`}>
                            {user.role}
                        </span>
                    </div>

                    {/* Member since */}
                    <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                            isDark ? "text-stone-500" : "text-stone-400"
                        }`}>Member since</p>
                        <p className={`text-sm font-medium ${isDark ? "text-stone-200" : "text-stone-800"}`}>
                            {format(user.createdAt, "MMM d, yyyy")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Change password card */}
            <div className={`rounded-2xl border p-6 ${
                isDark ? "bg-stone-900 border-stone-700" : "bg-white border-stone-200"
            }`}>
                <div className="flex items-center gap-3 mb-5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDark ? "bg-stone-800" : "bg-stone-100"
                    }`}>
                        <Lock className={`w-4 h-4 ${isDark ? "text-stone-400" : "text-stone-500"}`} />
                    </div>
                    <h2 className={`text-sm font-bold uppercase tracking-wider ${
                        isDark ? "text-stone-400" : "text-stone-500"
                    }`}>
                        Change Password
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Current password */}
                    <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                            isDark ? "text-stone-400" : "text-stone-600"
                        }`}>
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                                className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm transition-colors ${
                                    isDark
                                        ? "bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500 focus:border-emerald-500"
                                        : "bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-emerald-500"
                                } outline-none focus:ring-2 focus:ring-emerald-500/20`}
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(v => !v)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                                    isDark ? "text-stone-500 hover:text-stone-300" : "text-stone-400 hover:text-stone-600"
                                }`}
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* New password */}
                    <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                            isDark ? "text-stone-400" : "text-stone-600"
                        }`}>
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm transition-colors ${
                                    isDark
                                        ? "bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500 focus:border-emerald-500"
                                        : "bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-emerald-500"
                                } outline-none focus:ring-2 focus:ring-emerald-500/20`}
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(v => !v)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                                    isDark ? "text-stone-500 hover:text-stone-300" : "text-stone-400 hover:text-stone-600"
                                }`}
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Strength bar */}
                        {newPassword.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <div className="flex gap-1">
                                    {[0, 1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                i < strength.score
                                                    ? strengthColors[strength.score - 1]
                                                    : isDark ? "bg-stone-700" : "bg-stone-200"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-xs ${
                                    strength.score <= 1 ? "text-red-500" :
                                    strength.score === 2 ? "text-amber-500" : "text-emerald-500"
                                }`}>
                                    {strengthLabels[strength.score - 1] ?? "Too weak"}
                                    {strength.errors.length > 0 && ` — ${strength.errors[0]}`}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Result feedback */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                                result.success
                                    ? isDark ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                                    : isDark ? "bg-red-900/40 text-red-400"     : "bg-red-50 text-red-700"
                            }`}
                        >
                            {result.success
                                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                                : <AlertCircle className="w-4 h-4 shrink-0" />
                            }
                            {result.success ? "Password changed successfully!" : result.error}
                        </motion.div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isPending || strength.score < 3}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                    >
                        {isPending ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </motion.div>
    );
}