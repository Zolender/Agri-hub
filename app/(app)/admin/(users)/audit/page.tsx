import type { Metadata } from 'next';
import prisma from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: 'Audit Log | AgriHub' };
import AuditLogTable from "./AuditLogTable";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ page?: string }>;

export default async function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") redirect("/dashboard");

    // Next.js 15 — searchParams is async, must be awaited
    const { page: pageParam } = await searchParams;
    const page = Math.max(1, parseInt(pageParam ?? "1", 10));
    const skip = (page - 1) * PAGE_SIZE;

    // Run both queries in parallel — count + page of data
    const [logs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: PAGE_SIZE,
            skip,
        }),
        prisma.auditLog.count(),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <AuditLogTable
                logs={logs}
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
            />
        </div>
    );
}