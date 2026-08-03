import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-white lg:block xl:w-64">
        <div className="fixed h-screen w-60 bg-white xl:w-64">
          <AppSidebar />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(18rem,86vw)] max-w-[18rem] border-border bg-white p-0"
          closeClassName="text-foreground"
        >
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        <AppHeader onMenuClick={() => setMobileOpen(true)} />
        <main
          key={location.pathname}
          className="page-fade-in min-w-0 flex-1 overflow-x-hidden bg-white px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
