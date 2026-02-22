'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ProjectHeader } from '@/components/ProjectHeader';
import { StatisticsCards } from '@/components/StatisticsCards';
import { GanttControls } from '@/components/GanttControls';
import { GanttChart } from '@/components/GanttChart';
import { TaskDialog } from '@/components/TaskDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { TemplateManager } from '@/components/TemplateManager';
import { ProjectSelector } from '@/components/ProjectSelector';
import { toast } from 'sonner';
import type { Task, ZoomLevel, FilterOption } from '@/types/task';
import { useApiTasks } from '@/hooks/useApiTasks';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/components/AuthProvider';
import { getSettings, type AppSettings } from '@/lib/settings-store';
import { canAddTask, canEditTask, canAccessAdminTools } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Loader2, FileText, RefreshCw } from 'lucide-react';

export function TimelinePage() {
  const { user, currentProject, loading: authLoading } = useAuth();

  // Get project ID for API calls
  const projectId = currentProject ? Number(currentProject.id) : null;

  // Use API for tasks
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
    createTask: apiCreateTask,
    updateTask: apiUpdateTask,
    deleteTask: apiDeleteTask,
    reorderTasks: apiReorderTasks,
  } = useApiTasks(projectId);

  // Local undo/redo state (in-memory only, doesn't persist)
  const [undoStack, setUndoStack] = useState<Task[][]>([]);
  const [redoStack, setRedoStack] = useState<Task[][]>([]);
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDependencies, setShowDependencies] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);

  // Load settings on mount
  useEffect(() => {
    setAppSettings(getSettings());
  }, []);

  // Show error toast if API fails
  useEffect(() => {
    if (tasksError) {
      toast.error(`Failed to load tasks: ${tasksError}`);
    }
  }, [tasksError]);

  // Get display names from settings or current project
  const displayProjectName = currentProject?.name || appSettings?.defaultProjectName || 'OCF Bond Issuance Project';
  const displayProjectDescription = currentProject?.description || appSettings?.defaultProjectDescription || 'Project Timeline & Task Management';

  // Filter tasks based on search query
  const searchFilteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task =>
      task.name.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  // Check permissions
  const userCanAddTask = user ? canAddTask(user.role) : true;
  const userCanEditTask = user ? canEditTask(user.role) : true;
  const userIsAdmin = user ? canAccessAdminTools(user.role) : false;

  // Push to undo stack before changes
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-49), tasks]);
    setRedoStack([]);
  }, [tasks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (userCanAddTask) handleAddTask();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setShowDependencies(prev => !prev);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCriticalPath(prev => !prev);
      }

      if (e.key === '1') setZoom('day');
      if (e.key === '2') setZoom('week');
      if (e.key === '3') setZoom('month');

      if (e.key === 'Escape' && dialogOpen) {
        setDialogOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, userCanAddTask]);

  const handleAddTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSaveTask = async (task: Task) => {
    pushUndo();

    const isEditing = !!editingTask;

    if (isEditing) {
      const result = await apiUpdateTask(task);
      if (result) {
        toast.success('Task updated');
      } else {
        toast.error('Failed to update task');
      }
    } else {
      const result = await apiCreateTask(task);
      if (result) {
        toast.success('Task added');
      } else {
        toast.error('Failed to add task');
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    pushUndo();

    const success = await apiDeleteTask(taskId);
    if (success) {
      toast.success('Task deleted');
    } else {
      toast.error('Failed to delete task');
    }
  };

  const handleReorderTasks = async (reorderedTasks: Task[]) => {
    await apiReorderTasks(reorderedTasks);
  };

  const handleExportPNG = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const chartElement = document.getElementById('gantt-chart-container');
      if (!chartElement) return;

      const canvas = await html2canvas(chartElement, {
        backgroundColor: resolvedTheme === 'dark' ? '#1c1917' : '#fafaf9',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `${displayProjectName.replace(/\s+/g, '-').toLowerCase()}-gantt.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Chart exported as PNG');
    } catch (error) {
      toast.error('Failed to export PNG');
    }
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${displayProjectName.replace(/\s+/g, '-').toLowerCase()}-tasks.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success('Tasks exported as JSON');
  };

  const handleImportJSON = () => {
    toast.info('Import from JSON is disabled when using the database backend');
  };

  const handleRefresh = async () => {
    await refetchTasks();
    setSearchQuery('');
    toast.success('Tasks refreshed from server');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    toast.success('Settings saved');
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      setRedoStack(prev => [...prev, tasks]);
      setUndoStack(prev => prev.slice(0, -1));
      toast.info('Undo (local only - refresh to sync with server)');
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      setUndoStack(prev => [...prev, tasks]);
      setRedoStack(prev => prev.slice(0, -1));
      toast.info('Redo (local only - refresh to sync with server)');
    }
  };

  const isLoading = authLoading || tasksLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-white">
            Project Timeline
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            {displayProjectDescription}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project Selector */}
          <ProjectSelector />

          {/* Loading indicator */}
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          )}

          {/* Admin: Template Manager */}
          {userIsAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplateManagerOpen(true)}
              className="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              title="Manage Templates"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Templates</span>
            </Button>
          )}

          {/* Undo/Redo */}
          <div className="flex items-center border-r border-stone-200 dark:border-stone-700 pr-2 mr-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Secondary Header with controls */}
      <ProjectHeader
        projectName={displayProjectName}
        projectDescription={displayProjectDescription}
        onAddTask={userCanAddTask ? handleAddTask : () => toast.error('You do not have permission to add tasks')}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onRefresh={handleRefresh}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onThemeChange={handleThemeChange}
        onOpenSettings={() => setSettingsOpen(true)}
        settings={appSettings || undefined}
      />

      {/* Statistics Cards */}
      <StatisticsCards tasks={tasks} />

      {/* Gantt Chart Container */}
      <div id="gantt-chart-container" ref={chartRef} className="rounded-xl overflow-hidden shadow-lg">
        {/* Controls */}
        <GanttControls
          zoom={zoom}
          onZoomChange={setZoom}
          filter={filter}
          onFilterChange={setFilter}
          showDependencies={showDependencies}
          onShowDependenciesChange={setShowDependencies}
          showCriticalPath={showCriticalPath}
          onShowCriticalPathChange={setShowCriticalPath}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Gantt Chart */}
        <div className="h-[calc(100vh-520px)] min-h-[400px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-stone-50 dark:bg-stone-800">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-stone-500 dark:text-stone-400">Loading tasks...</p>
              </div>
            </div>
          ) : (
            <GanttChart
              tasks={searchFilteredTasks}
              allTasks={tasks}
              zoom={zoom}
              filter={filter}
              showDependencies={showDependencies}
              showCriticalPath={showCriticalPath}
              onTaskClick={userCanEditTask ? handleTaskClick : undefined}
              onReorderTasks={handleReorderTasks}
              projectName={displayProjectName}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-stone-500 dark:text-stone-400">
        <p className="text-xs">
          Shortcuts: 1/2/3 = Zoom | Ctrl+N = New Task | Ctrl+D = Dependencies | Ctrl+K = Critical Path
        </p>
      </footer>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        tasks={tasks}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSettingsChange={handleSettingsChange}
      />

      {/* Template Manager - Admin Only */}
      <TemplateManager
        open={templateManagerOpen}
        onOpenChange={setTemplateManagerOpen}
      />
    </div>
  );
}
