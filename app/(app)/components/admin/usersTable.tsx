"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Pencil, Trash2, ShieldCheck, Users } from "lucide-react";
import { useDarkMode } from "@/app/(app)/components/DarkModeContext";
import { deleteUserAction } from "@/app/lib/actions/admin";
import DangerModal from "@/app/(app)/components/DangerModal";
import EditRoleModal from "./EditRoleModal";
import CreateUserModal from "./CreateUserModal";

// ── Types ──────────────────────────────────────────────────────────────────────

type UserRole = "ADMIN" | "MANAGER" | "ANALYST";

type User = {
    id: string;
    name: string | null;
    email: string | null;
    role: UserRole;
    // emailVerified removed — not meaningful for credentials-based users
};

type UsersTableProps = {
    users: User[];
    currentUserId: string;
};

// ── Role badge colours ─────────────────────────────────────────────────────────

const roleBadge: Record<UserRole, string> = {
    ADMIN:   "bg-rose-100 text-rose-700",
    MANAGER: "bg-amber-100 text-amber-700",
    ANALYST: "bg-sky-100 text-sky-700",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
    const { isDark } = useDarkMode();

    const [showCreate, setShowCreate]       = useState(false);
    const [editTarget, setEditTarget]       = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget]   = useState<User | null>(null);

    const [isPending, startTransition]      = useTransition();
    const [deleteError, setDeleteError]     = useState<string | null>(null);

    function handleDelete() {
        if (!deleteTarget) return;
        setDeleteError(null);

        startTransition(async () => {
            const result = await deleteUserAction(deleteTarget.id);
            if (result.success) {
                setDeleteTarget(null);
            } else {
                setDeleteError(result.error ?? "Something went wrong.");
            }
        });
    }

    return (
        <>
            {/* ── Modals ────────────────────────────────────────────────────── */}
            <CreateUserModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
            />
            <EditRoleModal
                user={editTarget}
                onClose={() => setEditTarget(null)}
            />
            <DangerModal
                isOpen={!!deleteTarget}
                isDark={isDark}
                title={`Delete ${deleteTarget?.name ?? "user"}?`}
                description={`This will permanently delete ${deleteTarget?.email}. This action cannot be undone.`}
                confirmWord="DELETE"
                confirmLabel="Delete User"
                isLoading={isPending}
                onConfirm={handleDelete}
                onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
            />

            {/* ── Main card ─────────────────────────────────────────────────── */}
            <div className={`rounded-2xl border shadow-sm ${isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"}`}>

                {/* Header row */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-stone-800" : "border-stone-200"}`}>
                    <div className="flex items-center gap-2">
                        <Users className={`w-5 h-5 ${isDark ? "text-stone-400" : "text-stone-500"}`} />
                        <span className={`text-sm font-semibold ${isDark ? "text-stone-300" : "text-stone-700"}`}>
                            {users.length} {users.length === 1 ? "user" : "users"}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        New User
                    </button>
                </div>

                {/* Delete error banner */}
                <AnimatePresence>
                    {deleteError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-6 py-3 bg-red-50 text-red-700 text-sm font-medium border-b border-red-100"
                        >
                            {deleteError}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`border-b text-xs font-semibold uppercase tracking-wider ${isDark ? "bg-stone-800/50 border-stone-700 text-stone-400" : "bg-stone-50 border-stone-200 text-stone-500"}`}>
                            <tr>
                                <th className="px-6 py-3 text-left">Name</th>
                                <th className="px-6 py-3 text-left">Email</th>
                                <th className="px-6 py-3 text-left">Role</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                                {/* Verified column removed */}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? "divide-stone-800" : "divide-stone-100"}`}>
                            {users.map((user) => {
                                const isSelf = user.id === currentUserId;
                                return (
                                    <tr
                                        key={user.id}
                                        className={`transition-colors ${isDark ? "hover:bg-stone-800/50" : "hover:bg-stone-50"}`}
                                    >
                                        {/* Name */}
                                        <td className={`px-6 py-4 text-sm font-medium ${isDark ? "text-stone-200" : "text-stone-800"}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDark ? "bg-stone-700 text-stone-300" : "bg-stone-200 text-stone-600"}`}>
                                                    {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                                                </div>
                                                <span>
                                                    {user.name ?? "—"}
                                                    {isSelf && (
                                                        <span className="ml-2 text-xs font-normal text-stone-400">(you)</span>
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className={`px-6 py-4 text-sm ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                                            {user.email ?? "—"}
                                        </td>

                                        {/* Role badge */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge[user.role]}`}>
                                                <ShieldCheck className="w-3 h-3" />
                                                {user.role}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditTarget(user)}
                                                    disabled={isSelf}
                                                    title={isSelf ? "Cannot edit your own role" : "Edit role"}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        isSelf
                                                            ? "opacity-30 cursor-not-allowed"
                                                            : isDark
                                                            ? "hover:bg-stone-700 text-stone-400 hover:text-stone-200"
                                                            : "hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                                                    }`}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => setDeleteTarget(user)}
                                                    disabled={isSelf}
                                                    title={isSelf ? "Cannot delete yourself" : "Delete user"}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        isSelf
                                                            ? "opacity-30 cursor-not-allowed"
                                                            : isDark
                                                            ? "hover:bg-rose-900/50 text-stone-400 hover:text-rose-400"
                                                            : "hover:bg-rose-50 text-stone-400 hover:text-rose-600"
                                                    }`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div className={`py-16 text-center text-sm ${isDark ? "text-stone-500" : "text-stone-400"}`}>
                            No users found. Create one above.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}