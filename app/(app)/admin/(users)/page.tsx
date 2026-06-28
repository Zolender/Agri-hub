import type { Metadata } from 'next';
import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/db";
import AdminPageHeader from "@/app/(app)/components/admin/AdminPageHeader";

export const metadata: Metadata = { title: 'Users | AgriHub' };
import UsersTable from "../../components/admin/usersTable";

export default async function AdminUsersPage() {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
        orderBy: { name: "asc" },
    });

    const currentUserId = session.user?.id ?? "";

    return (
        <div className="space-y-0">
            <AdminPageHeader
                title="User Management"
                description="Create, edit roles, and remove users. Changes take effect immediately."
            />

            <UsersTable users={users} currentUserId={currentUserId} />
        </div>
    );
}