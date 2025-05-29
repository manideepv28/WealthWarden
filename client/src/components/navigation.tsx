import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getCurrentUser, clearCurrentUser } from "@/lib/auth";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: "fas fa-tachometer-alt" },
  { path: "/transactions", label: "Transactions", icon: "fas fa-exchange-alt" },
  { path: "/analytics", label: "Analytics", icon: "fas fa-chart-bar" },
  { path: "/add-transaction", label: "Add Transaction", icon: "fas fa-plus" },
];

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location]);

  const handleLogout = () => {
    clearCurrentUser();
    setLocation("/auth");
    setIsMobileMenuOpen(false);
  };

  const NavItems = ({ mobile = false }) => (
    <>
      {navigationItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          onClick={() => mobile && setIsMobileMenuOpen(false)}
        >
          <Button
            variant={location === item.path ? "default" : "ghost"}
            className={`w-full justify-start ${mobile ? "h-12" : ""}`}
          >
            <i className={`${item.icon} mr-3`}></i>
            {item.label}
          </Button>
        </Link>
      ))}
    </>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <i className="fas fa-chart-line text-2xl text-primary mr-3"></i>
              <h1 className="text-xl font-bold text-gray-800">Finance Tracker</h1>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <span className="text-gray-600 font-medium">
                Welcome, {user?.name}
              </span>
              <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col space-y-4 mt-8">
                    <div className="text-center pb-4 border-b">
                      <p className="font-medium text-gray-800">Welcome, {user?.name}</p>
                    </div>
                    <NavItems mobile={true} />
                    <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white shadow-sm border-r border-gray-200 fixed left-0 top-16 h-full">
        <nav className="p-4 space-y-2">
          <NavItems />
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                className={`flex flex-col items-center py-2 px-3 h-auto ${
                  location === item.path ? "text-primary" : "text-gray-600"
                }`}
              >
                <i className={`${item.icon} text-lg`}></i>
                <span className="text-xs mt-1">{item.label.split(" ")[0]}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
