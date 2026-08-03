"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquareQuote, 
  Image as ImageIcon, 
  Handshake, 
  LogOut, 
  Menu,
  Settings,
  ShoppingBag,
  BookOpen,
  Users
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAVIGATION = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Testimonials", href: "/testimonials", icon: MessageSquareQuote },
  { name: "Gallery", href: "/gallery", icon: ImageIcon },
  { name: "Businesses", href: "/businesses", icon: ShoppingBag },
  { name: "Resources", href: "/resources", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Inbox", href: "/inbox", icon: Handshake },
  { name: "Executives", href: "/executives", icon: Users },
  { name: "Team", href: "/team", icon: Users },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If we are on the login page, don't show the dashboard layout
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const renderNavLinks = (onClick?: () => void) => (
    <nav className="flex flex-col gap-2 mt-6">
      {NAVIGATION.map((item) => {
        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <item.icon className={`h-4 w-4 ${isActive ? "text-zinc-900" : "text-zinc-500"}`} />
            {item.name}
          </Link>
        );
      })}
      
      <div className="mt-8 pt-6 border-t border-zinc-200">
        <button
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          <LogOut className="h-4 w-4 text-zinc-500" />
          Log out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-zinc-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white md:flex fixed h-full z-10">
        <div className="flex h-14 items-center border-b border-zinc-200 px-6">
          <span className="font-semibold text-lg tracking-tight">WIA Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {renderNavLinks()}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-col md:pl-64 w-full">
        {/* Mobile Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-zinc-200 bg-white px-4 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-zinc-100 hover:text-zinc-900 h-10 w-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b border-zinc-200 px-6">
                <span className="font-semibold text-lg tracking-tight">WIA Admin</span>
              </div>
              <div className="px-4 py-4">
                {renderNavLinks(() => setMobileOpen(false))}
              </div>
            </SheetContent>
          </Sheet>
          <span className="ml-4 font-semibold text-lg tracking-tight md:hidden">WIA Admin</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
