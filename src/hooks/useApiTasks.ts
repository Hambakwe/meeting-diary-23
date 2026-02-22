'use client';

import { useState, useEffect, useCallback } from 'react';
import { tasksApi, type ApiTask } from '@/lib/api';
import type { Task, TaskComment } from '@/types/task';

// Convert API task to frontend Task
function apiTaskToTask(apiTask: ApiTask): Task {
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
    notes: apiTask.notes || undefined,
    color: apiTask.color || undefined,
  };
}

// Convert frontend Task to API format
function taskToApiTask(task: Task, projectId: number): Partial<ApiTask> {
  return {
    project_id: projectId,
    name: task.name,
    description: '',
    notes: task.notes || '',
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
    dependencies: task.dependencies?.map(Number).filter(n => !isNaN(n)),
    parent_id: task.parentId ? Number(task.parentId) : null,
    color: task.color || null,
  };
}

interface UseApiTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTask: (task: Task) => Promise<Task | null>;
  updateTask: (task: Task) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  reorderTasks: (tasks: Task[]) => Promise<void>;
}

export function useApiTasks(projectId: number | null): UseApiTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await tasksApi.getByProject(projectId);

    if (response.success && response.data) {
      const fetchedTasks = response.data.map(apiTaskToTask);
      // Sort by start date, then end date
      fetchedTasks.sort((a, b) => {
        const startDiff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        if (startDiff !== 0) return startDiff;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      });
      setTasks(fetchedTasks);
    } else {
      setError(response.error || 'Failed to fetch tasks');
      setTasks([]);
    }

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Helper function to sort tasks by date
  const sortTasksByDate = (taskList: Task[]): Task[] => {
    return [...taskList].sort((a, b) => {
      const startDiff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (startDiff !== 0) return startDiff;
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });
  };

  const createTask = useCallback(async (task: Task): Promise<Task | null> => {
    if (!projectId) return null;

    const apiTask = taskToApiTask(task, projectId);
    const response = await tasksApi.create(apiTask);

    if (response.success && response.data) {
      const newTask = apiTaskToTask(response.data);
      // Add new task and re-sort by date to insert in correct position
      setTasks(prev => sortTasksByDate([...prev, newTask]));
      return newTask;
    }

    setError(response.error || 'Failed to create task');
    return null;
  }, [projectId]);

  const updateTask = useCallback(async (task: Task): Promise<Task | null> => {
    if (!projectId) return null;

    const taskId = Number(task.id);
    if (isNaN(taskId)) {
      setError('Invalid task ID');
      return null;
    }

    const apiTask = taskToApiTask(task, projectId);
    const response = await tasksApi.update(taskId, apiTask);

    if (response.success && response.data) {
      const updatedTask = apiTaskToTask(response.data);
      // Update task and re-sort by date in case dates changed
      setTasks(prev => sortTasksByDate(prev.map(t => t.id === task.id ? updatedTask : t)));
      return updatedTask;
    }

    setError(response.error || 'Failed to update task');
    return null;
  }, [projectId]);

  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    const id = Number(taskId);
    if (isNaN(id)) {
      setError('Invalid task ID');
      return false;
    }

    const response = await tasksApi.delete(id);

    if (response.success) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      return true;
    }

    setError(response.error || 'Failed to delete task');
    return false;
  }, []);

  const reorderTasks = useCallback(async (reorderedTasks: Task[]) => {
    if (!projectId) return;

    // Re-sort by date after drag operation (tasks are primarily sorted by date)
    const sortedTasks = sortTasksByDate(reorderedTasks);
    const updatedTasks = sortedTasks.map((task, index) => ({
      ...task,
      order: index + 1,
    }));
    setTasks(updatedTasks);

    // Update in background
    const taskOrders = updatedTasks.map(t => ({
      id: Number(t.id),
      order: t.order,
    })).filter(t => !isNaN(t.id));

    await tasksApi.reorder(projectId, taskOrders);
  }, [projectId]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
}
