import {createContext, ReactNode, useContext, useRef} from 'react';

type JoyrideRefContextType = {
    newProjectRef: React.RefObject<HTMLDivElement>;
    selectProjectRef: React.RefObject<HTMLDivElement>;
    dashboardNavRef: React.RefObject<HTMLDivElement>;
    vendorButtonRef: React.RefObject<HTMLDivElement>;
}

const JoyrideRefContext = createContext<JoyrideRefContextType | null>(null);

export const JoyrideRefProvider = ({ children }: {children : ReactNode}) => {
    const newProjectRef = useRef<HTMLDivElement>(null);
    const selectProjectRef = useRef<HTMLDivElement>(null);
    const dashboardNavRef = useRef<HTMLDivElement>(null);
    const vendorButtonRef = useRef<HTMLDivElement>(null);

    return (
      <JoyrideRefContext.Provider value={{ newProjectRef, selectProjectRef, dashboardNavRef, vendorButtonRef } }
      >
        {children}
      </JoyrideRefContext.Provider>
    );
};

export const useJoyrideRef = () => {
    const context = useContext(JoyrideRefContext);
    if (!context) {
        throw new Error('useJoyrideRef must be used within a JoyrideRefProvider');
    }
    return context;
}