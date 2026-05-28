import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookOpen, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="UNELLEZ"
            className="h-8 w-auto object-contain"
          />
          <span className="font-bold text-slate-900 tracking-tight">
            Biblioteca
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all border border-slate-100"
            title="Ver Perfil"
          >
            <UserIcon className="w-4 h-4" />
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shadow-sm sticky top-0 h-screen z-20">
        <div className="p-8 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="UNELLEZ"
            className="h-20 w-auto object-contain mb-4"
          />
          <div className="text-center">
            <span className="block font-black text-slate-900 tracking-tighter text-xl">
              UNELLEZ
            </span>
            <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em] -mt-1">
              Biblioteca
            </span>
          </div>
        </div>

        <SidebarNav role={profile?.role || "estudiante"} />

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="mb-4 px-2">
            <p className="text-sm text-slate-900 font-semibold truncate">
              {profile?.full_name}
            </p>
            <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-slate-50 pb-20 md:pb-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav role={profile?.role || "estudiante"} />
    </div>
  );
}
