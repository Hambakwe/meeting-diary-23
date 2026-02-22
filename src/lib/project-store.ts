'use client';

import type { Task } from '@/types/task';
import { initialTasks } from '@/data/initial-tasks';

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

const PROJECTS_KEY = 'gantt-projects';
const ACTIVE_PROJECT_KEY = 'gantt-active-project';

// Default project colors
export const PROJECT_COLORS = [
  '#14b8a6', // teal
  '#f97316', // orange
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#22c55e', // green
  '#eab308', // yellow
  '#3b82f6', // blue
];

// Generate unique ID
export function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get all projects from localStorage
export function getProjects(): Project[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (stored) {
      const projects = JSON.parse(stored);
      return projects.map((p: Project) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        tasks: p.tasks.map((t: Task) => ({
          ...t,
          startDate: new Date(t.startDate),
          endDate: new Date(t.endDate),
        })),
      }));
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }

  // Return default project if none exist
  return [createDefaultProject()];
}

// Save all projects to localStorage
export function saveProjects(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// Get active project ID
export function getActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

// Set active project ID
export function setActiveProjectId(projectId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
}

// Create default project
export function createDefaultProject(): Project {
  return {
    id: 'default',
    name: 'OCF Bond Issuance Project',
    description: 'Project Timeline & Task Management',
    color: '#14b8a6',
    tasks: initialTasks,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Create new project
export function createProject(name: string, description: string, color?: string): Project {
  return {
    id: generateProjectId(),
    name,
    description,
    color: color || PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Update project
export function updateProject(projects: Project[], projectId: string, updates: Partial<Project>): Project[] {
  return projects.map((p) =>
    p.id === projectId
      ? { ...p, ...updates, updatedAt: new Date() }
      : p
  );
}

// Delete project
export function deleteProject(projects: Project[], projectId: string): Project[] {
  return projects.filter((p) => p.id !== projectId);
}

// Update tasks for a project
export function updateProjectTasks(projects: Project[], projectId: string, tasks: Task[]): Project[] {
  return projects.map((p) =>
    p.id === projectId
      ? { ...p, tasks, updatedAt: new Date() }
      : p
  );
}
