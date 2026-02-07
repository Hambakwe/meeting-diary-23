"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, Palette, ImagePlus, Loader2, Crop, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Person } from "@/lib/types";
import { countries } from "@/lib/countries";
import { photoApi } from "@/lib/api";
import { ImageCropper } from "@/components/ImageCropper";

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
  onSave: (person: Omit<Person, "id" | "createdAt">) => void;
}

// Available badge colors
const badgeColors = [
  { name: "Rose", value: "bg-rose-500", hex: "#f43f5e" },
  { name: "Amber", value: "bg-amber-500", hex: "#f59e0b" },
  { name: "Emerald", value: "bg-emerald-500", hex: "#10b981" },
  { name: "Cyan", value: "bg-cyan-500", hex: "#06b6d4" },
  { name: "Violet", value: "bg-violet-500", hex: "#8b5cf6" },
  { name: "Pink", value: "bg-pink-500", hex: "#ec4899" },
  { name: "Teal", value: "bg-teal-500", hex: "#14b8a6" },
  { name: "Orange", value: "bg-orange-500", hex: "#f97316" },
  { name: "Blue", value: "bg-blue-500", hex: "#3b82f6" },
  { name: "Indigo", value: "bg-indigo-500", hex: "#6366f1" },
  { name: "Red", value: "bg-red-500", hex: "#ef4444" },
  { name: "Lime", value: "bg-lime-500", hex: "#84cc16" },
];

// Helper to get initials from name
function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

// Helper to generate a consistent color based on name (fallback)
function getAutoColor(name: string): string {
  if (!name) return "bg-zinc-400";
  const colors = badgeColors.map(c => c.value);
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

// Helper to get proper image URL (handles both /pers-img/ paths and data URLs)
function getPhotoUrl(photo: string): string {
  if (!photo) return "";
  if (photo.startsWith("data:") || photo.startsWith("http")) {
    return photo;
  }
  if (photo.startsWith("/")) {
    return photo;
  }
  return photo;
}

export function PersonDialog({
  open,
  onOpenChange,
  person,
  onSave,
}: PersonDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    phone: "",
    homeCountry: "",
    badgeColor: "",
    notes: "",
    photo: "",
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Separate refs for camera and gallery inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (person) {
      setFormData({
        name: person.name,
        email: person.email || "",
        company: person.company || "",
        role: person.role || "",
        phone: person.phone || "",
        homeCountry: person.homeCountry || "",
        badgeColor: person.badgeColor || "",
        notes: person.notes || "",
        photo: person.photo || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        company: "",
        role: "",
        phone: "",
        homeCountry: "",
        badgeColor: "",
        notes: "",
        photo: "",
      });
    }
    setShowColorPicker(false);
    setIsUploading(false);
    setCropperOpen(false);
    setImageToCrop("");
    setIsDragging(false);
  }, [person, open]);

  // Process file for cropping
  const processFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo must be less than 10MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageToCrop(result);
      setCropperOpen(true);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  }, [processFile]);

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);

    try {
      const file = new File([croppedBlob], "photo.jpg", { type: "image/jpeg" });
      const photoPath = await photoApi.upload(file, person?.id);
      setFormData({ ...formData, photo: photoPath });
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setIsUploading(false);
      setImageToCrop("");
    }
  };

  const handleRemovePhoto = () => {
    setFormData({ ...formData, photo: "" });
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (isUploading) {
      toast.error("Please wait for photo upload to complete");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  const currentBadgeColor = formData.badgeColor || getAutoColor(formData.name);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{person ? "Edit Person" : "Add New Person"}</DialogTitle>
            <DialogDescription>
              {person
                ? "Update the person's details below."
                : "Enter the details of the person you want to add."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Photo Upload Section with Drag & Drop */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed p-4 transition-all duration-200 ${
                  isDragging
                    ? "border-teal-500 bg-teal-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {/* Drag overlay */}
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-teal-50/90 rounded-xl z-10">
                    <div className="text-center">
                      <Upload className="h-10 w-10 text-teal-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-teal-700">Drop image here</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative">
                    {isUploading ? (
                      <div className="h-20 w-20 rounded-full bg-zinc-100 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
                      </div>
                    ) : formData.photo ? (
                      <div className="relative">
                        <img
                          src={getPhotoUrl(formData.photo)}
                          alt="Person photo"
                          className="h-20 w-20 rounded-full object-cover border-2 border-zinc-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`h-20 w-20 rounded-full flex items-center justify-center text-white text-xl font-bold ${currentBadgeColor}`}
                      >
                        {getInitials(formData.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <Label className="text-sm text-zinc-600">Profile Photo</Label>

                    {/* Hidden inputs */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="camera-upload"
                      disabled={isUploading}
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="gallery-upload"
                      disabled={isUploading}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => cameraInputRef.current?.click()}
                        className="gap-2"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        Camera
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => galleryInputRef.current?.click()}
                        className="gap-2"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4" />
                        )}
                        Browse
                      </Button>

                      {!formData.photo && !isUploading && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowColorPicker(!showColorPicker)}
                          className="gap-2"
                        >
                          <Palette className="h-4 w-4" />
                          Color
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <Crop className="h-3 w-3" />
                      <span>Drag & drop or click to upload. Photos will be cropped to a circle.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Picker */}
              {showColorPicker && !formData.photo && (
                <div className="p-3 bg-zinc-50 rounded-lg border">
                  <Label className="text-sm text-zinc-600 mb-2 block">Select Badge Color</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {badgeColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, badgeColor: color.value })}
                        className={`h-8 w-8 rounded-full ${color.value} flex items-center justify-center transition-transform hover:scale-110 ${
                          formData.badgeColor === color.value ? "ring-2 ring-offset-2 ring-zinc-900" : ""
                        }`}
                        title={color.name}
                      >
                        {formData.badgeColor === color.value && (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, badgeColor: "" })}
                      className="text-xs text-zinc-500 hover:text-zinc-700 underline"
                    >
                      Use auto color
                    </button>
                    {formData.badgeColor && (
                      <span className="text-xs text-zinc-400">
                        Selected: {badgeColors.find(c => c.value === formData.badgeColor)?.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Rest of the form fields */}
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Tech Corp"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="CEO"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0123"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="homeCountry">Home Country</Label>
                  <Select
                    value={formData.homeCountry}
                    onValueChange={(value) => setFormData({ ...formData, homeCountry: value })}
                  >
                    <SelectTrigger id="homeCountry">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this person..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  person ? "Update" : "Add Person"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={cropperOpen}
        onOpenChange={(open) => {
          setCropperOpen(open);
          if (!open) {
            setImageToCrop("");
          }
        }}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}
