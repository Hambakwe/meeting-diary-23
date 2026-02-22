'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { User, UserRole } from '@/types/user';
import { DEMO_USERS } from '@/types/user';
import { projectsApi, templatesApi, type ApiProject, type ApiTemplate } from '@/lib/api';

// Project interface matching API response
export interface Project {
  id: string;
  name: string;
  description: string;
  clientId?: string;
  clientName?: string;
  createdBy: string;
  createdAt: Date;
  isTemplate?: boolean;
  color?: string;
  ownerId?: string;
}

// Template task interface
export interface TemplateTask {
  id: number;
  templateId: number;
  name: string;
  description: string;
  daysFromStart: number;
  durationDays: number;
  priority: string;
  isMilestone: boolean;
  taskOrder: number;
  dependencies: number[];
}

// Template interface
export interface ProjectTemplate {
  id: number;
  name: string;
  description: string;
  projectType: string;
  color: string;
  taskCount: number;
  totalDurationDays: number;
  tasks?: TemplateTask[];
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (userId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  // Project management
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  createProject: (name: string, description: string, templateId?: number, startDate?: string, clientId?: string) => Promise<Project | null>;
  allocateProjectToClient: (projectId: string, clientId: string) => Promise<void>;
  getClientProjects: (clientId: string) => Project[];
  getAllClients: () => User[];
  refreshProjects: () => Promise<void>;
  loading: boolean;
  // Template management
  templates: ProjectTemplate[];
  loadTemplates: () => Promise<void>;
  getTemplateWithTasks: (templateId: number) => Promise<ProjectTemplate | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'gantt-auth-user';
const CURRENT_PROJECT_KEY = 'gantt-current-project';

// Convert API project to frontend Project
function apiProjectToProject(apiProject: ApiProject): Project {
  return {
    id: String(apiProject.id),
    name: apiProject.name,
    description: apiProject.description || '',
    clientId: apiProject.client_id ? String(apiProject.client_id) : undefined,
    clientName: apiProject.client_name || undefined,
    createdBy: apiProject.owner_id ? String(apiProject.owner_id) : 'unknown',
    createdAt: new Date(apiProject.created_at),
    color: apiProject.color,
    ownerId: apiProject.owner_id ? String(apiProject.owner_id) : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);

  // Use ref to track the current user for async operations
  const userRef = useRef<User | null>(null);

  // Combined loading state - true while auth is initializing OR projects are loading during init
  const loading = !authInitialized || (projectsLoading && !authInitialized);

  // Fetch projects from API
  const fetchProjects = useCallback(async (currentUser: User | null, isInitialLoad = false) => {
    setProjectsLoading(true);
    try {
      let response;

      // If user is a client, only fetch their allocated projects
      if (currentUser?.role === 'client') {
        // User IDs now match database IDs directly
        const clientId = Number(currentUser.id);
        response = await projectsApi.getByClient(clientId);
      } else {
        response = await projectsApi.getAll();
      }

      if (response.success && response.data) {
        const fetchedProjects = response.data.map(apiProjectToProject);
        setProjects(fetchedProjects);

        // Try to restore previously selected project
        const savedProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);
        if (savedProjectId) {
          const savedProject = fetchedProjects.find(p => p.id === savedProjectId);
          if (savedProject) {
            setCurrentProjectState(savedProject);
          } else if (fetchedProjects.length > 0) {
            setCurrentProjectState(fetchedProjects[0]);
          }
        } else if (fetchedProjects.length > 0) {
          setCurrentProjectState(fetchedProjects[0]);
        }
      } else {
        console.error('Failed to fetch projects:', response.error);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
      // Only mark auth as initialized after initial load completes
      if (isInitialLoad) {
        setAuthInitialized(true);
      }
    }
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check for user data set by login.php popup
      const userData = localStorage.getItem('gantt-user-data');
      const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);

      let foundUser: User | null = null;

      if (userData) {
        try {
          // User logged in via login.php - use that data
          foundUser = JSON.parse(userData) as User;
        } catch {
          // Invalid JSON, fall through to demo users
        }
      }

      if (!foundUser && savedUserId) {
        foundUser = DEMO_USERS.find(u => u.id === savedUserId) || null;
      }

      // Set user state and ref together
      userRef.current = foundUser;
      setUser(foundUser);

      // Fetch projects with initial load flag
      await fetchProjects(foundUser, true);
    };

    initAuth();
  }, [fetchProjects]);

  // Listen for login success from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GANTT_LOGIN_SUCCESS' && event.data?.user) {
        const apiUser = event.data.user;
        const newUser: User = {
          id: String(apiUser.id),
          name: apiUser.full_name || apiUser.username,
          email: apiUser.email,
          role: apiUser.role as UserRole,
        };
        userRef.current = newUser;
        setUser(newUser);
        localStorage.setItem(AUTH_STORAGE_KEY, String(apiUser.id));
        localStorage.setItem('gantt-user-data', JSON.stringify(newUser));
        fetchProjects(newUser);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchProjects]);

  // Save current project to localStorage
  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem(CURRENT_PROJECT_KEY, project.id);
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  }, []);

  const login = useCallback((userId: string) => {
    const foundUser = DEMO_USERS.find(u => u.id === userId);
    if (foundUser) {
      userRef.current = foundUser;
      setUser(foundUser);
      localStorage.setItem(AUTH_STORAGE_KEY, userId);
      localStorage.setItem('gantt-user-data', JSON.stringify(foundUser));
      // Refresh projects for the new user
      fetchProjects(foundUser);
    }
  }, [fetchProjects]);

  const logout = useCallback(() => {
    userRef.current = null;
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('gantt-user-data');
    // Also logout from server session
    fetch('/api/auth.php?action=logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    // Refresh projects (show all for non-logged-in users)
    fetchProjects(null);
  }, [fetchProjects]);

  // Load templates from API
  const loadTemplates = useCallback(async () => {
    try {
      const response = await templatesApi.getAll();
      if (response.success && response.data) {
        const fetchedTemplates: ProjectTemplate[] = response.data.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          projectType: t.project_type,
          color: t.color,
          taskCount: t.task_count,
          totalDurationDays: t.total_duration_days,
        }));
        setTemplates(fetchedTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  // Get template with full task details for preview
  const getTemplateWithTasks = useCallback(async (templateId: number): Promise<ProjectTemplate | null> => {
    try {
      const response = await templatesApi.get(templateId);
      if (response.success && response.data) {
        const t = response.data;
        return {
          id: t.id,
          name: t.name,
          description: t.description,
          projectType: t.project_type,
          color: t.color,
          taskCount: t.tasks?.length || 0,
          totalDurationDays: t.total_duration_days,
          tasks: t.tasks?.map(task => ({
            id: task.id,
            templateId: task.template_id,
            name: task.name,
            description: task.description,
            daysFromStart: task.days_from_start,
            durationDays: task.duration_days,
            priority: task.priority,
            isMilestone: task.is_milestone,
            taskOrder: task.task_order,
            dependencies: task.dependencies,
          })),
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }, []);

  const createProject = useCallback(async (
    name: string,
    description: string,
    templateId?: number,
    startDate?: string,
    clientId?: string
  ): Promise<Project | null> => {
    try {
      const currentUser = userRef.current;
      const payload: Parameters<typeof projectsApi.create>[0] = {
        name,
        description,
        color: '#14b8a6',
        owner_id: currentUser ? Number(currentUser.id) || 1 : 1,
      };

      // Add template parameters if provided
      if (templateId) {
        (payload as Record<string, unknown>).template_id = templateId;
      }
      if (startDate) {
        (payload as Record<string, unknown>).start_date = startDate;
      }
      if (clientId) {
        (payload as Record<string, unknown>).client_id = Number(clientId);
      }

      const response = await projectsApi.create(payload);

      if (response.success && response.data) {
        const newProject = apiProjectToProject(response.data);
        setProjects(prev => [...prev, newProject]);
        setCurrentProject(newProject);
        return newProject;
      } else {
        console.error('Failed to create project:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }, [setCurrentProject]);

  const allocateProjectToClient = useCallback(async (projectId: string, clientId: string) => {
    const client = DEMO_USERS.find(u => u.id === clientId);
    // User IDs now match database IDs directly
    const dbClientId = Number(clientId);

    try {
      const response = await projectsApi.allocateToClient(
        Number(projectId),
        dbClientId,
        client?.name
      );

      if (response.success && response.data) {
        const updatedProject = apiProjectToProject(response.data);
        setProjects(prev => prev.map(p =>
          p.id === projectId ? updatedProject : p
        ));
      } else {
        console.error('Failed to allocate project:', response.error);
      }
    } catch (error) {
      console.error('Error allocating project:', error);
    }
  }, []);

  const getClientProjects = useCallback((clientId: string): Project[] => {
    return projects.filter(p => p.clientId === clientId);
  }, [projects]);

  const getAllClients = useCallback((): User[] => {
    return DEMO_USERS.filter(u => u.role === 'client');
  }, []);

  const refreshProjects = useCallback(async () => {
    await fetchProjects(userRef.current);
  }, [fetchProjects]);

  return (
    <AuthContext.Provider
      value={{
        user,
        users: DEMO_USERS,
        login,
        logout,
        isAuthenticated: !!user,
        projects,
        currentProject,
        setCurrentProject,
        createProject,
        allocateProjectToClient,
        getClientProjects,
        getAllClients,
        refreshProjects,
        loading,
        templates,
        loadTemplates,
        getTemplateWithTasks,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
