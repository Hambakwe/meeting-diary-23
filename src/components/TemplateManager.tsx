'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Flag,
  Calendar,
  ChevronDown,
  ChevronRight,
  Save,
  X,
} from 'lucide-react';
import { templatesApi, type ApiTemplate, type ApiTemplateTask } from '@/lib/api';
import { toast } from 'sonner';

interface TemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplatesChanged?: () => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  projectType: string;
  color: string;
}

interface TaskFormData {
  name: string;
  description: string;
  daysFromStart: number;
  durationDays: number;
  priority: string;
  isMilestone: boolean;
}

const PROJECT_TYPES = [
  { value: 'bond_issuance', label: 'Bond Issuance' },
  { value: 'equity_raise', label: 'Equity Raise' },
  { value: 'merger_acquisition', label: 'Merger & Acquisition' },
  { value: 'ipo', label: 'IPO' },
  { value: 'private_placement', label: 'Private Placement' },
  { value: 'restructuring', label: 'Restructuring' },
  { value: 'other', label: 'Other' },
];

const TEMPLATE_COLORS = [
  { value: '#14b8a6', label: 'Teal' },
  { value: '#f97316', label: 'Orange' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#ef4444', label: 'Red' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#ec4899', label: 'Pink' },
];

export function TemplateManager({ open, onOpenChange, onTemplatesChanged }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ApiTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Template form state
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ApiTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormData>({
    name: '',
    description: '',
    projectType: 'bond_issuance',
    color: '#14b8a6',
  });

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiTemplateTask | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    name: '',
    description: '',
    daysFromStart: 0,
    durationDays: 1,
    priority: 'medium',
    isMilestone: false,
  });

  // Load templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await templatesApi.getAll();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      toast.error('Failed to load templates');
    }
    setLoading(false);
  }, []);

  // Load selected template with tasks
  const loadTemplateDetails = useCallback(async (templateId: number) => {
    try {
      const response = await templatesApi.get(templateId);
      if (response.success && response.data) {
        setSelectedTemplate(response.data);
      }
    } catch (error) {
      toast.error('Failed to load template details');
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, loadTemplates]);

  // Template CRUD handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      description: '',
      projectType: 'bond_issuance',
      color: '#14b8a6',
    });
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (template: ApiTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      projectType: template.project_type,
      color: template.color,
    });
    setShowTemplateForm(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        // Update existing
        const response = await templatesApi.update(editingTemplate.id, {
          name: templateForm.name,
          description: templateForm.description,
          project_type: templateForm.projectType,
          color: templateForm.color,
        });
        if (response.success) {
          toast.success('Template updated');
          loadTemplates();
          if (selectedTemplate?.id === editingTemplate.id) {
            loadTemplateDetails(editingTemplate.id);
          }
        }
      } else {
        // Create new
        const response = await templatesApi.create({
          name: templateForm.name,
          description: templateForm.description,
          project_type: templateForm.projectType,
          color: templateForm.color,
        });
        if (response.success && response.data) {
          toast.success('Template created');
          loadTemplates();
          setSelectedTemplate(response.data);
        }
      }
      setShowTemplateForm(false);
      onTemplatesChanged?.();
    } catch (error) {
      toast.error('Failed to save template');
    }
    setSaving(false);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await templatesApi.delete(templateId);
      if (response.success) {
        toast.success('Template deleted');
        loadTemplates();
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
        onTemplatesChanged?.();
      }
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  // Task CRUD handlers
  const handleAddTask = () => {
    setEditingTask(null);
    setTaskForm({
      name: '',
      description: '',
      daysFromStart: selectedTemplate?.tasks?.length
        ? Math.max(...selectedTemplate.tasks.map(t => t.days_from_start + t.duration_days))
        : 0,
      durationDays: 1,
      priority: 'medium',
      isMilestone: false,
    });
    setShowTaskForm(true);
  };

  const handleEditTask = (task: ApiTemplateTask) => {
    setEditingTask(task);
    setTaskForm({
      name: task.name,
      description: task.description,
      daysFromStart: task.days_from_start,
      durationDays: task.duration_days,
      priority: task.priority,
      isMilestone: task.is_milestone,
    });
    setShowTaskForm(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.name.trim()) {
      toast.error('Task name is required');
      return;
    }

    if (!selectedTemplate) return;

    setSaving(true);
    try {
      if (editingTask) {
        // Update existing task
        const response = await templatesApi.updateTask(editingTask.id, {
          name: taskForm.name,
          description: taskForm.description,
          days_from_start: taskForm.daysFromStart,
          duration_days: taskForm.durationDays,
          priority: taskForm.priority,
          is_milestone: taskForm.isMilestone,
        });
        if (response.success && response.data) {
          toast.success('Task updated');
          setSelectedTemplate(response.data);
        }
      } else {
        // Add new task
        const response = await templatesApi.addTask(selectedTemplate.id, {
          name: taskForm.name,
          description: taskForm.description,
          days_from_start: taskForm.daysFromStart,
          duration_days: taskForm.durationDays,
          priority: taskForm.priority,
          is_milestone: taskForm.isMilestone,
        });
        if (response.success && response.data) {
          toast.success('Task added');
          setSelectedTemplate(response.data);
        }
      }
      setShowTaskForm(false);
      loadTemplates(); // Refresh task counts
    } catch (error) {
      toast.error('Failed to save task');
    }
    setSaving(false);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await templatesApi.deleteTask(taskId);
      if (response.success && response.data) {
        toast.success('Task deleted');
        setSelectedTemplate(response.data);
        loadTemplates(); // Refresh task counts
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[80vh] dark:bg-stone-900 dark:border-stone-700 flex flex-col">
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Template Manager
          </DialogTitle>
          <DialogDescription className="dark:text-stone-400">
            Create and manage project templates with predefined tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Template List */}
          <div className="w-1/3 border-r border-stone-200 dark:border-stone-700 pr-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium dark:text-white">Templates</h3>
              <Button
                size="sm"
                onClick={handleCreateTemplate}
                className="h-7 px-2 bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100%-40px)]">
                <div className="space-y-2 pr-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                          : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                      onClick={() => loadTemplateDetails(template.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: template.color }}
                        />
                        <span className="font-medium dark:text-white truncate">
                          {template.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {template.project_type.replace('_', ' ')}
                        </Badge>
                        <span>{template.task_count} tasks</span>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
                      No templates yet. Create your first one!
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Template Details / Tasks */}
          <div className="flex-1 overflow-hidden">
            {selectedTemplate ? (
              <div className="h-full flex flex-col">
                {/* Template Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: selectedTemplate.color }}
                      />
                      <h3 className="text-lg font-semibold dark:text-white">
                        {selectedTemplate.name}
                      </h3>
                    </div>
                    {selectedTemplate.description && (
                      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                        {selectedTemplate.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                      <Badge variant="secondary">
                        {selectedTemplate.project_type.replace('_', ' ')}
                      </Badge>
                      <span>{selectedTemplate.tasks?.length || 0} tasks</span>
                      <span>~{selectedTemplate.total_duration_days} days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(selectedTemplate)}
                      className="h-8 px-2"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                      className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium dark:text-white">Template Tasks</h4>
                  <Button
                    size="sm"
                    onClick={handleAddTask}
                    className="h-7 px-2 bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Task
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-2">
                    {selectedTemplate.tasks?.map((task, index) => (
                      <div
                        key={task.id}
                        className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-stone-400 w-5 flex-shrink-0 mt-0.5">
                              {index + 1}.
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium dark:text-white">
                                  {task.name}
                                </span>
                                {task.is_milestone && (
                                  <Flag className="w-3.5 h-3.5 text-orange-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Day {task.days_from_start + 1}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.duration_days}d
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    task.priority === 'critical' ? 'border-red-500 text-red-500' :
                                    task.priority === 'high' ? 'border-orange-500 text-orange-500' :
                                    task.priority === 'low' ? 'border-stone-400 text-stone-400' :
                                    'border-stone-300 text-stone-500'
                                  }`}
                                >
                                  {task.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="h-6 w-6 p-0"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!selectedTemplate.tasks || selectedTemplate.tasks.length === 0) && (
                      <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
                        No tasks yet. Add tasks to this template.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-500 dark:text-stone-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a template to view details</p>
                  <p className="text-sm">or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Template Form Dialog */}
        <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
          <DialogContent className="sm:max-w-[450px] dark:bg-stone-800 dark:border-stone-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="templateName" className="dark:text-stone-200">
                  Template Name
                </Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Bond Issuance"
                  className="dark:bg-stone-700 dark:border-stone-600"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="templateDesc" className="dark:text-stone-200">
                  Description
                </Label>
                <Textarea
                  id="templateDesc"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Brief description of this template"
                  rows={2}
                  className="dark:bg-stone-700 dark:border-stone-600 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="dark:text-stone-200">Project Type</Label>
                  <Select
                    value={templateForm.projectType}
                    onValueChange={(v) => setTemplateForm({ ...templateForm, projectType: v })}
                  >
                    <SelectTrigger className="dark:bg-stone-700 dark:border-stone-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-stone-700 dark:border-stone-600">
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="dark:text-stone-200">Color</Label>
                  <Select
                    value={templateForm.color}
                    onValueChange={(v) => setTemplateForm({ ...templateForm, color: v })}
                  >
                    <SelectTrigger className="dark:bg-stone-700 dark:border-stone-600">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: templateForm.color }}
                        />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-stone-700 dark:border-stone-600">
                      {TEMPLATE_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                {editingTemplate ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Form Dialog */}
        <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
          <DialogContent className="sm:max-w-[450px] dark:bg-stone-800 dark:border-stone-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {editingTask ? 'Edit Task' : 'Add Task'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="taskName" className="dark:text-stone-200">
                  Task Name
                </Label>
                <Input
                  id="taskName"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  placeholder="e.g., Due Diligence Review"
                  className="dark:bg-stone-700 dark:border-stone-600"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taskDesc" className="dark:text-stone-200">
                  Description <span className="text-stone-400 text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="taskDesc"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={2}
                  className="dark:bg-stone-700 dark:border-stone-600 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="dark:text-stone-200">Days from Start</Label>
                  <Input
                    type="number"
                    min="0"
                    value={taskForm.daysFromStart}
                    onChange={(e) => setTaskForm({ ...taskForm, daysFromStart: Number(e.target.value) })}
                    className="dark:bg-stone-700 dark:border-stone-600"
                  />
                  <p className="text-xs text-stone-400">Task starts on day {taskForm.daysFromStart + 1}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="dark:text-stone-200">Duration (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={taskForm.durationDays}
                    onChange={(e) => setTaskForm({ ...taskForm, durationDays: Math.max(1, Number(e.target.value)) })}
                    className="dark:bg-stone-700 dark:border-stone-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="dark:text-stone-200">Priority</Label>
                  <Select
                    value={taskForm.priority}
                    onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}
                  >
                    <SelectTrigger className="dark:bg-stone-700 dark:border-stone-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-stone-700 dark:border-stone-600">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="dark:text-stone-200">Milestone</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Checkbox
                      id="isMilestone"
                      checked={taskForm.isMilestone}
                      onCheckedChange={(c) => setTaskForm({ ...taskForm, isMilestone: c as boolean })}
                    />
                    <Label htmlFor="isMilestone" className="text-sm dark:text-stone-300 cursor-pointer">
                      Mark as milestone
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTaskForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveTask}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                {editingTask ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
