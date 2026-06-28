import type { Metadata } from 'next';
import { ReactNode } from "react";

export const metadata: Metadata = { title: 'Sign In | AgriHub' };

export default function PublicLayout({children}: {children: ReactNode}){
    return <>{children}</>
}