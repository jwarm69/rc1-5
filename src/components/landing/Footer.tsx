import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-10 md:py-12 px-5 md:px-6 border-t border-border/30">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 md:flex-row md:justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm font-semibold">
            <span className="matrix-text-gradient">RealCoach</span>
            <span className="tiffany-text-gradient">.ai</span>
          </span>
        </Link>
        
        {/* Links - Centered on mobile */}
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
            Privacy
          </a>
          <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
            Terms
          </a>
          <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
            Contact
          </a>
        </div>
        
        {/* Copyright */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} RealCoach.ai
        </p>
      </div>
    </footer>
  );
}
