"use client";

import { useState, useEffect } from "react";
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
import { MapPin } from "lucide-react";
import type { Hotel } from "@/lib/types";

interface HotelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel?: Hotel | null;
  onSave: (hotel: Omit<Hotel, "id" | "createdAt">) => void;
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Japan",
  "Germany",
  "France",
  "Australia",
  "Canada",
  "Singapore",
  "Switzerland",
  "United Arab Emirates",
  "Spain",
  "Italy",
  "Netherlands",
  "China",
  "South Korea",
];

export function HotelDialog({
  open,
  onOpenChange,
  hotel,
  onSave,
}: HotelDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    city: "",
    area: "",
    fullAddress: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name,
        country: hotel.country,
        city: hotel.city,
        area: hotel.area,
        fullAddress: hotel.fullAddress,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
      });
    } else {
      setFormData({
        name: "",
        country: "",
        city: "",
        area: "",
        fullAddress: "",
        latitude: undefined,
        longitude: undefined,
      });
    }
  }, [hotel, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.country.trim() || !formData.city.trim() || !formData.fullAddress.trim()) return;
    onSave(formData);
    onOpenChange(false);
  };

  const mapUrl = formData.latitude && formData.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${formData.longitude - 0.01},${formData.latitude - 0.01},${formData.longitude + 0.01},${formData.latitude + 0.01}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{hotel ? "Edit Hotel" : "Add New Hotel"}</DialogTitle>
          <DialogDescription>
            {hotel
              ? "Update the hotel details below."
              : "Enter the details of the hotel you want to add."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="hotelName">Hotel Name *</Label>
              <Input
                id="hotelName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="The Ritz London"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  list="countries"
                  placeholder="Select or type country"
                  required
                />
                <datalist id="countries">
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="London"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="area">Area / District</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
                placeholder="Piccadilly"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullAddress">Full Address *</Label>
              <Input
                id="fullAddress"
                value={formData.fullAddress}
                onChange={(e) =>
                  setFormData({ ...formData, fullAddress: e.target.value })
                }
                placeholder="150 Piccadilly, St. James's, London W1J 9BR"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="51.5074"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="-0.1278"
                />
              </div>
            </div>

            {mapUrl && (
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Preview
                </Label>
                <div className="rounded-lg overflow-hidden border-2 border-zinc-200">
                  <iframe
                    title="Hotel Location"
                    width="100%"
                    height="200"
                    src={mapUrl}
                    style={{ border: 0 }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{hotel ? "Update" : "Add Hotel"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
