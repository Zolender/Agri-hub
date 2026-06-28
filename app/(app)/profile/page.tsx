import type { Metadata } from 'next';
import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/db";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = { title: 'My Profile | AgriHub' };

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, role: true, createdAt: true },
    });

    if (!user) redirect("/login");

    return (
        <div className="space-y-6 max-w-2xl">
            <ProfileForm user={user} />
        </div>
    );
}