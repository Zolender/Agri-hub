import type { Metadata } from 'next';
import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import QuickAdd from "@/app/(app)/components/inventory/QuickAdd";

export const metadata: Metadata = { title: 'Add Stock | AgriHub' };
import QuickAddHeader from "../../components/inventory/QuickAddHeader";
export default async function QuickAddPage() {
    const session = await auth();

    // Hard server-side guard — redirect analysts away entirely
    if (!session) redirect("/login");
    if (session.user?.role === "ANALYST") redirect("/dashboard");

    const role = session.user?.role as 'ADMIN' | 'MANAGER';

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <QuickAddHeader role={role} />

            <QuickAdd />

            <p className="text-xs text-stone-400 text-center">
                This creates a <strong>Purchase</strong> transaction and increments the product&apos;s stock level.
                Only Managers and Admins can perform this action.
            </p>
        </div>
    );
}