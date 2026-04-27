import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookOpen, Users, LogOut, LayoutDashboard, HandHelping } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm relative z-20">
        <div className="p-6 flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-orange-600" />
          <span className="font-bold text-slate-900 tracking-tight">UNELLEZ</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Inicio</span>
          </Link>
          <Link href="/dashboard/inventory" className="flex items-center space-x-3 px-3 py-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium">
            <BookOpen className="w-5 h-5" />
            <span>Inventario</span>
          </Link>
          <Link href="/dashboard/loans" className="flex items-center space-x-3 px-3 py-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium">
            <HandHelping className="w-5 h-5" />
            <span>Préstamos</span>
          </Link>
          <Link href="/dashboard/users" className="flex items-center space-x-3 px-3 py-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium">
            <Users className="w-5 h-5" />
            <span>Usuarios</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="mb-4 px-2">
            <p className="text-sm text-slate-900 font-semibold truncate">{profile?.full_name}</p>
            <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
          </div>
          <form action={logout}>
            <button type="submit" className="w-full flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-slate-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
