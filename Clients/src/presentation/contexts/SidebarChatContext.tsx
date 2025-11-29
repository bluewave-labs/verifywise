import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface RowContext {
  tableId: string;
  rowId: string | number;
  rowLabel: string;
  metadata?: Record<string, any>;
}

interface SidebarChatContextType {
  isOpen: boolean;
  currentRow: RowContext | null;
  openSidebar: (rowContext: RowContext) => void;
  closeSidebar: () => void;
  toggleSidebar: (rowContext?: RowContext) => void;
}

const SidebarChatContext = createContext<SidebarChatContextType | undefined>(undefined);

export const useSidebarChat = () => {
  const context = useContext(SidebarChatContext);
  if (!context) {
    throw new Error('useSidebarChat must be used within a SidebarChatProvider');
  }
  return context;
};

interface SidebarChatProviderProps {
  children: ReactNode;
}

export const SidebarChatProvider: React.FC<SidebarChatProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<RowContext | null>(null);

  const openSidebar = (rowContext: RowContext) => {
    setCurrentRow(rowContext);
    setIsOpen(true);
  };

  const closeSidebar = () => {
    setIsOpen(false);
    // Keep currentRow for a moment to allow smooth closing animation
    setTimeout(() => setCurrentRow(null), 300);
  };

  const toggleSidebar = (rowContext?: RowContext) => {
    if (isOpen && currentRow?.tableId === rowContext?.tableId && currentRow?.rowId === rowContext?.rowId) {
      closeSidebar();
    } else if (rowContext) {
      openSidebar(rowContext);
    } else {
      closeSidebar();
    }
  };

  return (
    <SidebarChatContext.Provider
      value={{
        isOpen,
        currentRow,
        openSidebar,
        closeSidebar,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarChatContext.Provider>
  );
};
