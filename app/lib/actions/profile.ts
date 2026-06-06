"use server";

import prisma from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { checkPasswordStrength } from "@/app/lib/utils/password";
import { logAction } from "@/app/lib/utils/audit";
import { AuditAction } from "@/app/generated/prisma/enums";

export async function changePasswordAction(data: {
    currentPassword: string;
    newPassword: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "You must be logged in." };
    }

    if (!data.currentPassword || !data.newPassword) {
        return { success: false, error: "Both fields are required." };
    }

    // Strength check on new password
    const { errors } = checkPasswordStrength(data.newPassword);
    if (errors.length > 0) {
        return { success: false, error: `Weak password: ${errors[0]}` };
    }

    // Can't reuse the same password
    if (data.currentPassword === data.newPassword) {
        return { success: false, error: "New password must be different from your current password." };
    }

    try {
        // Fetch the user's current hashed password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true, email: true },
        });

        if (!user?.password) {
            return { success: false, error: "Unable to verify your current password." };
        }

        // Verify current password
        const isValid = await bcrypt.compare(data.currentPassword, user.password);
        if (!isValid) {
            return { success: false, error: "Current password is incorrect." };
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(data.newPassword, 12);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        // Audit log
        await logAction({
            userId:     session.user.id,
            userEmail:  session.user.email,
            userRole:   session.user.role,
            action:     AuditAction.CHANGE_PASSWORD,
            targetId:   session.user.id,
            targetType: "User",
            detail:     `${user.email} changed their own password`,
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error('[changePasswordAction]:', error);
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
}