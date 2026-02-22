'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth, type Project, type TemplateTask } from '@/components/AuthProvider';
import {
  FolderKanban,
  ChevronDown,
  Plus,
  Check,
  Users,
  UserPlus,
  Loader2,
  Calendar,
  FileText,
  Clock,
  Flag,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { canCreateProject, canAllocateClient } from '@/types/user';
import { toast } from 'sonner';

interface ProjectSelectorProps {
  onProjectChange?: (project: Project) => void;
}

export function ProjectSelector({ onProjectChange }: ProjectSelectorProps) {
  const {
    user,
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    allocateProjectToClient,
    getAllClients,
    templates,
    loadTemplates,
    getTemplateWithTasks,
  } = useAuth();

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [projectStartDate, setProjectStartDate] = useState<string>('');
  const [projectClientId, setProjectClientId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTasks, setPreviewTasks] = useState<TemplateTask[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const canCreate = user && canCreateProject(user.role);
  const canAllocate = user && canAllocateClient(user.role);
  const clients = getAllClients();

  // Load templates when dialog opens
  useEffect(() => {
    if (newProjectOpen && templates.length === 0) {
      loadTemplates();
    }
  }, [newProjectOpen, templates.length, loadTemplates]);

  // Set default start date to today when dialog opens
  useEffect(() => {
    if (newProjectOpen && !projectStartDate) {
      const today = new Date();
      setProjectStartDate(today.toISOString().split('T')[0]);
    }
  }, [newProjectOpen, projectStartDate]);

  const loadPreview = useCallback(async (templateId: string) => {
    if (!templateId) return;
    setLoadingPreview(true);
    const template = await getTemplateWithTasks(Number(templateId));
    if (template?.tasks) {
      setPreviewTasks(template.tasks);
    }
    setLoadingPreview(false);
  }, [getTemplateWithTasks]);

  // Load template preview when template changes
  useEffect(() => {
    if (selectedTemplateId && showPreview) {
      loadPreview(selectedTemplateId);
    }
  }, [selectedTemplateId, showPreview, loadPreview]);

  // Get selected template info
  const selectedTemplate = templates.find(t => String(t.id) === selectedTemplateId);

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    onProjectChange?.(project);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    // Validate: if template selected, start date is required
    if (selectedTemplateId && !projectStartDate) {
      toast.error('Please select a start date for the project');
      return;
    }

    setIsCreating(true);
    try {
      const templateId = selectedTemplateId ? Number(selectedTemplateId) : undefined;
      const startDate = selectedTemplateId ? projectStartDate : undefined;
      const clientId = projectClientId || undefined;

      const project = await createProject(projectName, projectDescription, templateId, startDate, clientId);
      if (project) {
        onProjectChange?.(project);
        const templateName = selectedTemplate?.name;
        if (templateName) {
          toast.success(`Project created from "${templateName}" template`);
        } else {
          toast.success('Project created');
        }
        resetDialog();
      } else {
        toast.error('Failed to create project');
      }
    } catch (error) {
      toast.error('Failed to create project');
    }
    setIsCreating(false);
  };

  const resetDialog = () => {
    setNewProjectOpen(false);
    setProjectName('');
    setProjectDescription('');
    setSelectedTemplateId('');
    setProjectStartDate('');
    setProjectClientId('');
    setShowPreview(false);
    setPreviewTasks([]);
  };

  const handleAllocateClient = async () => {
    if (!currentProject || !selectedClientId) return;
    setIsAllocating(true);
    try {
      await allocateProjectToClient(currentProject.id, selectedClientId);
      toast.success('Project allocated to client');
      setAllocateOpen(false);
      setSelectedClientId('');
    } catch (error) {
      toast.error('Failed to allocate project');
    }
    setIsAllocating(false);
  };

  const togglePreview = async () => {
    if (!showPreview && selectedTemplateId && previewTasks.length === 0) {
      await loadPreview(selectedTemplateId);
    }
    setShowPreview(!showPreview);
  };

  // Calculate preview dates based on start date
  const getPreviewDate = (daysFromStart: number): string => {
    if (!projectStartDate) return `Day ${daysFromStart + 1}`;
    const date = new Date(projectStartDate);
    date.setDate(date.getDate() + daysFromStart);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!currentProject) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => canCreate && setNewProjectOpen(true)}
        className="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300"
      >
        <FolderKanban className="w-4 h-4 mr-1.5" />
        No Project
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 gap-2 max-w-[200px]"
          >
            <FolderKanban className="w-4 h-4 flex-shrink-0" />
            <span className="truncate hidden sm:inline">{currentProject.name}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 dark:bg-stone-800 dark:border-stone-700">
          <DropdownMenuLabel className="text-xs text-stone-500 dark:text-stone-400">
            Projects
          </DropdownMenuLabel>

          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleSelectProject(project)}
              className="dark:hover:bg-stone-700 cursor-pointer flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate dark:text-white">{project.name}</p>
                {project.clientName && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {project.clientName}
                  </p>
                )}
              </div>
              {currentProject.id === project.id && (
                <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 ml-2" />
              )}
            </DropdownMenuItem>
          ))}

          {canCreate && (
            <>
              <DropdownMenuSeparator className="dark:bg-stone-700" />
              <DropdownMenuItem
                onClick={() => setNewProjectOpen(true)}
                className="dark:hover:bg-stone-700 cursor-pointer text-teal-600 dark:text-teal-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </DropdownMenuItem>
            </>
          )}

          {canAllocate && currentProject && (
            <DropdownMenuItem
              onClick={() => setAllocateOpen(true)}
              className="dark:hover:bg-stone-700 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Allocate to Client
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Project Dialog */}
      <Dialog open={newProjectOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className={`dark:bg-stone-900 dark:border-stone-700 ${showPreview && previewTasks.length > 0 ? 'sm:max-w-[800px]' : 'sm:max-w-[500px]'}`}>
          <DialogHeader>
            <DialogTitle className="dark:text-white">Create New Project</DialogTitle>
            <DialogDescription className="dark:text-stone-400">
              Select a template to pre-populate tasks, or create an empty project.
            </DialogDescription>
          </DialogHeader>

          <div className={`flex gap-4 ${showPreview && previewTasks.length > 0 ? 'flex-row' : 'flex-col'}`}>
            {/* Main Form */}
            <div className={`grid gap-4 py-4 ${showPreview && previewTasks.length > 0 ? 'w-1/2' : 'w-full'}`}>
              {/* Template Selection */}
              <div className="grid gap-2">
                <Label htmlFor="template" className="dark:text-stone-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Project Template
                </Label>
                <Select
                  value={selectedTemplateId || "none"}
                  onValueChange={(v) => {
                    setSelectedTemplateId(v === "none" ? "" : v);
                    setPreviewTasks([]);
                  }}
                >
                  <SelectTrigger className="dark:bg-stone-800 dark:border-stone-700 dark:text-white">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-stone-800 dark:border-stone-700">
                    <SelectItem value="none">
                      <span className="text-stone-500">No template (empty project)</span>
                    </SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-stone-500">
                            {template.taskCount} tasks, ~{template.totalDurationDays} days
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {selectedTemplate.description || `${selectedTemplate.taskCount} tasks over ${selectedTemplate.totalDurationDays} days`}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={togglePreview}
                      className="text-xs text-teal-600 dark:text-teal-400 h-6 px-2"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {showPreview ? 'Hide' : 'Preview'} Tasks
                    </Button>
                  </div>
                )}
              </div>

              {/* Start Date - only shown when template is selected */}
              {selectedTemplateId && (
                <div className="grid gap-2">
                  <Label htmlFor="startDate" className="dark:text-stone-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Project Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                    className="dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                  />
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    All task dates will be calculated from this start date
                  </p>
                </div>
              )}

              {/* Project Name */}
              <div className="grid gap-2">
                <Label htmlFor="name" className="dark:text-stone-200">
                  Project Name
                </Label>
                <Input
                  id="name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description" className="dark:text-stone-200">
                  Description <span className="text-stone-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief project description"
                  className="dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                />
              </div>

              {/* Client Selection */}
              {clients.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="projectClient" className="dark:text-stone-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Assign to Client <span className="text-stone-400 text-xs">(optional)</span>
                  </Label>
                  <Select
                    value={projectClientId || "none"}
                    onValueChange={(v) => setProjectClientId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="dark:bg-stone-800 dark:border-stone-700 dark:text-white">
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-stone-800 dark:border-stone-700">
                      <SelectItem value="none">
                        <span className="text-stone-500">No client assigned</span>
                      </SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Task Preview Panel */}
            {showPreview && selectedTemplateId && (
              <div className="w-1/2 border-l border-stone-200 dark:border-stone-700 pl-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium dark:text-white">Task Preview</h4>
                  <Badge variant="secondary" className="text-xs">
                    {previewTasks.length} tasks
                  </Badge>
                </div>
                {loadingPreview ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                  </div>
                ) : (
                  <ScrollArea className="h-[350px] pr-3">
                    <div className="space-y-2">
                      {previewTasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="p-2 bg-stone-50 dark:bg-stone-800 rounded-md border border-stone-200 dark:border-stone-700"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-stone-400 dark:text-stone-500 w-5 flex-shrink-0">
                              {index + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium dark:text-white truncate">
                                  {task.name}
                                </span>
                                {task.isMilestone && (
                                  <Flag className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 dark:text-stone-400">
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="w-3 h-3" />
                                  {getPreviewDate(task.daysFromStart)}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {task.durationDays}d
                                </span>
                                {task.priority !== 'medium' && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1 py-0 h-4 ${
                                      task.priority === 'critical' ? 'border-red-500 text-red-500' :
                                      task.priority === 'high' ? 'border-orange-500 text-orange-500' :
                                      'border-stone-400 text-stone-400'
                                    }`}
                                  >
                                    {task.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetDialog}
              className="dark:border-stone-600 dark:text-stone-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={isCreating || !projectName.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : selectedTemplateId ? (
                `Create with ${selectedTemplate?.taskCount || 0} Tasks`
              ) : (
                'Create Empty Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Client Dialog */}
      <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-stone-900 dark:border-stone-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Allocate to Client</DialogTitle>
            <DialogDescription className="dark:text-stone-400">
              Assign this project to a client so they can view progress.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="dark:text-stone-200">Project</Label>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {currentProject?.name}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client" className="dark:text-stone-200">
                Select Client
              </Label>
              <Select value={selectedClientId || "none"} onValueChange={(v) => setSelectedClientId(v === "none" ? "" : v)}>
                <SelectTrigger className="dark:bg-stone-800 dark:border-stone-700 dark:text-white">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-stone-800 dark:border-stone-700">
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAllocateOpen(false)}
              className="dark:border-stone-600 dark:text-stone-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAllocateClient}
              disabled={isAllocating}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isAllocating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Allocating...
                </>
              ) : (
                'Allocate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
