import { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export interface RouteConfig {
  path: string;
  element: ReactNode;
  label?: string;
  icon?: any;
  isPrivate?: boolean;
  group?: 'auth' | 'app' | 'admin';
}

export interface AppMetadata {
  title: string;
  description: string;
  version: string;
  stage: string;
  author: string;
}
