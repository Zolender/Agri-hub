"use server";

import prisma from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { checkPasswordStrength } from "@/app/lib/utils/password";
import { logAction } from "@/app/lib/utils/audit";
import { AuditAction } from "@/app/generated/prisma/enums";

async function requireAdmin() {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Only ADMINs can manage users.");
    }
    return session;
}

export async function createUserAction(data: {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "MANAGER" | "ANALYST";
}) {
    const session = await requireAdmin();

    if (!data.email || !data.password || !data.name) {
        return { success: false, error: "Name, email and password are required." };
    }

    const { errors } = checkPasswordStrength(data.password);
    if (errors.length > 0) {
        return { success: false, error: `Weak password: ${errors[0]}` };
    }

    try {
        const hashedPassword = await bcrypt.hash(data.password, 12);

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
            },
        });

        await logAction({
            userId:     session.user?.id,
            userEmail:  session.user?.email,
            userRole:   session.user?.role,
            action:     AuditAction.CREATE_USER,
            targetId:   newUser.id,
            targetType: "User",
            detail:     `Created user ${data.email} with role ${data.role}`,
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error: any) {
        if (error.code === "P2002") {
            return { success: false, error: "A user with that email already exists." };
        }
        console.error('[createUserAction]:', error);
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
}

export async function updateUserRoleAction(
    userId: string,
    newRole: "ADMIN" | "MANAGER" | "ANALYST"
) {
    const session = await requireAdmin();

    if (session.user?.id === userId) {
        return { success: false, error: "You cannot change your own role." };
    }

    try {
        // Fetch old role before updating so we can log the change
        const existing = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, role: true },
        });

        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        await logAction({
            userId:     session.user?.id,
            userEmail:  session.user?.email,
            userRole:   session.user?.role,
            action:     AuditAction.UPDATE_ROLE,
            targetId:   userId,
            targetType: "User",
            detail:     `Changed role of ${existing?.email} from ${existing?.role} to ${newRole}`,
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error('[updateUserRoleAction]:', error);
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
}

export async function deleteUserAction(userId: string) {
    const session = await requireAdmin();

    if (session.user?.id === userId) {
        return { success: false, error: "You cannot delete your own account." };
    }

    try {
        // Fetch user details before deleting — after deletion they're gone
        const existing = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, role: true },
        });

        await prisma.user.delete({ where: { id: userId } });

        await logAction({
            userId:     session.user?.id,
            userEmail:  session.user?.email,
            userRole:   session.user?.role,
            action:     AuditAction.DELETE_USER,
            targetId:   userId,
            targetType: "User",
            detail:     `Deleted user ${existing?.email} (was ${existing?.role})`,
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error('[deleteUserAction]:', error);
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
}