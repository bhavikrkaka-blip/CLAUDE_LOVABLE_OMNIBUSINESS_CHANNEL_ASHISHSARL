import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  BarChart3,
  ShoppingCart,
  Package,
  ArrowLeftRight,
  ClipboardCheck,
  PlusCircle,
  History,
  LogOut,
  Home,
  Menu,
  Receipt,
  FileSearch,
  LineChart,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: BarChart3 },
  { label: "POS", to: "/pos", icon: ShoppingCart },
  { label: "Sales", to: "/admin/sales", icon: Receipt },
  { label: "Sales Summary", to: "/admin/sales-summary", icon: LineChart },
  { label: "Audit Log", to: "/admin/sales/audit-log", icon: FileSearch },
  { label: "Inventory", to: "/admin/inventory", icon: Package },
  { label: "Transfers", to: "/admin/transfers", icon: ArrowLeftRight },
  { label: "Stock Audit", to: "/admin/stock-audit", icon: ClipboardCheck },
  { label: "New Purchase", to: "/admin/purchases/new", icon: PlusCircle },
  { label: "Purchase History", to: "/admin/purchases", icon: History },
  { label: "Accounting", to: "/admin/accounting", icon: BookOpen },
];

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);
  const [missingImgCount, setMissingImgCount] = useState(0);

  useEffect(() => {
    const fetchMissingCount = async () => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .or("image_url.is.null,image_url.eq.");
      setMissingImgCount(count ?? 0);
    };
    fetchMissingCount();
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Overlay for mobile */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen flex flex-col border-r bg-background transition-all duration-200",
          collapsed ? "w-14" : "w-56",
          isMobile && collapsed && "-translate-x-full"
        )}
      >
        {/* Logo / brand */}
        <div className="flex items-center h-14 border-b px-3 gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setCollapsed((c) => !c)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {!collapsed && (
            <span className="font-semibold text-sm truncate">Admin</span>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin/dashboard"}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                collapsed && "justify-center px-0"
              )}
              activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              onClick={() => isMobile && setCollapsed(true)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.label === "Inventory" && missingImgCount > 0 && (
                    <span className="bg-orange-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                      {missingImgCount > 99 ? "99+" : missingImgCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-2 space-y-1 shrink-0">
          <NavLink
            to="/"
            className={cn(
              "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && <span>View Site</span>}
          </NavLink>
          <button
            onClick={handleSignOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          {!collapsed && user?.email && (
            <p className="px-2.5 text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 min-h-screen transition-all duration-200",
          !isMobile && (collapsed ? "ml-14" : "ml-56"),
        )}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <header className="sticky top-0 z-20 flex items-center h-14 border-b bg-background px-4 gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-sm">Admin</span>
          </header>
        )}

        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
