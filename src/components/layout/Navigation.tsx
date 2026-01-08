import { NavLink, useLocation, Link } from "react-router-dom";
import { Home, Target, FileText, GitBranch, BarChart3, Database, Menu, X, UserPlus, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const demoNavItems = [
  { path: "/demo/ignition", label: "Ignition", icon: Home },
  { path: "/demo/goals", label: "Goals", icon: Target },
  { path: "/demo/business-plan", label: "Plan", icon: FileText },
  { path: "/demo/pipeline", label: "Pipeline", icon: GitBranch },
  { path: "/demo/production", label: "Production", icon: BarChart3 },
  { path: "/demo/database", label: "Database", icon: Database },
];

export function Navigation() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Desktop Navigation
  if (!isMobile) {
    return (
      <nav className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-1">
            {/* Logo with Theme Toggle */}
            <div className="mr-8 flex flex-col items-start gap-1">
              <ThemeToggle />
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-semibold text-foreground tracking-tight">
                  <span className="matrix-text-gradient">RealCoach</span>
                  <span className="tiffany-text-gradient">.ai</span>
                </span>
              </Link>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {demoNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActive ? "active" : ""}`}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Premium CTA Buttons */}
          <div className="flex items-center gap-3">
            {/* Schedule Meeting Button - Tiffany Blue */}
            <a
              href="https://link.solai.systems/widget/bookings/realcoach-intro"
              target="_blank"
              rel="noopener noreferrer"
              className="premium-btn-tiffany group relative overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition-all duration-300"
            >
              <div className="absolute inset-0 premium-flow-tiffany" />
              <div className="absolute -inset-1 bg-accent/30 blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300 rounded-full" />
              <div className="relative z-10 flex items-center gap-2 text-white">
                <CalendarCheck className="w-4 h-4" />
                <span>Schedule Meeting</span>
              </div>
            </a>

            {/* Create Account Button - Matrix Green */}
            <Link
              to="/auth"
              className="premium-btn-matrix group relative overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition-all duration-300"
            >
              <div className="absolute inset-0 premium-flow-matrix" />
              <div className="absolute -inset-1 bg-primary/40 blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
              <div className="relative z-10 flex items-center gap-2 text-white">
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // Mobile Navigation - Top bar + Bottom nav
  return (
    <>
      {/* Mobile Top Bar */}
      <nav className="h-14 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50 safe-area-top">
        <div className="h-full flex items-center justify-between px-4">
          {/* Logo with Theme Toggle */}
          <div className="flex flex-col items-start gap-1">
            <ThemeToggle />
            <Link to="/" className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-foreground tracking-tight">
                <span className="matrix-text-gradient">RealCoach</span>
                <span className="tiffany-text-gradient">.ai</span>
              </span>
            </Link>
          </div>

          {/* Coach button or menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors touch-target"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
        <div className="flex items-center justify-between px-3 py-2">
          {demoNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2 min-w-[52px] transition-all duration-200 ${isActive ? "" : "text-muted-foreground"}`}
              >
                <div className={isActive ? "contact-name-gradient" : ""}>
                  <Icon className={`w-5 h-5 ${isActive ? "" : "text-muted-foreground"}`} style={isActive ? { stroke: 'url(#nav-gradient)' } : {}} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "contact-name-gradient" : ""}`}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
        {/* SVG gradient definition for icons */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="nav-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(156, 100%, 50%)" />
              <stop offset="50%" stopColor="hsl(175, 100%, 37%)" />
              <stop offset="100%" stopColor="hsl(156, 100%, 50%)" />
            </linearGradient>
          </defs>
        </svg>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md animate-fade-in pt-14"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="p-5 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Navigate</p>
            {demoNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors touch-target ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}

            {/* Mobile CTA Buttons */}
            <div className="pt-4 mt-4 border-t border-border/50 space-y-3">
              <a
                href="https://link.solai.systems/widget/bookings/realcoach-intro"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="premium-btn-tiffany group relative overflow-hidden rounded-xl flex items-center justify-center gap-3 px-5 py-4 text-base font-medium transition-all duration-300 touch-target"
              >
                <div className="absolute inset-0 premium-flow-tiffany" />
                <div className="absolute -inset-1 bg-accent/25 blur-xl opacity-60 rounded-xl" />
                <div className="relative z-10 flex items-center gap-3 text-white">
                  <CalendarCheck className="w-5 h-5" />
                  <span>Schedule Meeting</span>
                </div>
              </a>

              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="premium-btn-matrix group relative overflow-hidden rounded-xl flex items-center justify-center gap-3 px-5 py-4 text-base font-medium transition-all duration-300 touch-target"
              >
                <div className="absolute inset-0 premium-flow-matrix" />
                <div className="absolute -inset-1 bg-primary/30 blur-xl opacity-70 rounded-xl" />
                <div className="relative z-10 flex items-center gap-3 text-white">
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
