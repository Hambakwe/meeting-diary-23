'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Layers,
  PlusCircle,
  ListTodo,
  Copy,
  Trash2,
  Edit,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TemplateTask {
  id: number;
  name: string;
  duration_days: number;
  offset_days: number;
  is_milestone: boolean;
}

interface Template {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  task_count?: number;
  tasks?: TemplateTask[];
}

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    project_type: 'general',
  });

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManage = isAdmin || isManager;

  useEffect(() => {
    // Wait for auth to fully initialize before making any decisions
    if (authLoading) return;

    // Only redirect if auth is done AND user doesn't have permission
    if (!canManage) {
      router.replace('/');
      return;
    }

    fetchTemplates();
  }, [canManage, authLoading, router]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates.php');
      const data = await res.json();
      if (data.success) {
        // Fetch task count for each template
        const templatesWithTasks = await Promise.all(
          (data.data || []).map(async (template: Template) => {
            try {
              const taskRes = await fetch(`/api/templates.php?id=${template.id}&tasks=1`);
              const taskData = await taskRes.json();
              return {
                ...template,
                tasks: taskData.success ? taskData.data : [],
                task_count: taskData.success ? taskData.data.length : 0,
              };
            } catch {
              return { ...template, tasks: [], task_count: 0 };
            }
          })
        );
        setTemplates(templatesWithTasks);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const res = await fetch('/api/templates.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplate.name,
          description: newTemplate.description,
          project_type: newTemplate.project_type,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateDialogOpen(false);
        setNewTemplate({ name: '', description: '', project_type: 'general' });
        fetchTemplates();
      } else {
        alert('Error creating template: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    try {
      const res = await fetch(`/api/templates.php?id=${templateId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
      } else {
        alert('Error deleting template: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </PortalLayout>
    );
  }

  // Show nothing if user doesn't have permission (redirect will happen)
  if (!canManage) {
    return null;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 dark:text-white flex items-center gap-2">
              <Layers className="h-7 w-7 text-amber-500" />
              Project Templates
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mt-1">
              Create and manage reusable project templates
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Create a template that can be used to quickly set up new projects.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Bond Issuance Template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Describe when to use this template..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select
                    value={newTemplate.project_type}
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, project_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="bond_issuance">Bond Issuance</SelectItem>
                      <SelectItem value="equity_raise">Equity Raise</SelectItem>
                      <SelectItem value="merger_acquisition">Merger & Acquisition</SelectItem>
                      <SelectItem value="ipo">IPO</SelectItem>
                      <SelectItem value="restructuring">Restructuring</SelectItem>
                      <SelectItem value="refinancing">Refinancing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Loading templates...</div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Layers className="h-12 w-12 mx-auto text-stone-300 dark:text-stone-600 mb-4" />
              <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300">No templates yet</h3>
              <p className="text-stone-500 mt-1">Create your first template to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name}
                        <Badge variant="outline" className="ml-2">
                          {template.task_count || 0} tasks
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {template.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.tasks && template.tasks.length > 0 && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="tasks" className="border-none">
                        <AccordionTrigger className="py-2 text-sm text-stone-600 dark:text-stone-400 hover:no-underline">
                          <span className="flex items-center gap-2">
                            <ListTodo className="h-4 w-4" />
                            View Tasks ({template.tasks.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {template.tasks.map((task, index) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50"
                              >
                                <span className="text-xs text-stone-400 w-6">{index + 1}.</span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{task.name}</p>
                                  <p className="text-xs text-stone-500">
                                    {task.duration_days} days • Starts day {task.offset_days}
                                    {task.is_milestone && ' • Milestone'}
                                  </p>
                                </div>
                                {task.is_milestone && (
                                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                    Milestone
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
