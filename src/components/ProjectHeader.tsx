'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Upload, Download, Image as ImageIcon, RefreshCw, Plus, Moon, Sun, Monitor, Settings } from 'lucide-react';
import type { AppSettings } from '@/lib/settings-store';

interface ProjectHeaderProps {
  projectName: string;
  projectDescription: string;
  onAddTask: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onRefresh: () => void;
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onOpenSettings?: () => void;
  settings?: AppSettings;
}

export function ProjectHeader({
  projectName,
  projectDescription,
  onAddTask,
  onExportPNG,
  onExportJSON,
  onImportJSON,
  onRefresh,
  theme,
  resolvedTheme,
  onThemeChange,
  onOpenSettings,
  settings: externalSettings,
}: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
      {/* Mobile project name */}
      <div className="md:hidden">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-white truncate max-w-[150px]">
          {projectName}
        </h2>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onImportJSON}
          className="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
        >
          <Upload className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Import</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportJSON}
          className="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
        >
          <Download className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportPNG}
          className="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
        >
          <ImageIcon className="w-4 h-4 mr-1.5" />
          PNG
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-teal-500 dark:border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 gap-1.5"
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : theme === 'system' ? (
                <Monitor className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              <span className="hidden sm:inline text-xs">Theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="dark:bg-stone-800 dark:border-stone-700">
            <DropdownMenuItem onClick={() => onThemeChange('light')} className="dark:hover:bg-stone-700">
              <Sun className="w-4 h-4 mr-2" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onThemeChange('dark')} className="dark:hover:bg-stone-700">
              <Moon className="w-4 h-4 mr-2" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onThemeChange('system')} className="dark:hover:bg-stone-700">
              <Monitor className="w-4 h-4 mr-2" />
              System
            </DropdownMenuItem>
            {onOpenSettings && (
              <>
                <DropdownMenuSeparator className="dark:bg-stone-700" />
                <DropdownMenuItem onClick={onOpenSettings} className="dark:hover:bg-stone-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          onClick={onAddTask}
          className="bg-stone-800 dark:bg-teal-600 hover:bg-stone-900 dark:hover:bg-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
