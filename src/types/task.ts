export type TaskStatus = 'complete' | 'in-progress' | 'not-started';

// Comment type for task discussions
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number; // 0-100
  status: TaskStatus;
  dependencies?: string[]; // IDs of dependent tasks
  isMilestone?: boolean;
  order: number;
  parentId?: string; // For subtasks - ID of parent task
  collapsed?: boolean; // For parent tasks - whether subtasks are collapsed
  color?: string; // Custom color for task bar
  comments?: TaskComment[]; // Task comments/notes
  notes?: string; // Quick notes field
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export type ZoomLevel = 'day' | 'week' | 'month';

export type FilterOption = 'all' | 'complete' | 'in-progress' | 'not-started';

// API response types for PHP backend
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiTask {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: TaskStatus;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  is_milestone: boolean;
  task_order: number;
  dependencies?: number[];
  parent_id?: number;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Convert API task to frontend task
export function apiTaskToTask(apiTask: ApiTask): Task {
  return {
    id: String(apiTask.id),
    name: apiTask.name,
    startDate: new Date(apiTask.start_date),
    endDate: new Date(apiTask.end_date),
    progress: apiTask.progress,
    status: apiTask.status,
    isMilestone: apiTask.is_milestone,
    order: apiTask.task_order,
    dependencies: apiTask.dependencies?.map(String),
    parentId: apiTask.parent_id ? String(apiTask.parent_id) : undefined,
  };
}

// Convert frontend task to API task
export function taskToApiTask(task: Task, projectId = 1): Partial<ApiTask> {
  return {
    project_id: projectId,
    name: task.name,
    start_date: task.startDate instanceof Date
      ? task.startDate.toISOString().split('T')[0]
      : new Date(task.startDate).toISOString().split('T')[0],
    end_date: task.endDate instanceof Date
      ? task.endDate.toISOString().split('T')[0]
      : new Date(task.endDate).toISOString().split('T')[0],
    progress: task.progress,
    status: task.status,
    is_milestone: task.isMilestone || false,
    task_order: task.order,
    dependencies: task.dependencies?.map(Number),
    parent_id: task.parentId ? Number(task.parentId) : undefined,
  };
}
