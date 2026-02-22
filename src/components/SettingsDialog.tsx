'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  getSettings,
  updateSettings,
  resetSettings,
  getDefaultSettings,
  type AppSettings
} from '@/lib/settings-store';
import { Image, Sun, Moon, Building2, RotateCcw, Upload } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange?: (settings: AppSettings) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  onSettingsChange
}: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings());
  const [lightLogoPreview, setLightLogoPreview] = useState<string>('');
  const [darkLogoPreview, setDarkLogoPreview] = useState<string>('');
  const [lightLogoError, setLightLogoError] = useState(false);
  const [darkLogoError, setDarkLogoError] = useState(false);

  useEffect(() => {
    if (open) {
      const currentSettings = getSettings();
      setSettings(currentSettings);
      setLightLogoPreview(currentSettings.logoLight);
      setDarkLogoPreview(currentSettings.logoDark);
      setLightLogoError(false);
      setDarkLogoError(false);
    }
  }, [open]);

  const handleSave = () => {
    const updatedSettings = updateSettings({
      ...settings,
      logoLight: lightLogoPreview || settings.logoLight,
      logoDark: darkLogoPreview || settings.logoDark,
    });
    onSettingsChange?.(updatedSettings);
    onOpenChange(false);
  };

  const handleReset = () => {
    const defaultSettings = resetSettings();
    setSettings(defaultSettings);
    setLightLogoPreview(defaultSettings.logoLight);
    setDarkLogoPreview(defaultSettings.logoDark);
    setLightLogoError(false);
    setDarkLogoError(false);
    onSettingsChange?.(defaultSettings);
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'light' | 'dark'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a data URL from the file
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (type === 'light') {
        setLightLogoPreview(dataUrl);
        setLightLogoError(false);
        setSettings(prev => ({ ...prev, logoLight: dataUrl }));
      } else {
        setDarkLogoPreview(dataUrl);
        setDarkLogoError(false);
        setSettings(prev => ({ ...prev, logoDark: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] dark:bg-stone-900 dark:border-stone-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Building2 className="w-5 h-5" />
            App Settings
          </DialogTitle>
          <DialogDescription className="dark:text-stone-400">
            Customize the branding and appearance of your Gantt chart application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Logo Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Logo Settings
            </h3>

            {/* Light Mode Logo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                <Sun className="w-3.5 h-3.5" />
                Light Mode Logo
              </Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={lightLogoPreview}
                    onChange={(e) => {
                      setLightLogoPreview(e.target.value);
                      setLightLogoError(false);
                    }}
                    placeholder="Enter logo URL or upload file..."
                    className="dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                  />
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'light')}
                  />
                  <Button type="button" variant="outline" size="icon" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                    </span>
                  </Button>
                </label>
              </div>
              {/* Light Logo Preview */}
              <div className="h-12 bg-white border border-stone-200 rounded-lg flex items-center justify-center p-2">
                {!lightLogoError && lightLogoPreview ? (
                  <img
                    src={lightLogoPreview}
                    alt="Light logo preview"
                    className="max-h-8 max-w-full object-contain"
                    onError={() => setLightLogoError(true)}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-stone-400 text-sm">
                    <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {settings.logoFallbackText}
                      </span>
                    </div>
                    <span>Fallback logo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dark Mode Logo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                <Moon className="w-3.5 h-3.5" />
                Dark Mode Logo
              </Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={darkLogoPreview}
                    onChange={(e) => {
                      setDarkLogoPreview(e.target.value);
                      setDarkLogoError(false);
                    }}
                    placeholder="Enter logo URL or upload file..."
                    className="dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                  />
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'dark')}
                  />
                  <Button type="button" variant="outline" size="icon" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                    </span>
                  </Button>
                </label>
              </div>
              {/* Dark Logo Preview */}
              <div className="h-12 bg-stone-800 border border-stone-700 rounded-lg flex items-center justify-center p-2">
                {!darkLogoError && darkLogoPreview ? (
                  <img
                    src={darkLogoPreview}
                    alt="Dark logo preview"
                    className="max-h-8 max-w-full object-contain"
                    onError={() => setDarkLogoError(true)}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-stone-500 text-sm">
                    <div className="w-8 h-8 rounded bg-teal-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {settings.logoFallbackText}
                      </span>
                    </div>
                    <span>Fallback logo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fallback Text */}
            <div className="space-y-2">
              <Label className="text-stone-600 dark:text-stone-400">
                Fallback Logo Text
              </Label>
              <Input
                value={settings.logoFallbackText}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  logoFallbackText: e.target.value.slice(0, 5)
                }))}
                placeholder="OCF"
                maxLength={5}
                className="dark:bg-stone-800 dark:border-stone-700 dark:text-white"
              />
              <p className="text-xs text-stone-500 dark:text-stone-500">
                Shown when logo fails to load (max 5 characters)
              </p>
            </div>
          </div>

          <Separator className="dark:bg-stone-700" />

          {/* Branding Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Branding
            </h3>

            <div className="space-y-2">
              <Label className="text-stone-600 dark:text-stone-400">
                Company Name
              </Label>
              <Input
                value={settings.companyName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  companyName: e.target.value
                }))}
                placeholder="Oasis Capital Finance"
                className="dark:bg-stone-800 dark:border-stone-700 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-stone-600 dark:text-stone-400">
                Default Project Name
              </Label>
              <Input
                value={settings.defaultProjectName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  defaultProjectName: e.target.value
                }))}
                placeholder="Project Name"
                className="dark:bg-stone-800 dark:border-stone-700 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-stone-600 dark:text-stone-400">
                Default Project Description
              </Label>
              <Input
                value={settings.defaultProjectDescription}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  defaultProjectDescription: e.target.value
                }))}
                placeholder="Project Timeline & Task Management"
                className="dark:bg-stone-800 dark:border-stone-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
