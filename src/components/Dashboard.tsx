'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useApiTasks } from '@/hooks/useApiTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GanttChart,
  FileText,
  Users,
  Book,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Star,
  Activity,
  Target,
  Info,
  Database,
  FileCode,
} from 'lucide-react';

interface VersionInfo {
  file: {
    version: string;
    build_date: string;
  };
  database: {
    version: string | null;
    build_date: string | null;
    features: string | null;
  };
  current_version: string;
  versions_match: boolean;
  status: string;
}

// Quick action cards for navigation
const quickActions = [
  {
    title: 'Project Timeline',
    description: 'View and manage your Gantt chart',
    icon: GanttChart,
    href: '/timeline',
    color: 'from-teal-500 to-teal-600',
  },
  {
    title: 'Document Library',
    description: 'Access deal documents and files',
    icon: FileText,
    href: '/documents',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Deal Team',
    description: 'Contact team members',
    icon: Users,
    href: '/team',
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Diary',
    description: 'Schedule and manage events',
    icon: Book,
    href: '/diary',
    color: 'from-amber-500 to-amber-600',
  },
];

export function Dashboard() {
  const { user, currentProject, projects } = useAuth();
  const projectId = currentProject ? Number(currentProject.id) : null;
  const { tasks, loading } = useApiTasks(projectId);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  // Fetch version info
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch('/api/version.php');
        const data = await res.json();
        if (data.success) {
          setVersionInfo(data.data);
        }
      } catch (error) {
        console.error('Error fetching version:', error);
      }
    };
    fetchVersion();
  }, []);

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'complete').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const notStartedTasks = tasks.filter(t => t.status === 'not-started').length;
  const overdueTasks = tasks.filter(t => {
    const endDate = new Date(t.endDate);
    return endDate < new Date() && t.status !== 'complete';
  }).length;
  const milestones = tasks.filter(t => t.isMilestone).length;
  const completedMilestones = tasks.filter(t => t.isMilestone && t.status === 'complete').length;

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get upcoming milestones
  const upcomingMilestones = tasks
    .filter(t => t.isMilestone && t.status !== 'complete')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 3);

  // Get recent/in-progress tasks
  const activeTasks = tasks
    .filter(t => t.status === 'in-progress')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-white">
            {greeting()}, {user?.name.split(' ')[0] || 'Guest'}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Welcome to your client portal. Here's an overview of your projects.
          </p>
        </div>
        {currentProject && (
          <div className="flex items-center gap-3 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
            <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <div>
              <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Current Project</p>
              <p className="text-sm font-semibold text-stone-800 dark:text-white">{currentProject.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-teal-600" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Total Tasks</p>
                <p className="text-3xl font-bold text-stone-800 dark:text-white mt-1">{totalTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-teal-100 dark:bg-teal-900/30">
                <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Completed</p>
                <p className="text-3xl font-bold text-stone-800 dark:text-white mt-1">{completedTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500 dark:text-stone-400">In Progress</p>
                <p className="text-3xl font-bold text-stone-800 dark:text-white mt-1">{inProgressTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Milestones</p>
                <p className="text-3xl font-bold text-stone-800 dark:text-white mt-1">
                  {completedMilestones}/{milestones}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-800 dark:text-white">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            Project Progress
          </CardTitle>
          <CardDescription className="text-stone-500 dark:text-stone-400">
            Overall completion status of current project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                {completedTasks} of {totalTasks} tasks completed
              </span>
              <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {progressPercent}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            {overdueTasks > 0 && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{overdueTasks} task{overdueTasks > 1 ? 's' : ''} overdue</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-stone-800 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{action.description}</p>
                    <ArrowRight className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-3 group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Milestones */}
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-stone-800 dark:text-white">
                <Star className="h-5 w-5 text-amber-500" />
                Upcoming Milestones
              </CardTitle>
              <Link href="/timeline">
                <Button variant="ghost" size="sm" className="text-teal-600 dark:text-teal-400">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingMilestones.length === 0 ? (
              <p className="text-stone-500 dark:text-stone-400 text-center py-8">
                No upcoming milestones
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-700/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 dark:text-white truncate">
                        {milestone.name}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        Due: {new Date(milestone.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={milestone.status === 'in-progress' ? 'default' : 'secondary'}
                      className={milestone.status === 'in-progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                    >
                      {milestone.progress}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-stone-800 dark:text-white">
                <Clock className="h-5 w-5 text-teal-600" />
                In Progress Tasks
              </CardTitle>
              <Link href="/timeline">
                <Button variant="ghost" size="sm" className="text-teal-600 dark:text-teal-400">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeTasks.length === 0 ? (
              <p className="text-stone-500 dark:text-stone-400 text-center py-8">
                No tasks in progress
              </p>
            ) : (
              <div className="space-y-3">
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-700/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 dark:text-white truncate">
                        {task.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={task.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-stone-500 dark:text-stone-400 w-10">
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Version Info Footer */}
      {versionInfo && (
        <Card className="bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <Info className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800 dark:text-white">
                    Client Portal {versionInfo.current_version}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Oasis Capital Finance
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600">
                  <FileCode className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-stone-600 dark:text-stone-300">
                    File: <span className="font-medium">{versionInfo.file.version}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600">
                  <Database className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-stone-600 dark:text-stone-300">
                    Database: <span className="font-medium">{versionInfo.database.version || 'N/A'}</span>
                  </span>
                </div>
                {versionInfo.versions_match ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Synced
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Version Mismatch
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
