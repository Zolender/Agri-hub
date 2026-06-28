import type { Metadata } from 'next';
import QuickSale from "@/app/(app)/components/inventory/QuickSale";
import SalePageHeader, { SalePageSidebar } from "../../components/inventory/SalePageHeader";

export const metadata: Metadata = { title: 'Record Sale | AgriHub' };
export default function SalePage() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            <SalePageHeader />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <QuickSale />
                </div>

                <SalePageSidebar />
            </div>
        </div>
    );
}