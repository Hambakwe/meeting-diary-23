'use client';

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import type { Task, ZoomLevel, FilterOption } from '@/types/task';
import {
  getDateRange,
  getColumnWidth,
  getTaskBarPosition,
  getTodayPosition,
  getDaysBetween,
  getStatusColor,
  getStatusBgColor,
  calculateCriticalPath,
  getTaskDurationText,
  getStatusText,
  formatDateRange,
} from '@/lib/gantt-utils';
import { GripVertical, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GanttChartProps {
  tasks: Task[];
  allTasks?: Task[];
  zoom: ZoomLevel;
  filter: FilterOption;
  showDependencies: boolean;
  showCriticalPath: boolean;
  onTaskClick?: (task: Task) => void;
  onReorderTasks?: (tasks: Task[]) => void;
  projectName?: string;
}

// Sortable task row component
function SortableTaskRow({
  task,
  index,
  isCritical,
  showCriticalPath,
  onTaskClick,
  hasSubtasks,
  isSubtask,
  isCollapsed,
  onToggleCollapse,
}: {
  task: Task;
  index: number;
  isCritical: boolean;
  showCriticalPath: boolean;
  onTaskClick?: (task: Task) => void;
  hasSubtasks: boolean;
  isSubtask: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`h-10 px-4 flex items-center gap-2 border-b border-stone-100 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 cursor-pointer transition-colors ${
        index % 2 === 0 ? 'bg-stone-50 dark:bg-stone-800' : 'bg-white dark:bg-stone-900'
      } ${isCritical ? 'border-l-2 border-l-red-500' : ''} ${
        isDragging ? 'opacity-50 shadow-lg z-50' : ''
      } ${isSubtask ? 'pl-10' : ''}`}
      onClick={() => onTaskClick?.(task)}
      onKeyDown={(e) => e.key === 'Enter' && onTaskClick?.(task)}
      role="button"
      tabIndex={0}
    >
      <div
        {...attributes}
        {...listeners}
        className="drag-handle p-1 -m-1 rounded hover:bg-stone-200 dark:hover:bg-stone-600"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 flex-shrink-0" />
      </div>

      {hasSubtasks && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-600 rounded"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
          )}
        </button>
      )}

      <span className={`text-sm truncate ${isCritical ? 'text-red-700 dark:text-red-400 font-medium' : 'text-stone-700 dark:text-stone-200'}`}>
        {task.name}
      </span>

      {isCritical && (
        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
      )}
    </div>
  );
}

export function GanttChart({
  tasks,
  allTasks,
  zoom,
  filter,
  showDependencies,
  showCriticalPath,
  onTaskClick,
  onReorderTasks,
  projectName = 'Project',
}: GanttChartProps) {
  const taskListRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const timelineHeaderRef = useRef<HTMLDivElement>(null);

  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get parent tasks and organize hierarchy
  const taskHierarchy = useMemo(() => {
    const parentTasks = tasks.filter(t => !t.parentId);
    const childTasksMap = new Map<string, Task[]>();

    for (const task of tasks) {
      if (task.parentId) {
        const children = childTasksMap.get(task.parentId) || [];
        children.push(task);
        childTasksMap.set(task.parentId, children);
      }
    }

    return { parentTasks, childTasksMap };
  }, [tasks]);

  // Flatten tasks for display, respecting collapsed state
  const displayTasks = useMemo(() => {
    const result: Task[] = [];
    const { parentTasks, childTasksMap } = taskHierarchy;

    for (const parent of parentTasks) {
      result.push(parent);
      if (!collapsedTasks.has(parent.id)) {
        const children = childTasksMap.get(parent.id) || [];
        result.push(...children);
      }
    }

    return result;
  }, [taskHierarchy, collapsedTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return displayTasks;
    return displayTasks.filter((t) => t.status === filter);
  }, [displayTasks, filter]);

  // Calculate critical path from all tasks
  const criticalPathIds = useMemo(() => {
    if (!showCriticalPath) return new Set<string>();
    const tasksForCalc = allTasks || tasks;
    return new Set(calculateCriticalPath(tasksForCalc));
  }, [allTasks, tasks, showCriticalPath]);

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getDateRange(allTasks || tasks),
    [allTasks, tasks]
  );

  const columnWidth = getColumnWidth(zoom);
  const totalDays = getDaysBetween(rangeStart, rangeEnd);
  const chartWidth = totalDays * columnWidth;

  const todayPosition = useMemo(
    () => getTodayPosition(rangeStart, columnWidth),
    [rangeStart, columnWidth]
  );

  const months = useMemo(() => {
    const monthList: { name: string; year: number; startDay: number; days: number }[] = [];
    const current = new Date(rangeStart);

    while (current <= rangeEnd) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      const effectiveStart = monthStart < rangeStart ? rangeStart : monthStart;
      const effectiveEnd = monthEnd > rangeEnd ? rangeEnd : monthEnd;

      const startDay = getDaysBetween(rangeStart, effectiveStart);
      const days = getDaysBetween(effectiveStart, effectiveEnd) + 1;

      monthList.push({
        name: current.toLocaleDateString('en-US', { month: 'short' }),
        year: current.getFullYear(),
        startDay,
        days,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return monthList;
  }, [rangeStart, rangeEnd]);

  const dayLabels = useMemo(() => {
    const labels: { day: number; position: number }[] = [];
    const current = new Date(rangeStart);
    let dayIndex = 0;

    while (current <= rangeEnd) {
      if (zoom === 'day' || (zoom === 'week' && dayIndex % 7 === 0) || (zoom === 'month' && current.getDate() === 1)) {
        labels.push({
          day: current.getDate(),
          position: dayIndex * columnWidth,
        });
      }
      current.setDate(current.getDate() + 1);
      dayIndex++;
    }

    return labels;
  }, [rangeStart, rangeEnd, zoom, columnWidth]);

  const isToday = todayPosition >= 0 && todayPosition <= chartWidth;

  const rowHeight = 40;

  const handleTaskListScroll = useCallback(() => {
    if (taskListRef.current && chartAreaRef.current) {
      chartAreaRef.current.scrollTop = taskListRef.current.scrollTop;
    }
  }, []);

  const handleChartScroll = useCallback(() => {
    if (taskListRef.current && chartAreaRef.current && timelineHeaderRef.current) {
      taskListRef.current.scrollTop = chartAreaRef.current.scrollTop;
      timelineHeaderRef.current.scrollLeft = chartAreaRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    if (chartAreaRef.current && timelineHeaderRef.current && filteredTasks.length > 0) {
      const firstTask = filteredTasks[0];
      const { left } = getTaskBarPosition(firstTask, rangeStart, columnWidth);
      const scrollToPosition = Math.max(0, left - 50);
      chartAreaRef.current.scrollLeft = scrollToPosition;
      timelineHeaderRef.current.scrollLeft = scrollToPosition;
    }
  }, [filteredTasks, rangeStart, columnWidth]);

  const criticalPathCount = showCriticalPath ? criticalPathIds.size : 0;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
      const newIndex = filteredTasks.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(filteredTasks, oldIndex, newIndex);
      onReorderTasks?.(newOrder);
    }
  };

  const toggleCollapse = (taskId: string) => {
    setCollapsedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-full bg-stone-800 dark:bg-stone-900 rounded-b-xl overflow-hidden">
        {/* Header Section */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-800 dark:bg-stone-900 border-b border-stone-700">
          <div>
            <h2 className="text-lg font-semibold text-white">{projectName}</h2>
            <p className="text-sm text-stone-400">
              {filteredTasks.length} of {(allTasks || tasks).length} tasks
              {showCriticalPath && criticalPathCount > 0 && (
                <span className="ml-2 text-red-400">
                  ({criticalPathCount} critical)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-stone-300">Complete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-stone-300">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="text-stone-300">Not Started</span>
            </div>
            {showCriticalPath && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded ring-2 ring-red-500 ring-offset-1 ring-offset-stone-800" />
                <span className="text-stone-300">Critical</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Task Names Column */}
          <div className="w-64 md:w-80 flex-shrink-0 bg-stone-50 dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 flex flex-col">
            {/* Column Header */}
            <div className="h-[72px] px-4 flex items-end pb-2 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex-shrink-0">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Task Name</span>
            </div>

            {/* Task List with Drag and Drop */}
            <div
              ref={taskListRef}
              className="flex-1 overflow-y-auto overflow-x-hidden"
              onScroll={handleTaskListScroll}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredTasks.map((task, idx) => {
                    const isCritical = showCriticalPath && criticalPathIds.has(task.id);
                    const hasSubtasks = taskHierarchy.childTasksMap.has(task.id);
                    const isSubtask = !!task.parentId;

                    return (
                      <SortableTaskRow
                        key={task.id}
                        task={task}
                        index={idx}
                        isCritical={isCritical}
                        showCriticalPath={showCriticalPath}
                        onTaskClick={onTaskClick}
                        hasSubtasks={hasSubtasks}
                        isSubtask={isSubtask}
                        isCollapsed={collapsedTasks.has(task.id)}
                        onToggleCollapse={() => toggleCollapse(task.id)}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Timeline and Bars */}
          <div className="flex-1 overflow-hidden flex flex-col min-w-0">
            {/* Timeline Header */}
            <div
              ref={timelineHeaderRef}
              className="h-[72px] bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 relative flex-shrink-0 overflow-x-hidden"
            >
              <div style={{ width: chartWidth, minWidth: '100%' }} className="h-full relative">
                {/* Month Labels */}
                <div className="h-9 flex items-center border-b border-stone-200 dark:border-stone-700">
                  {months.map((month, idx) => (
                    <div
                      key={`${month.name}-${month.year}-${idx}`}
                      className="flex items-center justify-center text-xs font-medium text-stone-600 dark:text-stone-300 border-r border-stone-200 dark:border-stone-700 h-full flex-shrink-0"
                      style={{ width: month.days * columnWidth }}
                    >
                      {month.name} {month.year}
                    </div>
                  ))}
                </div>

                {/* Day Labels */}
                <div className="h-[36px] relative">
                  {dayLabels.map((label, idx) => (
                    <div
                      key={`day-${idx}`}
                      className="absolute top-0 h-full flex items-center justify-center text-[10px] text-stone-500 dark:text-stone-400"
                      style={{
                        left: label.position,
                        width: zoom === 'week' ? columnWidth * 7 : columnWidth,
                      }}
                    >
                      {label.day}
                    </div>
                  ))}

                  {isToday && (
                    <div
                      className="absolute top-0 h-full flex flex-col items-center z-20"
                      style={{ left: todayPosition - 20 }}
                    >
                      <div className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        TODAY
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task Bars Area */}
            <div
              ref={chartAreaRef}
              className="flex-1 overflow-auto bg-stone-50 dark:bg-stone-800"
              onScroll={handleChartScroll}
            >
              <div
                className="relative"
                style={{
                  width: chartWidth,
                  minWidth: '100%',
                  height: filteredTasks.length * rowHeight,
                }}
              >
                {/* Grid lines */}
                {Array.from({ length: Math.ceil(totalDays / (zoom === 'week' ? 7 : 1)) }).map((_, idx) => (
                  <div
                    key={`grid-${idx}`}
                    className="absolute top-0 bottom-0 border-l border-stone-200 dark:border-stone-700"
                    style={{ left: idx * columnWidth * (zoom === 'week' ? 7 : 1) }}
                  />
                ))}

                {/* Today vertical line */}
                {isToday && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10"
                    style={{ left: todayPosition }}
                  />
                )}

                {/* Task Bars */}
                {filteredTasks.map((task, idx) => {
                  const { left, width } = getTaskBarPosition(task, rangeStart, columnWidth);
                  const progressWidth = (width * task.progress) / 100;
                  const isCritical = showCriticalPath && criticalPathIds.has(task.id);
                  const showPercentage = width > 40;
                  const isSubtask = !!task.parentId;

                  return (
                    <div
                      key={task.id}
                      className="absolute flex items-center"
                      style={{
                        top: idx * rowHeight,
                        height: rowHeight,
                        left: 0,
                        right: 0,
                      }}
                    >
                      {/* Row background */}
                      <div className={`absolute inset-0 ${idx % 2 === 0 ? 'bg-stone-50 dark:bg-stone-800' : 'bg-white dark:bg-stone-900'} border-b border-stone-100 dark:border-stone-700`} />

                      {/* Task bar with tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute h-6 rounded-md ${getStatusBgColor(task.status)} cursor-pointer hover:opacity-90 transition-all overflow-hidden shadow-sm border ${task.status === 'not-started' ? 'border-stone-400 dark:border-stone-500' : 'border-transparent'} ${isCritical ? 'ring-2 ring-red-500 ring-offset-1' : ''} ${isSubtask ? 'h-5' : ''}`}
                            style={{ left: left + 4, width }}
                            onClick={() => onTaskClick?.(task)}
                            onKeyDown={(e) => e.key === 'Enter' && onTaskClick?.(task)}
                            role="button"
                            tabIndex={0}
                          >
                            {/* Progress fill */}
                            <div
                              className={`h-full ${getStatusColor(task.status)} ${task.progress < 100 ? 'rounded-l-md' : 'rounded-md'} ${task.progress === 0 ? 'opacity-0' : ''}`}
                              style={{ width: task.progress === 0 ? '100%' : progressWidth }}
                            />
                            {/* Percentage label - inside bar when progress > 50% */}
                            {showPercentage && task.progress > 50 && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-stone-800 dark:text-stone-900">
                                {task.progress}%
                              </span>
                            )}
                            {/* Show 0% label for not-started tasks */}
                            {showPercentage && task.progress === 0 && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-stone-500 dark:text-stone-400">
                                0%
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-stone-900 text-white border-stone-700 px-3 py-2 max-w-xs"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">{task.name}</p>
                            <div className="text-xs text-stone-300 space-y-0.5">
                              <p>{formatDateRange(task.startDate, task.endDate)}</p>
                              <p>Duration: {getTaskDurationText(task)}</p>
                              <p>Status: <span className={`font-medium ${task.status === 'complete' ? 'text-teal-400' : task.status === 'in-progress' ? 'text-orange-400' : 'text-rose-400'}`}>{getStatusText(task.status)}</span></p>
                              <p>Progress: {task.progress}%</p>
                              {isCritical && (
                                <p className="text-red-400 font-medium flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Critical Path
                                </p>
                              )}
                              {task.dependencies && task.dependencies.length > 0 && (
                                <p>Dependencies: {task.dependencies.length}</p>
                              )}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      {/* Percentage label outside bar for low progress */}
                      {showPercentage && task.progress <= 50 && (
                        <span
                          className="absolute text-[10px] font-semibold text-stone-600 dark:text-stone-300 pointer-events-none"
                          style={{ left: left + width + 8, top: '50%', transform: 'translateY(-50%)' }}
                        >
                          {task.progress}%
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Dependencies lines */}
                {showDependencies && (
                  <svg
                    className="absolute top-0 left-0 pointer-events-none z-20"
                    style={{ width: chartWidth, height: filteredTasks.length * rowHeight }}
                  >
                    {filteredTasks.map((task) => {
                      if (!task.dependencies) return null;

                      return task.dependencies.map((depId) => {
                        const depTask = filteredTasks.find((t) => t.id === depId);
                        if (!depTask) return null;

                        const depIdx = filteredTasks.indexOf(depTask);
                        const taskIdx = filteredTasks.indexOf(task);

                        const { left: depLeft, width: depWidth } = getTaskBarPosition(depTask, rangeStart, columnWidth);
                        const { left: taskLeft } = getTaskBarPosition(task, rangeStart, columnWidth);

                        const startX = depLeft + depWidth + 4;
                        const startY = depIdx * rowHeight + rowHeight / 2;
                        const endX = taskLeft + 4;
                        const endY = taskIdx * rowHeight + rowHeight / 2;

                        const midX = (startX + endX) / 2;

                        const isCriticalDep = showCriticalPath && criticalPathIds.has(task.id) && criticalPathIds.has(depId);

                        return (
                          <path
                            key={`dep-${depId}-${task.id}`}
                            d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                            fill="none"
                            stroke={isCriticalDep ? '#ef4444' : '#78716c'}
                            strokeWidth={isCriticalDep ? '2' : '1.5'}
                            strokeDasharray={isCriticalDep ? '0' : '4'}
                          />
                        );
                      });
                    })}
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
