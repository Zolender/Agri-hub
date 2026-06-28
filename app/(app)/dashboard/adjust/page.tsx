import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import AdjustmentForm from "@/app/(app)/components/inventory/AdjustmentForm";
import { SlidersHorizontal } from "lucide-react";

export default async function AdjustmentPage() {
    const session = await auth();

    if (!session) redirect("/login");
    if (session.user?.role === "ANALYST") redirect("/dashboard");

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <SlidersHorizontal className="w-6 h-6 text-amber-600" />
                    <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
                        Stock Adjustment
                    </h1>
                </div>
                <p className="text-sm text-stone-500 ml-9">
                    Correct stock levels for breakage, spoilage, counting errors, or returns.
                    Every adjustment is logged to the audit trail.
                </p>
            </div>

            <AdjustmentForm />

            <p className="text-xs text-stone-400 text-center">
                This creates an <strong>Adjustment</strong> transaction and updates the product&apos;s stock level.
                Only Managers and Admins can perform this action.
            </p>
        </div>
    );
}
