'use client';

import { createContext, useContext } from 'react';

import type { AdminDictionary } from './dictionaries/ru-admin';

const AdminI18nContext = createContext<AdminDictionary | null>(null);

export function AdminI18nProvider({
  dictionary,
  children,
}: {
  dictionary: AdminDictionary;
  children: React.ReactNode;
}) {
  return <AdminI18nContext.Provider value={dictionary}>{children}</AdminI18nContext.Provider>;
}

/** Словарь панели управления в клиентских компонентах */
export function useAdminDictionary(): AdminDictionary {
  const context = useContext(AdminI18nContext);
  if (!context) throw new Error('useAdminDictionary must be used inside <AdminI18nProvider>');
  return context;
}
