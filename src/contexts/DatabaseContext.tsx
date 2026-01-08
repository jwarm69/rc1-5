import { createContext, useContext, useState, ReactNode } from "react";

interface DatabaseContextType {
  isContactOpen: boolean;
  setIsContactOpen: (open: boolean) => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <DatabaseContext.Provider value={{ isContactOpen, setIsContactOpen }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabaseContext must be used within a DatabaseProvider");
  }
  return context;
}
