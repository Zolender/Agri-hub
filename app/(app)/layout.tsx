import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "./components/dashboard/DashboardShell";
import { Role } from "./components/dashboard/DashboardShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <DashboardShell role={session.user?.role as Role ?? 'ANALYST'}>
            {children}
        </DashboardShell>
    );
}