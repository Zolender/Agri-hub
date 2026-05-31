"use client";

import { ChevronDown, ChevronsUpDown, ChevronUp, Search, Package } from "lucide-react";
import { useState, useMemo } from "react";
import { useDarkMode } from "@/app/(app)/components/DarkModeContext";
import ProductDetailModal from "@/app/(app)/components/dashboard/ProductDetailModal";

type Product = {
    id: string;
    categoryId: string;
    unitOfMeasure: string;
    unitCostRwf: number;
    sellingPriceRwf: number;
    landedCostRwf: number;
    quantity: number;
    reorderPointUnits: number;
    leadTimeBufferDays?: number;
    coverageDays: number | null;
};

type UserRole = 'ADMIN' | 'MANAGER' | 'ANALYST';
type SortField = keyof Product;
type SortDirection = "asc" | "desc";

const coverageDaysColor = (days: number | null, isDark: boolean) => {
    if (days === null) return isDark ? 'text-stone-600 italic' : 'text-stone-400 italic';
    if (days < 7)  return 'text-red-500 font-semibold';
    if (days < 14) return 'text-amber-500 font-semibold';
    return isDark ? 'text-stone-200' : 'text-stone-900';
};

const marginColor = (margin: number, isDark: boolean) => {
    if (margin < 0)  return 'text-red-500 font-semibold';
    if (margin < 10) return 'text-amber-500';
    return isDark ? 'text-emerald-400' : 'text-emerald-600';
};

const StockOnHandTable = ({
    products,
    userRole,
}: {
    products: Product[];
    userRole: UserRole;
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("id");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const { isDark } = useDarkMode();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const filteredAndSorted = useMemo(() => {
        let result = products;
        if (searchTerm) {
            result = result.filter(p =>
                p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.categoryId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        result = [...result].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];

            // Nulls always sort to the bottom regardless of direction
            if (aVal === null && bVal === null) return 0;
            if (aVal === null) return 1;
            if (bVal === null) return -1;

            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortDirection === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            if (typeof aVal === "number" && typeof bVal === "number") {
                return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
        return result;
    }, [products, searchTerm, sortDirection, sortField]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <ChevronsUpDown className={`w-4 h-4 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />;
        }
        return sortDirection === "asc"
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />;
    };

    const columns: { label: string; field: SortField | null; right?: boolean }[] = [
        { label: "Product ID",       field: "id" },
        { label: "Category",         field: "categoryId" },
        { label: "Stock Level",      field: "quantity" },
        { label: "Coverage Days",    field: "coverageDays" },
        { label: "Reorder Point",    field: "reorderPointUnits" },
        { label: "Status",           field: null },
        { label: "Landed Cost (RWF)", field: "landedCostRwf", right: true },
        { label: "Margin %",         field: null, right: true },
    ];

    if (products.length === 0) {
        return (
            <div className={`rounded-lg shadow p-12 text-center ${isDark ? 'bg-stone-900' : 'bg-white'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-stone-800 text-stone-500' : 'bg-slate-100 text-slate-400'}`}>
                    <Package size={32} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-stone-200' : 'text-slate-800'}`}>
                    No Products Yet
                </h3>
                <p className={`mb-6 ${isDark ? 'text-stone-500' : 'text-slate-500'}`}>
                    Get started by importing your inventory data from a CSV file.
                </p>
                <a
                    href="/import"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Import Your First CSV
                </a>
            </div>
        );
    }

    return (
        <>
            <ProductDetailModal
                product={selectedProduct}
                userRole={userRole}
                onClose={() => setSelectedProduct(null)}
            />

            <div className={`rounded-lg shadow ${isDark ? 'bg-stone-900' : 'bg-white'}`}>
                {/* Search Bar */}
                <div className={`p-4 border-b ${isDark ? 'border-stone-700' : 'border-gray-200'}`}>
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-stone-500' : 'text-stone-700'}`} />
                        <input
                            type="text"
                            placeholder="Search by Product ID or Category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                                isDark
                                    ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500'
                                    : 'bg-white border-gray-300 text-stone-700 placeholder:text-stone-400'
                            }`}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`border-b ${isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-gray-50 border-gray-200'}`}>
                            <tr>
                                {columns.map(({ label, field, right }) => (
                                    <th
                                        key={label}
                                        onClick={() => field && handleSort(field)}
                                        className={`px-6 py-3 text-xs font-medium uppercase tracking-wider ${right ? 'text-right' : 'text-left'} ${field ? 'cursor-pointer' : ''} ${
                                            isDark
                                                ? `text-stone-400 ${field ? 'hover:bg-stone-800' : ''}`
                                                : `text-gray-500 ${field ? 'hover:bg-gray-100' : ''}`
                                        }`}
                                    >
                                        <div className={`flex items-center gap-2 ${right ? 'justify-end' : ''}`}>
                                            {label}
                                            {field && <SortIcon field={field} />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'bg-stone-900 divide-stone-700' : 'bg-white divide-gray-200'}`}>
                            {filteredAndSorted.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={`px-6 py-8 text-center ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSorted.map((product) => {
                                    const isLowStock = product.quantity <= product.reorderPointUnits;
                                    const margin = product.landedCostRwf > 0
                                        ? ((product.sellingPriceRwf - product.landedCostRwf) / product.sellingPriceRwf) * 100
                                        : null;

                                    return (
                                        <tr
                                            key={product.id}
                                            onClick={() => setSelectedProduct(product)}
                                            className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-stone-800' : 'hover:bg-gray-50'}`}
                                        >
                                            {/* Product ID */}
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-stone-200' : 'text-gray-900'}`}>
                                                {product.id}
                                            </td>

                                            {/* Category */}
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                                                {product.categoryId}
                                            </td>

                                            {/* Stock Level */}
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isDark ? 'text-stone-200' : 'text-gray-900'}`}>
                                                {product.quantity.toLocaleString()}
                                            </td>

                                            {/* Coverage Days */}
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${coverageDaysColor(product.coverageDays, isDark)}`}>
                                                {product.coverageDays !== null ? `${product.coverageDays}d` : 'N/A'}
                                            </td>

                                            {/* Reorder Point */}
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                                                {product.reorderPointUnits.toLocaleString()}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isLowStock ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>

                                            {/* Landed Cost */}
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDark ? 'text-stone-200' : 'text-gray-900'}`}>
                                                {product.landedCostRwf.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                            </td>

                                            {/* Margin % */}
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${margin !== null ? marginColor(margin, isDark) : (isDark ? 'text-stone-600' : 'text-stone-400')}`}>
                                                {margin !== null ? `${margin.toFixed(1)}%` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className={`px-6 py-3 border-t text-sm ${isDark ? 'bg-stone-800/50 border-stone-700 text-stone-500' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    Showing {filteredAndSorted.length} of {products.length} products
                </div>
            </div>
        </>
    );
};

export default StockOnHandTable;
