'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Task, TaskStatus, TaskComment } from '@/types/task';
import { generateId } from '@/lib/gantt-utils';
import { useAuth } from '@/components/AuthProvider';
import { commentsApi } from '@/lib/api';
import { MessageSquare, Settings2, Send, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  tasks: Task[];
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  tasks,
  onSave,
  onDelete,
}: TaskDialogProps) {
  const { user } = useAuth();
  const isEditing = !!task;

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('not-started');
  const [progress, setProgress] = useState(0);
  const [isMilestone, setIsMilestone] = useState(false);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [parentId, setParentId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  // Fetch comments from API when task changes
  useEffect(() => {
    async function fetchComments() {
      if (task && open) {
        const taskId = Number(task.id);
        if (!isNaN(taskId)) {
          setLoadingComments(true);
          try {
            const response = await commentsApi.getByTask(taskId);
            if (response.success && response.data) {
              const fetchedComments: TaskComment[] = response.data.map(c => ({
                id: String(c.id),
                taskId: String(c.task_id),
                userId: c.user_id ? String(c.user_id) : 'anonymous',
                userName: c.user_name || 'Anonymous',
                content: c.content,
                createdAt: new Date(c.created_at),
              }));
              setComments(fetchedComments);
            }
          } catch (error) {
            console.error('Failed to fetch comments:', error);
          }
          setLoadingComments(false);
        }
      }
    }

    if (task) {
      setName(task.name);
      setStartDate(formatDateForInput(new Date(task.startDate)));
      setEndDate(formatDateForInput(new Date(task.endDate)));
      setStatus(task.status);
      setProgress(task.progress);
      setIsMilestone(task.isMilestone || false);
      setDependencies(task.dependencies || []);
      setParentId(task.parentId || '');
      setNotes(task.notes || '');
      fetchComments();
    } else {
      setName('');
      setStartDate('');
      setEndDate('');
      setStatus('not-started');
      setProgress(0);
      setIsMilestone(false);
      setDependencies([]);
      setParentId('');
      setNotes('');
      setComments([]);
    }
    setNewComment('');
  }, [task, open]);

  function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async function handleAddComment() {
    if (!newComment.trim() || !task) return;

    const taskId = Number(task.id);
    if (isNaN(taskId)) {
      toast.error('Invalid task ID');
      return;
    }

    setAddingComment(true);
    try {
      const response = await commentsApi.create({
        task_id: taskId,
        user_id: user ? Number(user.id) || undefined : undefined,
        user_name: user?.name || 'Anonymous',
        content: newComment.trim(),
      });

      if (response.success && response.data) {
        const newCommentObj: TaskComment = {
          id: String(response.data.id),
          taskId: String(response.data.task_id),
          userId: response.data.user_id ? String(response.data.user_id) : 'anonymous',
          userName: response.data.user_name || 'Anonymous',
          content: response.data.content,
          createdAt: new Date(response.data.created_at),
        };
        setComments([...comments, newCommentObj]);
        setNewComment('');
        toast.success('Comment added');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    }
    setAddingComment(false);
  }

  function handleSubmit() {
    if (!name || !startDate || !endDate) return;

    const newTask: Task = {
      id: task?.id || generateId(),
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      progress,
      isMilestone,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
      parentId: parentId || undefined,
      order: task?.order || tasks.length + 1,
      notes: notes || undefined,
      comments: comments.length > 0 ? comments : undefined,
    };

    onSave(newTask);
    onOpenChange(false);
  }

  function handleDelete() {
    if (task && onDelete) {
      onDelete(task.id);
      onOpenChange(false);
    }
  }

  // Tasks that can be dependencies (not the current task, not subtasks of current task)
  const availableDependencies = tasks.filter((t) => t.id !== task?.id && t.parentId !== task?.id);

  // Tasks that can be parents (not the current task, not already a subtask)
  const availableParents = tasks.filter((t) => t.id !== task?.id && !t.parentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <DialogHeader>
          <DialogTitle className="text-stone-800 dark:text-white">
            {isEditing ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
          <DialogDescription className="text-stone-500 dark:text-stone-400">
            {isEditing ? 'Modify the task details below.' : 'Fill in the details for your new task.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 dark:bg-stone-700">
            <TabsTrigger value="details" className="flex items-center gap-1.5 dark:data-[state=active]:bg-stone-600">
              <Settings2 className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1.5 dark:data-[state=active]:bg-stone-600">
              <MessageSquare className="w-4 h-4" />
              Comments {comments.length > 0 && `(${comments.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-stone-700 dark:text-stone-200">Task Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter task name"
                    className="border-stone-300 dark:border-stone-600 dark:bg-stone-700 dark:text-white focus:border-orange-500 dark:focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate" className="text-stone-700 dark:text-stone-200">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border-stone-300 dark:border-stone-600 dark:bg-stone-700 dark:text-white focus:border-orange-500 dark:focus:border-teal-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate" className="text-stone-700 dark:text-stone-200">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border-stone-300 dark:border-stone-600 dark:bg-stone-700 dark:text-white focus:border-orange-500 dark:focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-stone-700 dark:text-stone-200">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                      <SelectTrigger className="border-stone-300 dark:border-stone-600 dark:bg-stone-700 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-stone-800 dark:border-stone-700">
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="progress" className="text-stone-700 dark:text-stone-200">Progress (%)</Label>
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="border-stone-300 dark:border-stone-600 dark:bg-stone-700 dark:text-white focus:border-orange-500 dark:focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="milestone"
                    checked={isMilestone}
                    onCheckedChange={(c) => setIsMilestone(c as boolean)}
                  />
                  <Label htmlFor="milestone" className="text-stone-700 dark:text-stone-200 cursor-pointer">
                    Mark as Milestone
                  </Label>
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-stone-700 dark:text-stone-200">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes or details about this task..."
                    rows={3}
                    className="border-stone-300 dark:border-stone-600 dark:bg-stone-700 dark:text-white resize-none"
                  />
                </div>

                {/* Parent Task Selection */}
                {availableParents.length > 0 && (
                  <div className="grid gap-2">
                    <Label htmlFor="parentTask" className="text-stone-700 dark:text-stone-200">Parent Task (for subtask)</Label>
                    <Select value={parentId || "none"} onValueChange={(v) => setParentId(v === "none" ? "" : v)}>
                      <SelectTrigger className="border-stone-300 dark:border-stone-600 dark:bg-stone-700 dark:text-white">
                        <SelectValue placeholder="None (top-level task)" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-stone-800 dark:border-stone-700">
                        <SelectItem value="none">None (top-level task)</SelectItem>
                        {availableParents.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {availableDependencies.length > 0 && (
                  <div className="grid gap-2">
                    <Label className="text-stone-700 dark:text-stone-200">Dependencies</Label>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700">
                      {availableDependencies.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 py-1">
                          <Checkbox
                            id={`dep-${t.id}`}
                            checked={dependencies.includes(t.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setDependencies([...dependencies, t.id]);
                              } else {
                                setDependencies(dependencies.filter((d) => d !== t.id));
                              }
                            }}
                          />
                          <Label htmlFor={`dep-${t.id}`} className="text-sm text-stone-600 dark:text-stone-300 cursor-pointer">
                            {t.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <div className="h-[400px] flex flex-col">
              {/* Comments List */}
              <ScrollArea className="flex-1 pr-4 mb-4">
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-stone-500 py-8">
                    <Loader2 className="w-8 h-8 mb-2 animate-spin text-teal-600" />
                    <p className="text-sm">Loading comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-stone-500 py-8">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs">Be the first to add a comment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 bg-stone-50 dark:bg-stone-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-stone-400 dark:text-stone-500">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-stone-600 dark:text-stone-300 pl-8">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Add Comment */}
              <div className="flex gap-2 pt-2 border-t border-stone-200 dark:border-stone-600">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isEditing ? "Add a comment..." : "Save task first to add comments"}
                  disabled={!isEditing || addingComment}
                  className="flex-1 border-stone-300 dark:border-stone-600 dark:bg-stone-700 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && isEditing) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || !isEditing || addingComment}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {addingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 mt-4">
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-stone-800 dark:bg-teal-600 hover:bg-stone-900 dark:hover:bg-teal-700 text-white"
          >
            {isEditing ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
