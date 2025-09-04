import React, { ReactNode } from 'react';
import { TenantContext, useTenantManager } from '@/hooks/useCurrentTenant';

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const tenantManager = useTenantManager();

  return (
    <TenantContext.Provider value={tenantManager}>
      {children}
    </TenantContext.Provider>
  );
};