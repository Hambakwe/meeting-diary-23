/**
 * API Client for Gantt Project Manager PHP Backend
 * Uses relative URL for same-domain deployment, or env variable for cross-domain
 */

// Use relative URL '/api' for same-domain deployment
// For cross-domain, set NEXT_PUBLIC_API_URL environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data: data.data ?? data,
      message: data.message,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================
// TASKS API
// ============================================

export interface ApiTask {
  id: number;
  project_id: number;
  parent_id: number | null;
  name: string;
  description: string;
  notes: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'complete';
  priority: string;
  is_milestone: boolean;
  task_order: number;
  color: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  dependencies: number[];
  created_at: string;
  updated_at: string;
}

export const tasksApi = {
  // Get all tasks for a project
  async getByProject(projectId: number): Promise<ApiResponse<ApiTask[]>> {
    return apiFetch<ApiTask[]>(`tasks.php?project_id=${projectId}`);
  },

  // Get single task
  async get(taskId: number): Promise<ApiResponse<ApiTask>> {
    return apiFetch<ApiTask>(`tasks.php?id=${taskId}`);
  },

  // Create task
  async create(task: Partial<ApiTask>): Promise<ApiResponse<ApiTask>> {
    return apiFetch<ApiTask>('tasks.php', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  // Update task
  async update(taskId: number, task: Partial<ApiTask>): Promise<ApiResponse<ApiTask>> {
    return apiFetch<ApiTask>(`tasks.php?id=${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  },

  // Delete task
  async delete(taskId: number): Promise<ApiResponse<null>> {
    return apiFetch<null>(`tasks.php?id=${taskId}`, {
      method: 'DELETE',
    });
  },

  // Reorder tasks
  async reorder(projectId: number, taskOrders: { id: number; order: number }[]): Promise<ApiResponse<null>> {
    // Update each task's order
    const promises = taskOrders.map(({ id, order }) =>
      apiFetch<ApiTask>(`tasks.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ task_order: order }),
      })
    );
    await Promise.all(promises);
    return { success: true };
  },
};

// ============================================
// PROJECTS API
// ============================================

export interface ApiProject {
  id: number;
  name: string;
  description: string;
  color: string;
  owner_id: number | null;
  owner_name: string | null;
  client_id: number | null;
  client_name: string | null;
  is_active: boolean;
  task_count: number;
  completed_count: number;
  avg_progress: number;
  created_at: string;
  updated_at: string;
}

export const projectsApi = {
  // Get all projects
  async getAll(): Promise<ApiResponse<ApiProject[]>> {
    return apiFetch<ApiProject[]>('projects.php');
  },

  // Get projects for a specific client
  async getByClient(clientId: number): Promise<ApiResponse<ApiProject[]>> {
    return apiFetch<ApiProject[]>(`projects.php?client_id=${clientId}`);
  },

  // Get single project
  async get(projectId: number): Promise<ApiResponse<ApiProject>> {
    return apiFetch<ApiProject>(`projects.php?id=${projectId}`);
  },

  // Create project
  async create(project: Partial<ApiProject>): Promise<ApiResponse<ApiProject>> {
    return apiFetch<ApiProject>('projects.php', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  // Update project
  async update(projectId: number, project: Partial<ApiProject>): Promise<ApiResponse<ApiProject>> {
    return apiFetch<ApiProject>(`projects.php?id=${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  },

  // Delete project
  async delete(projectId: number): Promise<ApiResponse<null>> {
    return apiFetch<null>(`projects.php?id=${projectId}`, {
      method: 'DELETE',
    });
  },

  // Allocate project to client
  async allocateToClient(projectId: number, clientId: number, clientName?: string): Promise<ApiResponse<ApiProject>> {
    return apiFetch<ApiProject>(`projects.php?id=${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ client_id: clientId, client_name: clientName }),
    });
  },
};

// ============================================
// COMMENTS API
// ============================================

export interface ApiComment {
  id: number;
  task_id: number;
  user_id: number | null;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const commentsApi = {
  // Get comments for a task
  async getByTask(taskId: number): Promise<ApiResponse<ApiComment[]>> {
    return apiFetch<ApiComment[]>(`comments.php?task_id=${taskId}`);
  },

  // Create comment
  async create(comment: {
    task_id: number;
    user_id?: number;
    user_name?: string;
    content: string;
  }): Promise<ApiResponse<ApiComment>> {
    return apiFetch<ApiComment>('comments.php', {
      method: 'POST',
      body: JSON.stringify({
        task_id: comment.task_id,
        user_id: comment.user_id,
        user_name: comment.user_name,
        comment: comment.content,
      }),
    });
  },

  // Update comment
  async update(commentId: number, content: string): Promise<ApiResponse<ApiComment>> {
    return apiFetch<ApiComment>(`comments.php?id=${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ comment: content }),
    });
  },

  // Delete comment
  async delete(commentId: number): Promise<ApiResponse<null>> {
    return apiFetch<null>(`comments.php?id=${commentId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// USERS API
// ============================================

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'member' | 'viewer' | 'client';
  avatar_url: string | null;
  is_active: boolean;
}

export const usersApi = {
  // Get all users
  async getAll(): Promise<ApiResponse<ApiUser[]>> {
    return apiFetch<ApiUser[]>('auth.php?action=users');
  },

  // Get current user (if authenticated)
  async getCurrentUser(): Promise<ApiResponse<ApiUser>> {
    return apiFetch<ApiUser>('auth.php?action=me');
  },

  // Login
  async login(username: string, password: string): Promise<ApiResponse<{ user: ApiUser; token: string }>> {
    return apiFetch<{ user: ApiUser; token: string }>('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // Logout
  async logout(): Promise<ApiResponse<null>> {
    return apiFetch<null>('auth.php?action=logout', {
      method: 'POST',
    });
  },
};

// ============================================
// TEMPLATES API
// ============================================

export interface ApiTemplateTask {
  id: number;
  template_id: number;
  parent_template_task_id: number | null;
  name: string;
  description: string;
  notes: string;
  days_from_start: number;
  duration_days: number;
  priority: string;
  is_milestone: boolean;
  task_order: number;
  color: string | null;
  dependencies: number[];
}

export interface ApiTemplate {
  id: number;
  name: string;
  description: string;
  project_type: string;
  color: string;
  task_count: number;
  total_duration_days: number;
  tasks?: ApiTemplateTask[];
  created_at: string;
}

export const templatesApi = {
  // Get all active templates
  async getAll(): Promise<ApiResponse<ApiTemplate[]>> {
    return apiFetch<ApiTemplate[]>('templates.php');
  },

  // Get single template with tasks
  async get(templateId: number): Promise<ApiResponse<ApiTemplate>> {
    return apiFetch<ApiTemplate>(`templates.php?id=${templateId}`);
  },

  // Get template tasks only
  async getTasks(templateId: number): Promise<ApiResponse<ApiTemplateTask[]>> {
    return apiFetch<ApiTemplateTask[]>(`templates.php?id=${templateId}&tasks=1`);
  },

  // Create new template
  async create(template: {
    name: string;
    description?: string;
    project_type: string;
    color?: string;
  }): Promise<ApiResponse<ApiTemplate>> {
    return apiFetch<ApiTemplate>('templates.php', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  },

  // Update template
  async update(templateId: number, template: Partial<ApiTemplate>): Promise<ApiResponse<ApiTemplate>> {
    return apiFetch<ApiTemplate>(`templates.php?id=${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  },

  // Delete template
  async delete(templateId: number): Promise<ApiResponse<null>> {
    return apiFetch<null>(`templates.php?id=${templateId}`, {
      method: 'DELETE',
    });
  },

  // Add task to template
  async addTask(templateId: number, task: {
    name: string;
    description?: string;
    notes?: string;
    days_from_start: number;
    duration_days: number;
    priority?: string;
    is_milestone?: boolean;
    dependencies?: number[];
  }): Promise<ApiResponse<ApiTemplate>> {
    return apiFetch<ApiTemplate>(`templates.php?id=${templateId}&action=add_task`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  // Update template task
  async updateTask(taskId: number, task: Partial<ApiTemplateTask>): Promise<ApiResponse<ApiTemplate>> {
    return apiFetch<ApiTemplate>(`templates.php?task_id=${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  },

  // Delete template task
  async deleteTask(taskId: number): Promise<ApiResponse<ApiTemplate>> {
    return apiFetch<ApiTemplate>(`templates.php?task_id=${taskId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// STATISTICS API
// ============================================

export interface ApiStatistics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  not_started_tasks: number;
  milestones: number;
  avg_progress: number;
}

export const statisticsApi = {
  async getByProject(projectId: number): Promise<ApiResponse<ApiStatistics>> {
    return apiFetch<ApiStatistics>(`statistics.php?project_id=${projectId}`);
  },
};
