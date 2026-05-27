"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users, LayoutDashboard, HandHelping, User } from "lucide-react";
import { clsx } from "clsx";

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname();

  const isStaff = role === 'administrador' || role === 'bibliotecario';

  const links = isStaff ? [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/inventory", label: "Libros", icon: BookOpen },
    { href: "/dashboard/loans", label: "Préstamos", icon: HandHelping },
    { href: "/dashboard/users", label: "Usuarios", icon: Users },
    { href: "/dashboard/profile", label: "Perfil", icon: User },
  ] : [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/explorer", label: "Explorar", icon: BookOpen },
    { href: "/dashboard/my-loans", label: "Préstamos", icon: HandHelping },
    { href: "/dashboard/profile", label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center md:hidden z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200",
              isActive ? "text-orange-600" : "text-slate-400"
            )}
          >
            <div className={clsx(
              "p-1.5 rounded-lg transition-all",
              isActive ? "bg-orange-100" : "bg-transparent"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
