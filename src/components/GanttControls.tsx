'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ZoomLevel, FilterOption } from '@/types/task';
import { Link2, Sparkles, Search, X } from 'lucide-react';

interface GanttControlsProps {
  zoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  filter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  showDependencies: boolean;
  onShowDependenciesChange: (show: boolean) => void;
  showCriticalPath: boolean;
  onShowCriticalPathChange: (show: boolean) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function GanttControls({
  zoom,
  onZoomChange,
  filter,
  onFilterChange,
  showDependencies,
  onShowDependenciesChange,
  showCriticalPath,
  onShowCriticalPathChange,
  searchQuery = '',
  onSearchChange,
}: GanttControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 md:px-6 py-3 bg-white dark:bg-stone-800 border-y border-stone-200 dark:border-stone-700">
      {/* Search */}
      {onSearchChange && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-40 md:w-48 pl-8 pr-8 text-xs bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 dark:text-white dark:placeholder:text-stone-400 focus:ring-1 focus:ring-stone-300 dark:focus:ring-stone-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Zoom:</span>
        <div className="flex bg-white dark:bg-stone-700 rounded-md border border-stone-200 dark:border-stone-600 p-0.5">
          {(['day', 'week', 'month'] as ZoomLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onZoomChange(level)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                zoom === level
                  ? 'bg-stone-800 dark:bg-teal-600 text-white'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Filter:</span>
        <Select value={filter} onValueChange={(v) => onFilterChange(v as FilterOption)}>
          <SelectTrigger className="w-32 h-8 text-xs bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 dark:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:bg-stone-800 dark:border-stone-700">
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Spacer */}
      <div className="flex-1 hidden md:block" />

      {/* Toggle Options */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onShowDependenciesChange(!showDependencies)}
          className={`h-8 text-xs border-stone-200 dark:border-stone-600 ${
            showDependencies
              ? 'bg-stone-800 dark:bg-teal-600 text-white border-stone-800 dark:border-teal-600 hover:bg-stone-900 dark:hover:bg-teal-700'
              : 'bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
          }`}
        >
          <Link2 className="w-3.5 h-3.5 mr-1.5" />
          Dependencies
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onShowCriticalPathChange(!showCriticalPath)}
          className={`h-8 text-xs border-stone-200 dark:border-stone-600 ${
            showCriticalPath
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              : 'bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${showCriticalPath ? 'text-white' : ''}`} />
          Critical Path
        </Button>
      </div>
    </div>
  );
}
