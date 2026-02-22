'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/AuthProvider';
import { User, LogOut, Shield, Briefcase, Building2, ChevronDown } from 'lucide-react';

const roleIcons = {
  admin: Shield,
  manager: Briefcase,
  client: Building2,
};

const roleBadgeColors = {
  admin: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
  manager: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400',
  client: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
};

interface UserMenuProps {
  onLoginClick: () => void;
}

export function UserMenu({ onLoginClick }: UserMenuProps) {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onLoginClick}
        className="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
      >
        <User className="w-4 h-4 mr-1.5" />
        <span className="hidden sm:inline">Login</span>
      </Button>
    );
  }

  const RoleIcon = roleIcons[user.role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 gap-2"
        >
          <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
            <RoleIcon className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 dark:bg-stone-800 dark:border-stone-700">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium dark:text-white">{user.name}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit mt-1 ${roleBadgeColors[user.role]}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="dark:bg-stone-700" />
        <DropdownMenuItem
          onClick={onLoginClick}
          className="dark:hover:bg-stone-700 cursor-pointer"
        >
          <User className="w-4 h-4 mr-2" />
          Switch User
        </DropdownMenuItem>
        <DropdownMenuSeparator className="dark:bg-stone-700" />
        <DropdownMenuItem
          onClick={logout}
          className="text-red-600 dark:text-red-400 dark:hover:bg-stone-700 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
