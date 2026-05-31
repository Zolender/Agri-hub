'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    History,
    Boxes,
    FileUp,
    ShieldCheck,
    ShoppingBag,
    PackagePlus,
    LogOut,
    ChevronRight,
    Users,
    ScrollText,
    UserCircle,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';

type Role = 'ADMIN' | 'MANAGER' | 'ANALYST';

type NavItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    minRole: Role;
};

type NavGroup = {
    label: string;
    minRole: Role;
    items: NavItem[];
};

export default function SidebarNav({
    isDark,
    role,
    isCollapsed,
    onToggle,
    showCollapseToggle = true,
}: {
    isDark: boolean;
    role: Role;
    isCollapsed: boolean;
    onToggle: () => void;
    showCollapseToggle?: boolean;
}) {
    const pathname = usePathname();

    const hasAccess = (minRole: Role) => {
        if (minRole === 'ANALYST') return true;
        if (minRole === 'MANAGER') return role === 'ADMIN' || role === 'MANAGER';
        if (minRole === 'ADMIN')   return role === 'ADMIN';
        return false;
    };

    const mainItems: NavItem[] = [
        { name: 'Dashboard',     href: '/dashboard',            icon: LayoutDashboard, minRole: 'ANALYST' },
        { name: 'Inventory',     href: '/dashboard/inventory', icon: Boxes,           minRole: 'ANALYST' },
        { name: 'Transactions',  href: '/transactions',         icon: History,         minRole: 'ANALYST' },
        { name: 'Record Sale',   href: '/dashboard/sale', icon: ShoppingBag,     minRole: 'ANALYST' },
        { name: 'Receive Stock', href: '/dashboard/add',  icon: PackagePlus,     minRole: 'MANAGER' },
        { name: 'Import Data',   href: '/import',         icon: FileUp,          minRole: 'MANAGER' },
    ];

    const adminGroup: NavGroup = {
        label: 'Admin',
        minRole: 'MANAGER',
        items: [
            { name: 'Users',     href: '/admin',       icon: Users,      minRole: 'ADMIN' },
            { name: 'Audit Log', href: '/admin/audit', icon: ScrollText, minRole: 'ADMIN' },
        ],
    };

    const visibleMainItems  = mainItems.filter(item => hasAccess(item.minRole));
    const showAdminGroup    = hasAccess(adminGroup.minRole);
    const visibleAdminItems = adminGroup.items.filter(item => hasAccess(item.minRole));

    // All registered hrefs — prevents a parent prefix from staying active
    // when a more-specific child owns the current path
    const allNavHrefs = [
        ...mainItems.map(i => i.href),
        ...adminGroup.items.map(i => i.href),
        '/profile',
    ];

    const isActiveLink = (href: string) => {
        if (pathname === href) return true;
        if (allNavHrefs.some(h => h !== href && pathname === h)) return false;
        return pathname.startsWith(href + '/');
    };

    // ── Shared class helpers ───────────────────────────────────────────────────
    const iconBtn = (isActive: boolean) => `
        relative flex items-center overflow-hidden rounded-xl
        transition-colors duration-200
        ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full gap-3 px-4 py-2.5'}
        ${isActive
            ? 'bg-linear-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/20'
            : isDark
            ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        }
    `;

    const renderNavLink = (item: NavItem, index: number) => {
        const Icon = item.icon;
        const isActive = isActiveLink(item.href);

        return (
            <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={isCollapsed ? '' : 'w-full'}
            >
                <Link
                    href={item.href}
                    aria-label={item.name}
                    title={isCollapsed ? item.name : undefined}
                    className={iconBtn(isActive)}
                >
                    {isActive && (
                        <motion.div
                            className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                    )}
                    <Icon className="w-5 h-5 shrink-0 relative z-10" />
                    {!isCollapsed && (
                        <>
                            <span className="text-sm font-semibold relative z-10 flex-1 truncate">
                                {item.name}
                            </span>
                            {isActive && (
                                <ChevronRight className="w-4 h-4 relative z-10 opacity-70" />
                            )}
                        </>
                    )}
                </Link>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full justify-between">

            {/* ── Nav links ───────────────────────────────────────────────── */}
            <nav className={`py-4 ${isCollapsed ? 'flex flex-col items-center gap-1 px-3' : 'px-3 space-y-1'}`}>
                {visibleMainItems.map((item, i) => renderNavLink(item, i))}

                {showAdminGroup && visibleAdminItems.length > 0 && (
                    <div className={`pt-3 ${isCollapsed ? 'w-full flex flex-col items-center' : ''}`}>
                        {/* Section label (hidden when collapsed, replaced by a thin divider) */}
                        {!isCollapsed ? (
                            <div className={`flex items-center gap-2 px-4 pb-2 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                                <div className={`flex-1 h-px ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`} />
                                <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3" />
                                    Admin
                                </span>
                                <div className={`flex-1 h-px ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`} />
                            </div>
                        ) : (
                            <div className={`w-6 h-px mb-2 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />
                        )}

                        <div className={`${isCollapsed ? 'flex flex-col items-center gap-1 w-full' : 'space-y-1'}`}>
                            {visibleAdminItems.map((item, i) =>
                                renderNavLink(item, visibleMainItems.length + i)
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* ── Bottom: profile, sign out, collapse toggle ──────────────── */}
            <div className={`p-3 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'} ${isCollapsed ? 'flex flex-col items-center gap-1' : 'space-y-1'}`}>
                {/* Profile */}
                <Link
                    href="/profile"
                    aria-label="My Profile"
                    title={isCollapsed ? 'My Profile' : undefined}
                    className={iconBtn(pathname === '/profile') + ' text-sm font-semibold'}
                >
                    <UserCircle className="w-5 h-5" />
                    {!isCollapsed && <span>My Profile</span>}
                </Link>

                {/* Sign Out */}
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    aria-label="Sign Out"
                    title={isCollapsed ? 'Sign Out' : undefined}
                    className={`
                        flex items-center overflow-hidden rounded-xl
                        transition-colors duration-200 text-sm font-semibold
                        ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full gap-3 px-4 py-3'}
                        ${isDark
                            ? 'text-stone-400 hover:bg-stone-800 hover:text-rose-400'
                            : 'text-stone-500 hover:bg-rose-50 hover:text-rose-600'
                        }
                    `}
                >
                    <LogOut className="w-5 h-5" />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>

                {showCollapseToggle && (
                    <button
                        onClick={onToggle}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className={`
                            flex items-center overflow-hidden rounded-xl
                            transition-colors duration-200 text-sm font-semibold
                            ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full gap-3 px-4 py-3'}
                            ${isDark
                                ? 'text-stone-600 hover:bg-stone-800 hover:text-stone-400'
                                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-500'
                            }
                        `}
                    >
                        {isCollapsed
                            ? <PanelLeftOpen className="w-4 h-4" />
                            : <PanelLeftClose className="w-4 h-4" />
                        }
                        {!isCollapsed && <span>Collapse</span>}
                    </button>
                )}
            </div>
        </div>
    );
}
