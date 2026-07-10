import { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tags,
  Users,
  Image as ImageIcon,
  Search,
  FileEdit,
  CheckCircle2,
  Star,
  BarChart3,
  Receipt,
  Settings as SettingsIcon,
  LogOut,
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/posts", label: "Posts", icon: FileText },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/authors", label: "Authors", icon: Users },
  { to: "/media", label: "Media", icon: ImageIcon },
  { to: "/seo", label: "SEO", icon: Search },
  { to: "/drafts", label: "Drafts", icon: FileEdit },
  { to: "/published", label: "Published", icon: CheckCircle2 },
  { to: "/featured", label: "Featured", icon: Star },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/invoice", label: "Invoice", icon: Receipt },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-100 text-slate-900">
      {/* Sidebar */}
      <aside
        className={`${mobileOpen ? "fixed inset-y-0 left-0 z-40 flex" : "hidden"} md:flex w-60 flex-col bg-slate-900 text-slate-100`}
      >
        <div className="h-14 px-5 flex items-center border-b border-slate-800">
          <span className="font-bold text-sm tracking-wide">IT BLOG ADMIN</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((item) => {
            const active =
              item.to === "/posts"
                ? pathname === "/posts" || pathname.startsWith("/posts/")
                : pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                  active
                    ? "bg-slate-800 text-white border-l-2 border-blue-500"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white border-t border-slate-800"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1 rounded hover:bg-slate-100"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="hidden md:inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status ?? "").toLowerCase();
  let cls = "bg-slate-100 text-slate-700 border-slate-200";
  if (s === "published" || s === "active") cls = "bg-green-100 text-green-700 border-green-200";
  else if (s === "draft" || s === "in review" || s === "scheduled")
    cls = "bg-amber-100 text-amber-800 border-amber-200";
  else if (s === "archived" || s === "inactive" || s === "issue" || s === "error")
    cls = "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {status ?? "—"}
    </span>
  );
}
