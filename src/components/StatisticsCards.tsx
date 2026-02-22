'use client';

import { Card } from '@/components/ui/card';
import type { Task } from '@/types/task';
import { Clipboard, CheckCircle, Clock, Sparkles, BarChart3 } from 'lucide-react';

interface StatisticsCardsProps {
  tasks: Task[];
}

export function StatisticsCards({ tasks }: StatisticsCardsProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'complete').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const milestones = tasks.filter((t) => t.isMilestone).length;
  const avgProgress = tasks.length > 0
    ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
    : 0;

  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: Clipboard,
      color: 'text-stone-600 dark:text-stone-300',
      bgColor: 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
      iconBg: 'bg-stone-100 dark:bg-stone-700',
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800',
      iconBg: 'bg-teal-100 dark:bg-teal-800/50',
    },
    {
      label: 'In Progress',
      value: inProgressTasks,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      iconBg: 'bg-orange-100 dark:bg-orange-800/50',
    },
    {
      label: 'Milestones',
      value: milestones,
      icon: Sparkles,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
      iconBg: 'bg-cyan-100 dark:bg-cyan-800/50',
    },
    {
      label: 'Avg. Progress',
      value: `${avgProgress}%`,
      icon: BarChart3,
      color: 'text-stone-600 dark:text-stone-300',
      bgColor: 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
      iconBg: 'bg-stone-100 dark:bg-stone-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`p-3 md:p-4 border ${stat.bgColor} rounded-xl shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${stat.color} opacity-80`}>
                {stat.label}
              </p>
              <p className={`text-2xl md:text-3xl font-bold ${stat.color} mt-0.5`}>
                {stat.value}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
