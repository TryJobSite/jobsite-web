'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

const HeaderActionContext = createContext<{
  action: ReactNode | null;
  setAction: (action: ReactNode | null) => void;
}>({
  action: null,
  setAction: () => {},
});

export function HeaderActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<ReactNode | null>(null);

  return (
    <HeaderActionContext.Provider value={{ action, setAction }}>{children}</HeaderActionContext.Provider>
  );
}

export function useHeaderAction() {
  return useContext(HeaderActionContext);
}
