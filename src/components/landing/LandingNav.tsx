import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function LandingNav() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="h-16 bg-background/60 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 safe-area-top">
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6">
        {/* Logo with Theme Toggle */}
        <div className="flex flex-col items-start gap-1">
          <ThemeToggle />
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary blur-sm opacity-50" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              <span className="matrix-text-gradient">RealCoach</span>
              <span className="tiffany-text-gradient">.ai</span>
            </span>
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {!isLandingPage && (
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
          )}
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(156_100%_50%/0.3)] hover:shadow-[0_0_30px_hsl(156_100%_50%/0.5)] transition-all duration-300"
          >
            <a href="#ignition">See how it works</a>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors touch-target"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobile && menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border/30 animate-fade-in">
          <div className="p-6 space-y-4">
            {!isLandingPage && (
              <Link 
                to="/" 
                onClick={() => setMenuOpen(false)}
                className="block p-3 text-foreground hover:text-primary transition-colors"
              >
                Home
              </Link>
            )}
            <a 
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="block p-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a 
              href="#pricing"
              onClick={() => setMenuOpen(false)}
              className="block p-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <Button
              asChild
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(156_100%_50%/0.3)] py-6"
            >
              <a href="#ignition" onClick={() => setMenuOpen(false)}>See how it works</a>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
