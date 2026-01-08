import { ReactNode, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Navigation } from "./Navigation";
import { CoachPanel } from "./CoachPanel";
import { useDatabaseContext } from "@/contexts/DatabaseContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ArrowLeft, MessageCircle, X, LogOut, UserPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isDemo = location.pathname.startsWith("/demo");
  const { isContactOpen } = useDatabaseContext();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [mobileCoachOpen, setMobileCoachOpen] = useState(false);
  
  // Hide coach panel when contact modal is open
  const showCoachPanel = !isContactOpen && !isMobile;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-accent/10 border-b border-accent/20 px-4 md:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-accent" />
              <span className="text-xs text-accent font-medium">Demo Mode</span>
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">Exploring with sample data</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <UserPlus className="w-3 h-3" />
                  <span className="hidden sm:inline">Create account</span>
                  <span className="sm:hidden">Sign up</span>
                </Link>
              )}
              <Link 
                to="/" 
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Back to RealCoach</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <Navigation />
      <div className="flex-1 flex min-h-0">
        {/* Main content area - scrollable */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0">
          <div className={`p-4 md:p-8 mx-auto ${showCoachPanel ? "max-w-4xl" : "max-w-5xl"}`}>
            {children}
          </div>
        </main>
        
        {/* Fixed Coach Panel - Desktop only */}
        {showCoachPanel && <CoachPanel />}
      </div>

      {/* Mobile Coach FAB */}
      {isMobile && !isContactOpen && (
        <button
          onClick={() => setMobileCoachOpen(true)}
          className="fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center animate-fade-in"
          aria-label="Open RealCoach"
        >
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-md" />
          <MessageCircle className="w-6 h-6 relative z-10" />
        </button>
      )}

      {/* Mobile Coach Panel Overlay */}
      {isMobile && mobileCoachOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-in-up">
          {/* Mobile Coach Header */}
          <div className="flex items-center justify-between p-4 border-b border-border safe-area-top">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground">RealCoach</h3>
                <p className="text-xs text-muted-foreground">Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setMobileCoachOpen(false)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors touch-target"
              aria-label="Close coach"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Coach Content */}
          <div className="flex-1 overflow-hidden">
            <CoachPanel isMobile onClose={() => setMobileCoachOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
