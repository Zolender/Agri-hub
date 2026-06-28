import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import AdjustmentForm from "@/app/(app)/components/inventory/AdjustmentForm";
import AdjustmentPageHeader from "@/app/(app)/components/inventory/AdjustmentPageHeader";

export default async function AdjustmentPage() {
    const session = await auth();

    if (!session) redirect("/login");
    if (session.user?.role === "ANALYST") redirect("/dashboard");

    const role = session.user?.role as 'ADMIN' | 'MANAGER';

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <AdjustmentPageHeader role={role} />

            <AdjustmentForm />

            <p className="text-xs text-stone-400 text-center">
                This creates an <strong>Adjustment</strong> transaction and updates the product&apos;s stock level.
                Only Managers and Admins can perform this action.
            </p>
        </div>
    );
}
