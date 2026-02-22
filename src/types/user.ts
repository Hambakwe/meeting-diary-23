export type UserRole = 'admin' | 'manager' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId?: string; // Assigned client user ID
  clientName?: string;
  createdBy: string;
  createdAt: Date;
  isTemplate?: boolean;
}

export interface ProjectAllocation {
  projectId: string;
  clientId: string;
  allocatedBy: string;
  allocatedAt: Date;
}

// Demo users for testing - IDs match database user IDs
export const DEMO_USERS: User[] = [
  {
    id: '1', // Database ID: 1
    name: 'Admin User',
    email: 'admin@oasiscapitalfinance.com',
    role: 'admin',
  },
  {
    id: '2', // Database ID: 2
    name: 'Sarah Johnson',
    email: 'sarah@oasiscapitalfinance.com',
    role: 'manager',
  },
  {
    id: '3', // Database ID: 3
    name: 'Michael Chen',
    email: 'michael@oasiscapitalfinance.com',
    role: 'manager',
  },
  {
    id: '101', // Database ID: 101
    name: 'Acme Corporation',
    email: 'contact@acmecorp.com',
    role: 'client',
  },
  {
    id: '102', // Database ID: 102
    name: 'Global Investments Ltd',
    email: 'info@globalinvest.com',
    role: 'client',
  },
  {
    id: '103', // Database ID: 103
    name: 'Tech Ventures Inc',
    email: 'hello@techventures.com',
    role: 'client',
  },
];

// Permission helpers
export function canCreateProject(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canAddTask(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canAllocateClient(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canViewAllProjects(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canAccessAdminTools(role: UserRole): boolean {
  return role === 'admin';
}

export function canEditTask(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canDeleteTask(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}
