"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus } from "lucide-react";
import { useDarkMode } from "@/app/(app)/components/DarkModeContext";
import { createUserAction } from "@/app/lib/actions/admin";
import { checkPasswordStrength } from "@/app/lib/utils/password";

type UserRole = "ADMIN" | "MANAGER" | "ANALYST";

type CreateUserModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

// ── Reusable field wrapper ─────────────────────────────────────────────────────
function Field({
    label, children, isDark,
}: {
    label: string; children: React.ReactNode; isDark: boolean;
}) {
    return (
        <div className="space-y-1">
            <label className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? "text-stone-400" : "text-stone-500"
            }`}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputClass = (isDark: boolean) =>
    `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500 ${
        isDark
            ? "bg-stone-800 border-stone-600 text-stone-100 placeholder:text-stone-500"
            : "bg-white border-stone-300 text-stone-800 placeholder:text-stone-400"
    }`;

// ── Strength bar colours ───────────────────────────────────────────────────────
// score 0 = all red, score 4 = all green
// We show 4 segments, each one lights up as score increases
const segmentColour = (score: number, index: number) => {
    // This segment is "active" if score is high enough to reach it
    if (index >= score) return "bg-stone-200 dark:bg-stone-700"; // inactive — grey
    if (score === 1)    return "bg-red-500";
    if (score === 2)    return "bg-orange-400";
    if (score === 3)    return "bg-yellow-400";
    return "bg-emerald-500"; // score 4 — all green
};

const strengthLabel = (score: number) => {
    if (score === 0) return "";
    if (score === 1) return "Weak";
    if (score === 2) return "Fair";
    if (score === 3) return "Good";
    return "Strong";
};

const strengthLabelColour = (score: number) => {
    if (score === 1) return "text-red-500";
    if (score === 2) return "text-orange-400";
    if (score === 3) return "text-yellow-500";
    if (score === 4) return "text-emerald-500";
    return "";
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
    const { isDark } = useDarkMode();

    const [name, setName]         = useState("");
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole]         = useState<UserRole>("ANALYST");

    const [error, setError]            = useState<string | null>(null);
    const [success, setSuccess]        = useState(false);
    const [isPending, startTransition] = useTransition();

    // Compute strength live as the user types — no extra state needed
    // checkPasswordStrength is a plain function (not async), safe to call on render
    const strength = password.length > 0
        ? checkPasswordStrength(password)
        : { score: 0, errors: [] };

    function handleClose() {
        setName(""); setEmail(""); setPassword("");
        setRole("ANALYST"); setError(null); setSuccess(false);
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // Client-side guard — don't even call the server if password is weak
        // This saves a round trip and gives instant feedback
        if (strength.score < 4) {
            setError(`Weak password: ${strength.errors[0]}`);
            return;
        }

        startTransition(async () => {
            const result = await createUserAction({ name, email, password, role });
            if (result.success) {
                setSuccess(true);
                setTimeout(handleClose, 1200);
            } else {
                setError(result.error ?? "Something went wrong.");
            }
        });
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-md rounded-2xl border shadow-2xl p-7 space-y-5 ${
                            isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
                        }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h2 className={`text-lg font-black tracking-tight ${
                                    isDark ? "text-stone-100" : "text-stone-900"
                                }`}>
                                    New User
                                </h2>
                            </div>
                            <button
                                onClick={handleClose}
                                aria-label="Close dialog"
                                className={`p-1.5 rounded-lg transition-colors ${
                                    isDark
                                        ? "hover:bg-stone-800 text-stone-400"
                                        : "hover:bg-stone-100 text-stone-500"
                                }`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field label="Full Name" isDark={isDark}>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Jean Claude Ndayishimiye"
                                    className={inputClass(isDark)}
                                />
                            </Field>

                            <Field label="Email" isDark={isDark}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="user@example.com"
                                    className={inputClass(isDark)}
                                />
                            </Field>

                            {/* Password field + strength bar */}
                            <Field label="Password" isDark={isDark}>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Min. 8 characters"
                                    className={inputClass(isDark)}
                                />

                                {/* Strength bar — only shows once user starts typing */}
                                {password.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 space-y-1.5"
                                    >
                                        {/* 4 coloured segments */}
                                        <div className="flex gap-1">
                                            {[0, 1, 2, 3].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                                        segmentColour(strength.score, i)
                                                    }`}
                                                />
                                            ))}
                                        </div>

                                        {/* Label + first failing rule */}
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-semibold ${
                                                strengthLabelColour(strength.score)
                                            }`}>
                                                {strengthLabel(strength.score)}
                                            </span>
                                            {strength.errors.length > 0 && (
                                                <span className={`text-xs ${
                                                    isDark ? "text-stone-500" : "text-stone-400"
                                                }`}>
                                                    {strength.errors[0]}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </Field>

                            <Field label="Role" isDark={isDark}>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className={inputClass(isDark)}
                                >
                                    <option value="ANALYST">ANALYST</option>
                                    <option value="MANAGER">MANAGER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </Field>

                            {/* Error banner */}
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm px-4 py-2.5 rounded-xl bg-red-50 text-red-700 font-medium"
                                >
                                    {error}
                                </motion.p>
                            )}

                            {/* Success banner */}
                            {success && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-medium"
                                >
                                    User created successfully!
                                </motion.p>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isPending}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                                        isDark
                                            ? "border-stone-700 text-stone-300 hover:bg-stone-800"
                                            : "border-stone-200 text-stone-600 hover:bg-stone-100"
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending || success}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isPending ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                        />
                                    ) : null}
                                    {isPending ? "Creating…" : "Create User"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}