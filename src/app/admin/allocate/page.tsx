'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  Users,
  FolderKanban,
  Check,
  X,
  Building2,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  client_id?: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

// Demo clients from the user system
const DEMO_CLIENTS: Client[] = [
  { id: 'client-1', name: 'Acme Corporation', email: 'contact@acmecorp.com', company: 'Acme Corporation' },
  { id: 'client-2', name: 'Global Investments Ltd', email: 'info@globalinvest.com', company: 'Global Investments Ltd' },
  { id: 'client-3', name: 'Tech Ventures Inc', email: 'hello@techventures.com', company: 'Tech Ventures Inc' },
];

export default function AllocateProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<Record<number, string>>({});

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Wait for auth to fully initialize before making any decisions
    if (authLoading) return;

    // Only redirect if auth is done AND user doesn't have permission
    if (!isAdmin) {
      router.replace('/');
      return;
    }

    fetchProjects();
  }, [isAdmin, authLoading, router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects.php');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
        // Initialize allocations from existing data
        const existingAllocations: Record<number, string> = {};
        (data.data || []).forEach((p: Project) => {
          if (p.client_id) {
            existingAllocations[p.id] = String(p.client_id);
          }
        });
        setAllocations(existingAllocations);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationChange = (projectId: number, clientId: string) => {
    setAllocations(prev => ({
      ...prev,
      [projectId]: clientId,
    }));
  };

  const handleSaveAllocation = async (projectId: number) => {
    const clientId = allocations[projectId];
    try {
      const res = await fetch(`/api/projects.php?id=${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Allocation saved successfully!');
        fetchProjects();
      } else {
        alert('Error saving allocation: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving allocation:', error);
      alert('Error saving allocation');
    }
  };

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </PortalLayout>
    );
  }

  // Show nothing if user doesn't have permission (redirect will happen)
  if (!isAdmin) {
    return null;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-white flex items-center gap-2">
            <UserPlus className="h-7 w-7 text-amber-500" />
            Allocate Projects to Clients
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Assign projects to client accounts for their portal access
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-300">
                  Client Portal Access
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  When you allocate a project to a client, they will be able to see the project
                  in their portal, including the timeline, documents, and team contacts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allocations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Project Allocations
            </CardTitle>
            <CardDescription>
              Select a client for each project to grant them access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-stone-500">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                No projects available. Create a project first.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Allocated Client</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-stone-500 line-clamp-1">
                            {project.description || 'No description'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={allocations[project.id] || '__unallocated__'}
                          onValueChange={(value) => handleAllocationChange(project.id, value === '__unallocated__' ? '' : value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select client..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__unallocated__">No client (Unallocated)</SelectItem>
                            {DEMO_CLIENTS.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSaveAllocation(project.id)}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Clients
            </CardTitle>
            <CardDescription>
              Client accounts that can be allocated to projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_CLIENTS.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 dark:border-stone-700"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 dark:text-stone-200 truncate">
                      {client.name}
                    </p>
                    <p className="text-sm text-stone-500 truncate">{client.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
