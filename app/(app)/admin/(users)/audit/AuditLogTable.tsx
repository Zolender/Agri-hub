"use client";

import { format } from "date-fns";
import { Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/app/(app)/components/DarkModeContext";

type AuditLog = {
    id: string;
    createdAt: Date;
    userEmail: string | null;
    userRole: string | null;
    action: string;
    targetType: string | null;
    detail: string | null;
};

type Props = {
    logs: AuditLog[];
    page: number;
    totalPages: number;
    totalCount: number;
};

const actionStyles: Record<string, { bg: string; darkBg: string; text: string; darkText: string; label: string }> = {
    CREATE_USER:     { bg: "bg-emerald-100", darkBg: "bg-emerald-900/40", text: "text-emerald-700", darkText: "text-emerald-400", label: "Create User"     },
    UPDATE_ROLE:     { bg: "bg-amber-100",   darkBg: "bg-amber-900/40",   text: "text-amber-700",   darkText: "text-amber-400",   label: "Update Role"     },
    DELETE_USER:     { bg: "bg-red-100",     darkBg: "bg-red-900/40",     text: "text-red-700",     darkText: "text-red-400",     label: "Delete User"     },
    UPDATE_PRODUCT:  { bg: "bg-blue-100",    darkBg: "bg-blue-900/40",    text: "text-blue-700",    darkText: "text-blue-400",    label: "Update Product"  },
    RECORD_SALE:     { bg: "bg-rose-100",    darkBg: "bg-rose-900/40",    text: "text-rose-700",    darkText: "text-rose-400",    label: "Sale"            },
    RECORD_PURCHASE:    { bg: "bg-sky-100",     darkBg: "bg-sky-900/40",     text: "text-sky-700",     darkText: "text-sky-400",     label: "Purchase"        },
    RECORD_ADJUSTMENT:  { bg: "bg-amber-100",  darkBg: "bg-amber-900/40",   text: "text-amber-700",  darkText: "text-amber-400",   label: "Adjustment"      },
    CHANGE_PASSWORD:    { bg: "bg-violet-100", darkBg: "bg-violet-900/40",  text: "text-violet-700", darkText: "text-violet-400",  label: "Change Password" },
};

export default function AuditLogTable({ logs, page, totalPages, totalCount }: Props) {
    const { isDark } = useDarkMode();
    const router = useRouter();

    const goToPage = (p: number) => {
        router.push(`/admin/audit?page=${p}`);
    };

    // e.g. "Showing 21–40 of 87 actions"
    const pageSize = 20;
    const from = (page - 1) * pageSize + 1;
    const to   = Math.min(page * pageSize, totalCount);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col gap-1">
                <p className={`text-xs font-mono uppercase tracking-widest ${
                    isDark ? "text-emerald-400" : "text-emerald-600"
                }`}>
                    Security
                </p>
                <h1
                    className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${
                        isDark ? "text-stone-100" : "text-stone-900"
                    }`}
                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                    Audit Log
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                    {totalCount === 0
                        ? "No actions recorded yet"
                        : `Showing ${from}–${to} of ${totalCount} action${totalCount !== 1 ? "s" : ""}`
                    }
                </p>
            </div>

            {/* Table card */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${
                isDark ? "bg-stone-900 border-stone-700" : "bg-white border-stone-200"
            }`}>
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            isDark ? "bg-stone-800" : "bg-stone-100"
                        }`}>
                            <Shield className={`w-8 h-8 ${isDark ? "text-stone-600" : "text-stone-400"}`} />
                        </div>
                        <div>
                            <p className={`text-lg font-semibold mb-1 ${isDark ? "text-stone-300" : "text-stone-900"}`}>
                                No activity yet
                            </p>
                            <p className={`text-sm ${isDark ? "text-stone-500" : "text-stone-500"}`}>
                                Actions will appear here as users interact with the system
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`border-b ${
                                    isDark ? "bg-stone-800/50 border-stone-700" : "bg-stone-50 border-stone-200"
                                }`}>
                                    <tr>
                                        {["Time", "User", "Role", "Action", "Target", "Detail"].map((h) => (
                                            <th
                                                key={h}
                                                className={`px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider ${
                                                    isDark ? "text-stone-400" : "text-stone-600"
                                                }`}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? "divide-stone-700/50" : "divide-stone-100"}`}>
                                    {logs.map((log, index) => {
                                        const style = actionStyles[log.action] ?? {
                                            bg: "bg-stone-100", darkBg: "bg-stone-800",
                                            text: "text-stone-700", darkText: "text-stone-400",
                                            label: log.action,
                                        };

                                        return (
                                            <motion.tr
                                                key={log.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.02 }}
                                                className={`transition-colors ${
                                                    isDark ? "hover:bg-stone-800" : "hover:bg-stone-50"
                                                }`}
                                            >
                                                {/* Time */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className={`text-sm font-medium ${isDark ? "text-stone-200" : "text-stone-800"}`}>
                                                        {format(log.createdAt, "MMM d, yyyy")}
                                                    </div>
                                                    <div className={`text-xs ${isDark ? "text-stone-500" : "text-stone-400"}`}>
                                                        {format(log.createdAt, "HH:mm:ss")}
                                                    </div>
                                                </td>

                                                {/* User */}
                                                <td className={`px-5 py-3.5 whitespace-nowrap text-sm ${
                                                    isDark ? "text-stone-300" : "text-stone-700"
                                                }`}>
                                                    {log.userEmail ?? "—"}
                                                </td>

                                                {/* Role */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className={`text-xs font-semibold uppercase tracking-wide ${
                                                        isDark ? "text-stone-400" : "text-stone-500"
                                                    }`}>
                                                        {log.userRole ?? "—"}
                                                    </span>
                                                </td>

                                                {/* Action badge */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        isDark
                                                            ? `${style.darkBg} ${style.darkText}`
                                                            : `${style.bg} ${style.text}`
                                                    }`}>
                                                        {style.label}
                                                    </span>
                                                </td>

                                                {/* Target */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className={`text-xs font-mono ${
                                                        isDark ? "text-stone-500" : "text-stone-400"
                                                    }`}>
                                                        {log.targetType ?? "—"}
                                                    </span>
                                                </td>

                                                {/* Detail */}
                                                <td className={`px-5 py-3.5 text-sm max-w-xs truncate ${
                                                    isDark ? "text-stone-400" : "text-stone-600"
                                                }`}>
                                                    {log.detail ?? "—"}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination controls ───────────────────────────── */}
                        {totalPages > 1 && (
                            <div className={`flex items-center justify-between px-5 py-4 border-t ${
                                isDark ? "border-stone-700" : "border-stone-200"
                            }`}>
                                {/* Page info */}
                                <span className={`text-xs font-medium ${
                                    isDark ? "text-stone-400" : "text-stone-500"
                                }`}>
                                    Page {page} of {totalPages}
                                </span>

                                {/* Prev / Next */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => goToPage(page - 1)}
                                        disabled={page <= 1}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                            isDark
                                                ? "border-stone-700 text-stone-300 hover:bg-stone-800 disabled:hover:bg-transparent"
                                                : "border-stone-200 text-stone-600 hover:bg-stone-100 disabled:hover:bg-transparent"
                                        }`}
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        Previous
                                    </button>

                                    <button
                                        onClick={() => goToPage(page + 1)}
                                        disabled={page >= totalPages}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                            isDark
                                                ? "border-stone-700 text-stone-300 hover:bg-stone-800 disabled:hover:bg-transparent"
                                                : "border-stone-200 text-stone-600 hover:bg-stone-100 disabled:hover:bg-transparent"
                                        }`}
                                    >
                                        Next
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}