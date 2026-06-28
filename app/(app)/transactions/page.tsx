import type { Metadata } from 'next';
import prisma from "@/app/lib/db";
import FiltersBar from "@/app/(app)/components/transactions/FiltersBar";

export const metadata: Metadata = { title: 'Transactions | AgriHub' };
import TransactionsTable from "@/app/(app)/components/transactions/TransactionsTable";
import TransactionsHeader from "../components/transactions/TransactionsHeader";


type SearchParams = {
    page?: string;
    movementType?: string;
    region?: string;
    productId?: string;
    from?: string;
    to?: string;
};

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    
    const page = parseInt(params.page || '1');
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (params.movementType) {
        where.movementType = params.movementType;
    }
    if (params.region) {
        where.region = { contains: params.region, mode: 'insensitive' };
    }
    if (params.productId) {
        where.productId = { contains: params.productId, mode: 'insensitive' };
    }
    if (params.from || params.to) {
        where.transactionDate = {};
        if (params.from) where.transactionDate.gte = new Date(params.from);
        if (params.to) {
            const toDate = new Date(params.to);
            toDate.setHours(23, 59, 59, 999);
            where.transactionDate.lte = toDate;
        }
    }

    const [transactions, totalCount] = await Promise.all([
        prisma.transaction.findMany({
            where,
            include: {
                product: { select: { id: true, categoryId: true, unitOfMeasure: true } }
            },
            orderBy: { transactionDate: 'desc' },
            take: pageSize,
            skip
        }),
        prisma.transaction.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const buildPaginationLink = (newPage: number) => {
        const urlParams = new URLSearchParams();
        if (params.movementType) urlParams.set('movementType', params.movementType);
        if (params.region) urlParams.set('region', params.region);
        if (params.productId) urlParams.set('productId', params.productId);
        if (params.from) urlParams.set('from', params.from);
        if (params.to) urlParams.set('to', params.to);
        urlParams.set('page', newPage.toString());
        return `/transactions?${urlParams.toString()}`;
    };

    const pageLinks = {
        previous: page > 1 ? buildPaginationLink(page - 1) : null,
        next: page < totalPages ? buildPaginationLink(page + 1) : null,
        pages: Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (page <= 3) pageNum = i + 1;
            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = page - 2 + i;
            return { number: pageNum, url: buildPaginationLink(pageNum), isActive: pageNum === page };
        })
    };

    return (
        <div className="space-y-6">
            <TransactionsHeader totalCount={totalCount} />

            <FiltersBar totalCount={totalCount} />

            <TransactionsTable
                transactions={transactions}
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageLinks={pageLinks}
            />
        </div>
    );
}