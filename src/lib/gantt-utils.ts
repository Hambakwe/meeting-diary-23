import type { Task, ZoomLevel } from '@/types/task';

export function getDateRange(tasks: Task[]): { start: Date; end: Date } {
  if (tasks.length === 0) {
    const today = new Date();
    return {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth() + 2, 0),
    };
  }

  let minDate = new Date(tasks[0].startDate);
  let maxDate = new Date(tasks[0].endDate);

  for (const task of tasks) {
    if (new Date(task.startDate) < minDate) {
      minDate = new Date(task.startDate);
    }
    if (new Date(task.endDate) > maxDate) {
      maxDate = new Date(task.endDate);
    }
  }

  // Add padding
  minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 15);

  return { start: minDate, end: maxDate };
}

export function getDaysBetween(start: Date, end: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / oneDay);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getColumnWidth(zoom: ZoomLevel): number {
  switch (zoom) {
    case 'day':
      return 40;
    case 'week':
      return 20;
    case 'month':
      return 8;
    default:
      return 20;
  }
}

export function getDateColumns(start: Date, end: Date, zoom: ZoomLevel): Date[] {
  const columns: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    columns.push(new Date(current));
    if (zoom === 'month') {
      current.setDate(current.getDate() + 7); // Weekly intervals for month view
    } else if (zoom === 'week') {
      current.setDate(current.getDate() + 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
  }

  return columns;
}

export function getMonthsInRange(start: Date, end: Date): { month: string; year: number; days: number }[] {
  const months: { month: string; year: number; days: number }[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    const monthStart = new Date(current);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

    const rangeStart = monthStart < start ? start : monthStart;
    const rangeEnd = monthEnd > end ? end : monthEnd;
    const days = getDaysBetween(rangeStart, rangeEnd) + 1;

    months.push({
      month: current.toLocaleDateString('en-US', { month: 'short' }),
      year: current.getFullYear(),
      days: days,
    });

    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

export function getTaskBarPosition(
  task: Task,
  rangeStart: Date,
  columnWidth: number
): { left: number; width: number } {
  const startOffset = getDaysBetween(rangeStart, new Date(task.startDate));
  const duration = getDaysBetween(new Date(task.startDate), new Date(task.endDate)) + 1;

  return {
    left: startOffset * columnWidth,
    width: Math.max(duration * columnWidth - 4, 8),
  };
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function getTodayPosition(rangeStart: Date, columnWidth: number): number {
  const today = new Date();
  const offset = getDaysBetween(rangeStart, today);
  return offset * columnWidth + columnWidth / 2;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getStatusColor(status: Task['status']): string {
  switch (status) {
    case 'complete':
      return 'bg-teal-500';
    case 'in-progress':
      return 'bg-orange-500';
    case 'not-started':
      return 'bg-rose-400';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusBgColor(status: Task['status']): string {
  switch (status) {
    case 'complete':
      return 'bg-teal-200';
    case 'in-progress':
      return 'bg-amber-200';
    case 'not-started':
      return 'bg-stone-200 dark:bg-stone-600'; // Pale gray for not-started
    default:
      return 'bg-gray-200';
  }
}

/**
 * Critical Path Method (CPM) Implementation
 * Calculates the critical path through the project network
 */
export function calculateCriticalPath(tasks: Task[]): string[] {
  if (tasks.length === 0) return [];

  // Build a map for quick task lookup
  const taskMap = new Map<string, Task>();
  for (const task of tasks) {
    taskMap.set(task.id, task);
  }

  // Calculate task duration in days
  const getDuration = (task: Task): number => {
    return getDaysBetween(new Date(task.startDate), new Date(task.endDate)) + 1;
  };

  // Build adjacency list (task -> tasks that depend on it)
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();

  for (const task of tasks) {
    successors.set(task.id, []);
    predecessors.set(task.id, task.dependencies || []);
  }

  for (const task of tasks) {
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        const succs = successors.get(depId) || [];
        succs.push(task.id);
        successors.set(depId, succs);
      }
    }
  }

  // Forward pass - calculate Early Start (ES) and Early Finish (EF)
  const earlyStart = new Map<string, number>();
  const earlyFinish = new Map<string, number>();

  // Topological sort for forward pass
  const visited = new Set<string>();
  const sorted: string[] = [];

  const topSort = (taskId: string) => {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const task = taskMap.get(taskId);
    if (task?.dependencies) {
      for (const depId of task.dependencies) {
        if (taskMap.has(depId)) {
          topSort(depId);
        }
      }
    }
    sorted.push(taskId);
  };

  for (const task of tasks) {
    topSort(task.id);
  }

  // Forward pass
  for (const taskId of sorted) {
    const task = taskMap.get(taskId);
    if (!task) continue;

    const duration = getDuration(task);
    const deps = predecessors.get(taskId) || [];

    let es = 0;
    for (const depId of deps) {
      const depEf = earlyFinish.get(depId) || 0;
      es = Math.max(es, depEf);
    }

    earlyStart.set(taskId, es);
    earlyFinish.set(taskId, es + duration);
  }

  // Backward pass - calculate Late Start (LS) and Late Finish (LF)
  const lateStart = new Map<string, number>();
  const lateFinish = new Map<string, number>();

  // Find project end time
  let projectEnd = 0;
  for (const ef of earlyFinish.values()) {
    projectEnd = Math.max(projectEnd, ef);
  }

  // Backward pass (reverse order)
  for (let i = sorted.length - 1; i >= 0; i--) {
    const taskId = sorted[i];
    const task = taskMap.get(taskId);
    if (!task) continue;

    const duration = getDuration(task);
    const succs = successors.get(taskId) || [];

    let lf = projectEnd;
    for (const succId of succs) {
      const succLs = lateStart.get(succId);
      if (succLs !== undefined) {
        lf = Math.min(lf, succLs);
      }
    }

    lateFinish.set(taskId, lf);
    lateStart.set(taskId, lf - duration);
  }

  // Calculate slack and identify critical path
  // Critical tasks have zero slack (ES === LS)
  const criticalTasks: string[] = [];

  for (const task of tasks) {
    const es = earlyStart.get(task.id) || 0;
    const ls = lateStart.get(task.id) || 0;
    const slack = ls - es;

    if (slack === 0) {
      criticalTasks.push(task.id);
    }
  }

  return criticalTasks;
}

/**
 * Get formatted duration string
 */
export function getTaskDurationText(task: Task): string {
  const days = getDaysBetween(new Date(task.startDate), new Date(task.endDate)) + 1;
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 14) return '1 week';
  const weeks = Math.round(days / 7);
  return `${weeks} weeks`;
}

/**
 * Get status text
 */
export function getStatusText(status: Task['status']): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in-progress':
      return 'In Progress';
    case 'not-started':
      return 'Not Started';
    default:
      return status;
  }
}

/**
 * Format date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endStr = new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}
