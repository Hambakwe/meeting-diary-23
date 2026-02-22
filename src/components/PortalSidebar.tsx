'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Calendar,
  GanttChart,
  FileText,
  Users,
  Book,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun,
  PlusCircle,
  FolderKanban,
  UserPlus,
  Layers,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  adminOnly?: boolean;
  managerOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/timeline/', label: 'Project Timeline', icon: GanttChart },
  { href: '/documents/', label: 'Document Library', icon: FileText },
  { href: '/team/', label: 'Deal Team', icon: Users },
  { href: '/diary/', label: 'Diary', icon: Book },
];

// Admin-only menu items
const adminItems: NavItem[] = [
  { href: '/admin/projects/', label: 'Manage Projects', icon: FolderKanban, adminOnly: true },
  { href: '/admin/allocate/', label: 'Allocate to Client', icon: UserPlus, adminOnly: true },
  { href: '/admin/team/', label: 'Team Members', icon: Users, managerOnly: true },
  { href: '/admin/templates/', label: 'Templates', icon: Layers, managerOnly: true },
];

interface PortalSidebarProps {
  className?: string;
}

export function PortalSidebar({ className }: PortalSidebarProps) {
  const pathname = usePathname();
  const { user, logout, currentProject } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManage = isAdmin || isManager;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Filter admin items based on user role
  const visibleAdminItems = adminItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.managerOnly && !canManage) return false;
    return true;
  });

  return (
    <>
      {/* Mobile Header Bar - Shows logo and menu button on mobile */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo - use transparent logo with invert filter for light mode */}
          <img
            src="/images/logo/OCFLogoSTrans.png"
            alt="Oasis Capital Finance"
            className={`h-8 w-auto object-contain ${
              resolvedTheme === 'dark' ? '' : 'invert'
            }`}
          />
          {/* Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-stone-700 dark:text-stone-300"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-stone-900 dark:bg-stone-950 text-white transition-all duration-300 flex flex-col',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Logo Area - Desktop sidebar uses white logo for dark background */}
        <div className="flex items-center gap-3 p-4 border-b border-stone-700/50">
          {collapsed ? (
            /* Collapsed: Show OCF initials */
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-bold text-sm">OCF</span>
            </div>
          ) : (
            /* Expanded: Show white logo for dark sidebar - no background/frame */
            <img
              src="/images/logo/OCFLogoSTrans.png"
              alt="Oasis Capital Finance"
              className="h-8 w-auto object-contain"
            />
          )}
        </div>

        {/* Current Project */}
        {currentProject && !collapsed && (
          <div className="px-4 py-3 border-b border-stone-700/50">
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Current Project</p>
            <p className="text-sm font-medium text-teal-400 truncate">{currentProject.name}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Main Navigation */}
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                      isActive
                        ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                        : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0 transition-colors',
                        isActive ? 'text-teal-400' : 'text-stone-500 group-hover:text-stone-300'
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Admin Section - Only visible to admins/managers */}
          {canManage && visibleAdminItems.length > 0 && (
            <>
              {!collapsed && (
                <div className="px-6 pt-6 pb-2">
                  <p className="text-xs text-stone-500 uppercase tracking-wide font-semibold">
                    Administration
                  </p>
                </div>
              )}
              {collapsed && <div className="border-t border-stone-700/50 my-3 mx-3" />}
              <ul className="space-y-1 px-3">
                {visibleAdminItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                          isActive
                            ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                            : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 flex-shrink-0 transition-colors',
                            isActive ? 'text-amber-400' : 'text-stone-500 group-hover:text-stone-300'
                          )}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-stone-700/50 p-3 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white transition-all',
              collapsed && 'justify-center'
            )}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Moon className="h-5 w-5 flex-shrink-0" />
            )}
            {!collapsed && <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* User Info & Logout */}
          {user && (
            <div className={cn(
              'flex items-center gap-3 px-3 py-2',
              collapsed ? 'justify-center' : ''
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                isAdmin ? 'bg-gradient-to-br from-red-500 to-red-600' :
                isManager ? 'bg-gradient-to-br from-teal-500 to-teal-600' :
                'bg-gradient-to-br from-stone-600 to-stone-700'
              )}>
                <span className="text-white text-xs font-medium">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className={cn(
                    'text-xs capitalize',
                    isAdmin ? 'text-red-400' : isManager ? 'text-teal-400' : 'text-stone-500'
                  )}>{user.role}</p>
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          {user && (
            <button
              onClick={logout}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all',
                collapsed && 'justify-center'
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          )}

          {/* Collapse Toggle - Desktop Only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 text-stone-500 hover:text-stone-300 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export function useSidebarWidth() {
  // For responsive layout calculations
  return {
    collapsed: 80, // 5rem = 80px
    expanded: 256, // 16rem = 256px
  };
}
