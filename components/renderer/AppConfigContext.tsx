/**
 * App Config Context
 * 
 * Provides the full AppConfig to renderer components so they can:
 * - Generate mock data in preview mode based on entity schemas
 * - Know about entity relationships and field types
 * - Access theme and other global config
 */

'use client';

import { createContext, useContext } from 'react';
import type { AppConfig } from '@/lib/config/types';

const AppConfigContext = createContext<AppConfig | null>(null);

export function AppConfigProvider({ 
  children, 
  config 
}: { 
  children: React.ReactNode; 
  config: AppConfig | null;
}) {
  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
