'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  RotateCcw,
  ZoomIn,
  Check,
  X,
  Sun,
  Contrast,
  Palette,
  Circle,
  Square,
} from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  aspectRatio?: number;
  circularCrop?: boolean;
  maxOutputSize?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  outputQuality?: number;
}

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
}

const defaultFilters: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

// Helper function to create the initial crop centered on the image
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  circularCrop: initialCircularCrop = false,
  maxOutputSize = 400,
  outputFormat = 'image/jpeg',
  outputQuality = 0.9,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [circularCrop, setCircularCrop] = useState(initialCircularCrop);
  const [filters, setFilters] = useState<ImageFilters>(defaultFilters);
  const [activeTab, setActiveTab] = useState('crop');

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio]
  );

  const resetTransforms = () => {
    setScale(1);
    setRotate(0);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const resetAll = () => {
    resetTransforms();
    resetFilters();
    setCircularCrop(initialCircularCrop);
  };

  // Generate CSS filter string
  const getFilterStyle = () => {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    setIsProcessing(true);

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      // Calculate the scale factors
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Calculate the actual crop area in natural image pixels
      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      // Determine output size (maintain aspect ratio, fit within maxOutputSize)
      let outputWidth = pixelCrop.width;
      let outputHeight = pixelCrop.height;

      if (outputWidth > maxOutputSize || outputHeight > maxOutputSize) {
        const ratio = Math.min(
          maxOutputSize / outputWidth,
          maxOutputSize / outputHeight
        );
        outputWidth = Math.round(outputWidth * ratio);
        outputHeight = Math.round(outputHeight * ratio);
      }

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Apply high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply filters
      ctx.filter = getFilterStyle();

      // Handle rotation
      if (rotate !== 0) {
        const centerX = outputWidth / 2;
        const centerY = outputHeight / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      // Draw the cropped image
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight
      );

      // Reset filter for mask operation
      ctx.filter = 'none';

      // If circular crop, apply circular mask
      if (circularCrop) {
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(
          outputWidth / 2,
          outputHeight / 2,
          Math.min(outputWidth, outputHeight) / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Convert to data URL
      const croppedImageUrl = canvas.toDataURL(outputFormat, outputQuality);

      onCropComplete(croppedImageUrl);
      onOpenChange(false);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    resetAll();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700">
        <DialogHeader>
          <DialogTitle className="text-stone-800 dark:text-white">
            Edit Image
          </DialogTitle>
          <DialogDescription className="text-stone-500 dark:text-stone-400">
            Crop, rotate, and adjust your image before uploading.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-stone-100 dark:bg-stone-800">
            <TabsTrigger value="crop" className="text-sm">
              <ZoomIn className="h-4 w-4 mr-2" />
              Crop & Transform
            </TabsTrigger>
            <TabsTrigger value="filters" className="text-sm">
              <Sun className="h-4 w-4 mr-2" />
              Filters
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {/* Image Preview - Always visible */}
            <div className="relative flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden min-h-[280px] mb-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                circularCrop={circularCrop}
                className="max-h-[350px]"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imageSrc}
                  style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    filter: getFilterStyle(),
                    maxHeight: '350px',
                    maxWidth: '100%',
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>

            <TabsContent value="crop" className="space-y-4 mt-0">
              {/* Circular Crop Toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                <div className="flex items-center gap-2">
                  {circularCrop ? (
                    <Circle className="h-4 w-4 text-teal-600" />
                  ) : (
                    <Square className="h-4 w-4 text-stone-500" />
                  )}
                  <Label htmlFor="circular-crop" className="text-stone-700 dark:text-stone-300 cursor-pointer">
                    Circular Crop
                  </Label>
                </div>
                <Switch
                  id="circular-crop"
                  checked={circularCrop}
                  onCheckedChange={setCircularCrop}
                />
              </div>

              {/* Zoom Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-stone-700 dark:text-stone-300 flex items-center gap-2">
                    <ZoomIn className="h-4 w-4" />
                    Zoom
                  </Label>
                  <span className="text-sm text-stone-500 font-mono">{Math.round(scale * 100)}%</span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={(value) => setScale(value[0])}
                  min={0.5}
                  max={3}
                  step={0.05}
                  className="w-full"
                />
              </div>

              {/* Rotate Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-stone-700 dark:text-stone-300 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Rotate
                  </Label>
                  <span className="text-sm text-stone-500 font-mono">{rotate}°</span>
                </div>
                <Slider
                  value={[rotate]}
                  onValueChange={(value) => setRotate(value[0])}
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetTransforms}
                  className="text-stone-600 dark:text-stone-300"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate((r) => r - 90)}
                  className="text-stone-600 dark:text-stone-300"
                >
                  ↺ 90°
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate((r) => r + 90)}
                  className="text-stone-600 dark:text-stone-300"
                >
                  ↻ 90°
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4 mt-0">
              {/* Brightness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-stone-700 dark:text-stone-300 flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Brightness
                  </Label>
                  <span className="text-sm text-stone-500 font-mono">{filters.brightness}%</span>
                </div>
                <Slider
                  value={[filters.brightness]}
                  onValueChange={(value) => setFilters({ ...filters, brightness: value[0] })}
                  min={50}
                  max={150}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-stone-700 dark:text-stone-300 flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    Contrast
                  </Label>
                  <span className="text-sm text-stone-500 font-mono">{filters.contrast}%</span>
                </div>
                <Slider
                  value={[filters.contrast]}
                  onValueChange={(value) => setFilters({ ...filters, contrast: value[0] })}
                  min={50}
                  max={150}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-stone-700 dark:text-stone-300 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Saturation
                  </Label>
                  <span className="text-sm text-stone-500 font-mono">{filters.saturation}%</span>
                </div>
                <Slider
                  value={[filters.saturation]}
                  onValueChange={(value) => setFilters({ ...filters, saturation: value[0] })}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Filter Presets */}
              <div className="space-y-2">
                <Label className="text-stone-700 dark:text-stone-300 text-sm">Quick Presets</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="text-stone-600 dark:text-stone-300"
                  >
                    Normal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ brightness: 110, contrast: 110, saturation: 90 })}
                    className="text-stone-600 dark:text-stone-300"
                  >
                    Vivid
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ brightness: 105, contrast: 95, saturation: 0 })}
                    className="text-stone-600 dark:text-stone-300"
                  >
                    B&W
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ brightness: 95, contrast: 105, saturation: 80 })}
                    className="text-stone-600 dark:text-stone-300"
                  >
                    Muted
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ brightness: 100, contrast: 120, saturation: 110 })}
                    className="text-stone-600 dark:text-stone-300"
                  >
                    Pop
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Output Info */}
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
          Output: {maxOutputSize}×{maxOutputSize}px max, {outputFormat.replace('image/', '').toUpperCase()} format
          {circularCrop && ' (circular)'}
        </p>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-stone-200 dark:border-stone-700"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            disabled={isProcessing || !completedCrop}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
