'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Users,
  UserPlus,
  Edit,
  Trash2,
  Loader2,
  Upload,
  X,
  Building2,
  Shield,
  Briefcase,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { ImageCropper } from '@/components/ImageCropper';

// Team member interface matching API
interface TeamMember {
  id: number;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  mobile?: string;
  location: string;
  linkedin_url?: string;
  avatar_url?: string;
  notes?: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  project_id?: number;
  is_primary: boolean;
  is_active: boolean;
}

// Category interface
interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
}

// Default categories (fallback)
const defaultCategories: Category[] = [
  { id: 1, name: 'OCF Team', slug: 'ocf', color: '#14b8a6' },
  { id: 2, name: 'Legal', slug: 'legal', color: '#3b82f6' },
  { id: 3, name: 'Advisors', slug: 'advisors', color: '#8b5cf6' },
  { id: 4, name: 'Client Team', slug: 'client', color: '#f59e0b' },
];

// Empty form state
const emptyForm = {
  name: '',
  role: '',
  company: '',
  email: '',
  phone: '',
  mobile: '',
  location: '',
  linkedin_url: '',
  avatar_url: '',
  notes: '',
  category_id: 1,
  project_id: null as number | null,
  is_primary: false,
};

export default function ManageTeamPage() {
  const { user, loading: authLoading, currentProject } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManage = isAdmin || isManager;

  useEffect(() => {
    if (authLoading) return;
    if (!canManage) {
      router.replace('/');
      return;
    }
    fetchTeamMembers();
    fetchCategories();
  }, [canManage, authLoading, router]);

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/contacts.php');
      const data = await res.json();
      if (data.success) {
        setTeamMembers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Use empty array on error
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/contacts.php?action=categories');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        role: member.role || '',
        company: member.company || '',
        email: member.email || '',
        phone: member.phone || '',
        mobile: member.mobile || '',
        location: member.location || '',
        linkedin_url: member.linkedin_url || '',
        avatar_url: member.avatar_url || '',
        notes: member.notes || '',
        category_id: member.category_id,
        project_id: member.project_id || null,
        is_primary: member.is_primary,
      });
      setImagePreview(member.avatar_url || null);
    } else {
      setEditingMember(null);
      setFormData(emptyForm);
      setImagePreview(null);
    }
    setSelectedImage(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMember(null);
    setFormData(emptyForm);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        toast.error('Please select an image file (JPG, PNG, GIF, or WebP)');
      }
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setImagePreview(croppedImageUrl);
    // Clear the file input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropperClose = (open: boolean) => {
    setCropperOpen(open);
    if (!open && !imagePreview) {
      // User cancelled without cropping, clear the selected image
      setSelectedImage(null);
      setImageToCrop(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageToCrop(null);
    setFormData({ ...formData, avatar_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        toast.error('Please drop an image file (JPG, PNG, GIF, or WebP)');
      }
    }
  };

  // Process image file (used by both file input and drag-drop)
  const processImageFile = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to server using FormData (returns URL or throws error)
  const uploadImageToServer = async (imageData: string): Promise<string> => {
    setIsUploading(true);
    try {
      // Convert base64 data URL to Blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Create FormData with the image
      const formData = new FormData();
      formData.append('image', blob, 'avatar.jpg');

      // Upload using multipart form data (not JSON)
      const res = await fetch('/api/upload.php', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.success && data.data?.url) {
        return data.data.url;
      }

      throw new Error(data.error || 'Upload failed - no URL returned');
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setIsSaving(true);

    try {
      // Handle image upload - must succeed if there's a new image
      let avatarUrl = formData.avatar_url;

      if (imagePreview && imagePreview !== formData.avatar_url) {
        // New image selected - upload to server
        try {
          toast.loading('Uploading image...', { id: 'upload' });
          avatarUrl = await uploadImageToServer(imagePreview);
          toast.success('Image uploaded', { id: 'upload' });
        } catch (uploadError) {
          toast.error('Failed to upload image. Please try again.', { id: 'upload' });
          setIsSaving(false);
          return; // Don't proceed if image upload fails
        }
      }

      const payload = {
        ...formData,
        avatar_url: avatarUrl,
        is_primary: formData.is_primary ? 1 : 0,
      };

      let res;
      if (editingMember) {
        // Update existing
        res = await fetch(`/api/contacts.php?id=${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        res = await fetch('/api/contacts.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (data.success) {
        toast.success(editingMember ? 'Team member updated' : 'Team member added');
        handleCloseDialog();
        fetchTeamMembers();
      } else {
        toast.error(data.error || 'Failed to save team member');
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error('Failed to save team member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (memberId: number) => {
    if (!confirm('Are you sure you want to delete this team member?')) {
      return;
    }

    try {
      const res = await fetch(`/api/contacts.php?id=${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Team member deleted');
        fetchTeamMembers();
      } else {
        toast.error(data.error || 'Failed to delete team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
    }
  };

  const getCategoryColor = (slug?: string) => {
    switch (slug) {
      case 'ocf': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'legal': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'advisors': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'client': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <PortalLayout>
        <Toaster position="top-right" richColors theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </PortalLayout>
    );
  }

  if (!canManage) {
    return null;
  }

  return (
    <PortalLayout>
      <Toaster position="top-right" richColors theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 dark:text-white flex items-center gap-2">
              <Users className="h-7 w-7 text-amber-500" />
              Manage Team Members
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mt-1">
              Add, edit, and manage deal team contacts
            </p>
          </div>

          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => handleOpenDialog()}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {/* Team Members Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              All team members across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
                <p className="text-stone-500 dark:text-stone-400">No team members yet</p>
                <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">
                  Click "Add Team Member" to create the first one
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role / Company</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center`}>
                              <span className="text-white font-medium text-sm">
                                {getInitials(member.name)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              {member.is_primary && (
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            {member.location && (
                              <p className="text-xs text-stone-500">{member.location}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{member.role || '-'}</p>
                        <p className="text-xs text-stone-500">{member.company || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(member.category_slug)}>
                          {member.category_name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-stone-600 dark:text-stone-300">{member.email || '-'}</p>
                          <p className="text-xs text-stone-500">{member.phone || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700">
            <DialogHeader>
              <DialogTitle className="text-stone-800 dark:text-white">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </DialogTitle>
              <DialogDescription className="text-stone-500 dark:text-stone-400">
                {editingMember ? 'Update team member information' : 'Add a new team member to the deal team'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Image Upload with Drag & Drop */}
              <div className="space-y-2">
                <Label className="text-stone-700 dark:text-stone-300">Photo / Logo</Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${
                    isDragging
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : imagePreview
                      ? 'border-teal-400 bg-teal-50/50 dark:bg-teal-900/10'
                      : 'border-stone-300 dark:border-stone-600 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-20 h-20 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 ${
                        imagePreview
                          ? ''
                          : 'bg-stone-100 dark:bg-stone-800'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-stone-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {imagePreview ? 'Change' : 'Browse'}
                        </Button>
                        {imagePreview && imageToCrop && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCropperOpen(true)}
                            className="text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:hover:bg-teal-900/30"
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={clearImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {isDragging ? (
                          <span className="text-teal-600 font-medium">Drop image here...</span>
                        ) : (
                          <>Drag & drop or click to upload. Supports JPG, PNG, GIF, WebP.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-stone-700 dark:text-stone-300">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                />
              </div>

              {/* Role & Company */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-stone-700 dark:text-stone-300">
                    Role / Title
                  </Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Deal Manager"
                    className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-stone-700 dark:text-stone-300">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Oasis Capital Finance"
                    className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-stone-700 dark:text-stone-300">
                  Category
                </Label>
                <Select
                  value={String(formData.category_id)}
                  onValueChange={(val) => setFormData({ ...formData, category_id: Number(val) })}
                >
                  <SelectTrigger className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-stone-700 dark:text-stone-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                    className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-stone-700 dark:text-stone-300">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+44 20 7123 4567"
                    className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              {/* Mobile & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-stone-700 dark:text-stone-300">
                    Mobile
                  </Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+44 7700 900123"
                    className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-stone-700 dark:text-stone-300">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="London, UK"
                    className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-stone-700 dark:text-stone-300">
                  LinkedIn URL
                </Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="linkedin.com/in/johnsmith"
                  className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-stone-700 dark:text-stone-300">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this team member..."
                  rows={2}
                  className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                />
              </div>

              {/* Primary Contact Checkbox */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="is_primary"
                  checked={formData.is_primary}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked === true })}
                />
                <Label
                  htmlFor="is_primary"
                  className="text-stone-700 dark:text-stone-300 cursor-pointer flex items-center gap-2"
                >
                  <Star className="h-4 w-4 text-amber-500" />
                  Primary Contact
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                className="border-stone-200 dark:border-stone-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name.trim() || isSaving}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingMember ? 'Update' : 'Add'} Team Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Cropper Dialog */}
        {imageToCrop && (
          <ImageCropper
            open={cropperOpen}
            onOpenChange={handleCropperClose}
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            aspectRatio={1}
            circularCrop={false}
            maxOutputSize={400}
            outputFormat="image/jpeg"
            outputQuality={0.9}
          />
        )}
      </div>
    </PortalLayout>
  );
}
