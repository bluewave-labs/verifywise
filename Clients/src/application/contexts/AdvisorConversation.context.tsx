import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  AdvisorMessage,
  getConversationAPI,
  saveConversationAPI,
} from '../repository/advisor.repository';
import { AdvisorDomain } from '../../presentation/components/AdvisorChat/advisorConfig';

interface ConversationState {
  messages: AdvisorMessage[];
  isLoading: boolean;
  isLoaded: boolean;
}

interface AdvisorConversationContextType {
  getMessages: (domain: AdvisorDomain) => AdvisorMessage[];
  addMessage: (domain: AdvisorDomain, message: AdvisorMessage) => void;
  loadConversation: (domain: AdvisorDomain) => Promise<void>;
  saveConversation: (domain: AdvisorDomain) => Promise<void>;
  isLoading: (domain: AdvisorDomain | undefined) => boolean;
  isLoaded: (domain: AdvisorDomain | undefined) => boolean;
}

const AdvisorConversationContext = createContext<AdvisorConversationContextType | null>(null);

export const AdvisorConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Record<string, ConversationState>>({});
  const saveTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const loadingDomainsRef = useRef<Set<string>>(new Set());

  const getMessages = useCallback((domain: AdvisorDomain): AdvisorMessage[] => {
    return conversations[domain]?.messages || [];
  }, [conversations]);

  const isLoading = useCallback((domain: AdvisorDomain | undefined): boolean => {
    if (!domain) return false;
    return conversations[domain]?.isLoading || false;
  }, [conversations]);

  const isLoaded = useCallback((domain: AdvisorDomain | undefined): boolean => {
    if (!domain) return false;
    return conversations[domain]?.isLoaded || false;
  }, [conversations]);

  const loadConversation = useCallback(async (domain: AdvisorDomain): Promise<void> => {
    // Use ref to prevent duplicate loads (avoids stale closure issue)
    if (loadingDomainsRef.current.has(domain)) {
      return;
    }

    // Check current state
    setConversations(prev => {
      if (prev[domain]?.isLoaded || prev[domain]?.isLoading) {
        return prev;
      }

      loadingDomainsRef.current.add(domain);
      return {
        ...prev,
        [domain]: {
          messages: prev[domain]?.messages || [],
          isLoading: true,
          isLoaded: false,
        },
      };
    });

    // If we didn't start loading, return
    if (!loadingDomainsRef.current.has(domain)) {
      return;
    }

    try {
      const response = await getConversationAPI(domain);
      const messages = response.data?.messages || [];

      setConversations(prev => ({
        ...prev,
        [domain]: {
          messages,
          isLoading: false,
          isLoaded: true,
        },
      }));
    } catch (error) {
      console.error(`Failed to load conversation for ${domain}:`, error);
      setConversations(prev => ({
        ...prev,
        [domain]: {
          messages: [],
          isLoading: false,
          isLoaded: true,
        },
      }));
    } finally {
      loadingDomainsRef.current.delete(domain);
    }
  }, []);

  const saveConversation = useCallback(async (domain: AdvisorDomain): Promise<void> => {
    // Get messages from current state via setState to avoid stale closure
    let messagesToSave: AdvisorMessage[] = [];

    setConversations(prev => {
      messagesToSave = prev[domain]?.messages || [];
      return prev;
    });

    if (messagesToSave.length === 0) {
      return;
    }

    try {
      await saveConversationAPI(domain, messagesToSave);
    } catch (error) {
      console.error(`Failed to save conversation for ${domain}:`, error);
    }
  }, []);

  const addMessage = useCallback((domain: AdvisorDomain, message: AdvisorMessage): void => {
    setConversations(prev => {
      const currentMessages = prev[domain]?.messages || [];
      return {
        ...prev,
        [domain]: {
          messages: [...currentMessages, message],
          isLoading: false,
          isLoaded: true,
        },
      };
    });

    // Clear existing timer for this domain
    if (saveTimersRef.current[domain]) {
      clearTimeout(saveTimersRef.current[domain]);
    }

    // Set new timer to save after 1 second of inactivity
    saveTimersRef.current[domain] = setTimeout(() => {
      setConversations(prev => {
        const messages = prev[domain]?.messages || [];
        if (messages.length > 0) {
          saveConversationAPI(domain, messages).catch(err => {
            console.error(`Auto-save failed for ${domain}:`, err);
          });
        }
        return prev;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const timers = saveTimersRef.current;
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const value = useMemo<AdvisorConversationContextType>(() => ({
    getMessages,
    addMessage,
    loadConversation,
    saveConversation,
    isLoading,
    isLoaded,
  }), [getMessages, addMessage, loadConversation, saveConversation, isLoading, isLoaded]);

  return (
    <AdvisorConversationContext.Provider value={value}>
      {children}
    </AdvisorConversationContext.Provider>
  );
};

export const useAdvisorConversation = (): AdvisorConversationContextType => {
  const context = useContext(AdvisorConversationContext);
  if (!context) {
    throw new Error('useAdvisorConversation must be used within an AdvisorConversationProvider');
  }
  return context;
};

export const useAdvisorConversationSafe = (): AdvisorConversationContextType | null => {
  return useContext(AdvisorConversationContext);
};
