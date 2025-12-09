import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'verifywise-sidebar-open';

interface UserGuideSidebarContextValue {
  isOpen: boolean;
  open: (path?: string) => void;
  close: () => void;
  toggle: () => void;
  currentPath: string | undefined;
}

const UserGuideSidebarContext = createContext<UserGuideSidebarContextValue | null>(null);

export const UserGuideSidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    return saved === 'true';
  });

  const [currentPath, setCurrentPath] = useState<string | undefined>();

  // Update body class for content push effect
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isOpen]);

  // Persist state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SIDEBAR_STATE_KEY, String(isOpen));
  }, [isOpen]);

  const open = useCallback((path?: string) => {
    setCurrentPath(path);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <UserGuideSidebarContext.Provider value={{ isOpen, open, close, toggle, currentPath }}>
      {children}
    </UserGuideSidebarContext.Provider>
  );
};

export const useUserGuideSidebarContext = (): UserGuideSidebarContextValue => {
  const context = useContext(UserGuideSidebarContext);
  if (!context) {
    throw new Error('useUserGuideSidebarContext must be used within a UserGuideSidebarProvider');
  }
  return context;
};

export default UserGuideSidebarContext;
