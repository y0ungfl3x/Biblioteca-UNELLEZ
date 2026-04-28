"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users, LayoutDashboard, HandHelping } from "lucide-react";
import { clsx } from "clsx";

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();

  const isStaff = role === 'administrador' || role === 'bibliotecario';

  const links = isStaff ? [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/inventory", label: "Inventario", icon: BookOpen },
    { href: "/dashboard/loans", label: "Préstamos", icon: HandHelping },
    { href: "/dashboard/users", label: "Usuarios", icon: Users },
  ] : [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/explorer", label: "Explorar Libros", icon: BookOpen },
    { href: "/dashboard/my-loans", label: "Mis Préstamos", icon: HandHelping },
  ];

  return (
    <nav className="flex-1 px-4 space-y-1.5 mt-4">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium group",
              isActive
                ? "bg-orange-500 text-white shadow-md shadow-orange-200 translate-x-1"
                : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
            )}
          >
            <Icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-orange-500")} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
