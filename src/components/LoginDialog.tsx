'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { DEMO_USERS } from '@/types/user';
import { User, Shield, Briefcase, Building2, FileCode, Database, CheckCircle2, AlertCircle } from 'lucide-react';

interface VersionInfo {
  file: {
    version: string;
    build_date: string;
  };
  database: {
    version: string | null;
    build_date: string | null;
  };
  current_version: string;
  versions_match: boolean;
}

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleIcons = {
  admin: Shield,
  manager: Briefcase,
  client: Building2,
};

const roleColors = {
  admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  manager: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  client: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
};

const roleDescriptions = {
  admin: 'Full access to all features and settings',
  manager: 'Create projects, manage tasks, allocate clients',
  client: 'View allocated projects and track progress',
};

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login } = useAuth();
  const { resolvedTheme } = useTheme();
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  // Fetch version info when dialog opens
  useEffect(() => {
    if (open) {
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
    }
  }, [open]);

  const handleLogin = (userId: string) => {
    login(userId);
    onOpenChange(false);
  };

  // Group users by role
  const admins = DEMO_USERS.filter(u => u.role === 'admin');
  const managers = DEMO_USERS.filter(u => u.role === 'manager');
  const clients = DEMO_USERS.filter(u => u.role === 'client');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 mb-4">
            {/* Logo - use transparent logo with invert filter for light mode */}
            <img
              src="/images/logo/OCFLogoSTrans.png"
              alt="Oasis Capital Finance"
              className={`h-12 w-auto object-contain ${
                resolvedTheme === 'dark' ? '' : 'invert'
              }`}
            />
            <div className="text-center">
              <DialogTitle className="text-stone-800 dark:text-white">
                Client Portal
              </DialogTitle>
              <DialogDescription className="text-stone-500 dark:text-stone-400">
                Select a user to continue
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Admins */}
          <div>
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Administrators
            </h3>
            <div className="space-y-2">
              {admins.map(user => (
                <UserCard key={user.id} user={user} onSelect={handleLogin} />
              ))}
            </div>
          </div>

          {/* Managers */}
          <div>
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Managers
            </h3>
            <div className="space-y-2">
              {managers.map(user => (
                <UserCard key={user.id} user={user} onSelect={handleLogin} />
              ))}
            </div>
          </div>

          {/* Clients */}
          <div>
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Clients
            </h3>
            <div className="space-y-2">
              {clients.map(user => (
                <UserCard key={user.id} user={user} onSelect={handleLogin} />
              ))}
            </div>
          </div>
        </div>

        {/* Version Info Footer */}
        {versionInfo && (
          <div className="pt-4 mt-2 border-t border-stone-200 dark:border-stone-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span className="font-medium">
                Portal {versionInfo.current_version}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <FileCode className="h-3 w-3 text-blue-500" />
                  File: {versionInfo.file.version}
                </span>
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3 text-green-500" />
                  DB: {versionInfo.database.version || 'N/A'}
                </span>
                {versionInfo.versions_match ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserCard({
  user,
  onSelect,
}: {
  user: (typeof DEMO_USERS)[0];
  onSelect: (userId: string) => void;
}) {
  const Icon = roleIcons[user.role];

  return (
    <button
      type="button"
      onClick={() => onSelect(user.id)}
      className={`w-full p-3 rounded-lg border ${roleColors[user.role]} hover:opacity-80 transition-all text-left flex items-center gap-3`}
    >
      <div className="w-10 h-10 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-xs opacity-70 truncate">{user.email}</p>
      </div>
      <span className="text-xs font-medium uppercase opacity-60">
        {user.role}
      </span>
    </button>
  );
}
