'use client';

import { createContext, useContext } from 'react';
import type { StaffRole } from './security/roles';

export type StaffIdentity = { id: string; auth_user_id: string; name: string; email: string; role: StaffRole };
export const StaffContext = createContext<StaffIdentity | null>(null);
export const useStaff = () => useContext(StaffContext);
