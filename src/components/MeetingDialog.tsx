"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Meeting, Person, Hotel } from "@/lib/types";

interface MeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
  persons: Person[];
  hotels: Hotel[];
  onSave: (meeting: Omit<Meeting, "id" | "createdAt">) => void;
  onAddHotel: () => void;
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

export function MeetingDialog({
  open,
  onOpenChange,
  meeting,
  persons,
  hotels,
  onSave,
  onAddHotel,
}: MeetingDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    personId: "",
    hotelId: "",
    destination: "",
    fromDate: new Date(),
    toDate: addDays(new Date(), 1),
    notes: "",
    status: "scheduled" as Meeting["status"],
  });

  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title,
        personId: meeting.personId,
        hotelId: meeting.hotelId || "",
        destination: meeting.destination,
        fromDate: new Date(meeting.fromDate),
        toDate: new Date(meeting.toDate),
        notes: meeting.notes || "",
        status: meeting.status,
      });
    } else {
      const tomorrow = addDays(new Date(), 1);
      setFormData({
        title: "",
        personId: "",
        hotelId: "",
        destination: "",
        fromDate: new Date(),
        toDate: tomorrow,
        notes: "",
        status: "scheduled",
      });
    }
  }, [meeting, open]);

  // Auto-update toDate when fromDate changes (1 day/night default)
  const handleFromDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        fromDate: date,
        toDate: addDays(date, 1),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.personId || !formData.destination) return;
    onSave({
      title: formData.title,
      personId: formData.personId,
      hotelId: formData.hotelId || undefined,
      destination: formData.destination,
      fromDate: formData.fromDate.toISOString(),
      toDate: formData.toDate.toISOString(),
      notes: formData.notes || undefined,
      status: formData.status,
    });
    onOpenChange(false);
  };

  const selectedPerson = persons.find((p) => p.id === formData.personId);
  const selectedHotel = hotels.find((h) => h.id === formData.hotelId);

  // Filter hotels by selected destination
  const filteredHotels = formData.destination
    ? hotels.filter((h) => h.country === formData.destination)
    : hotels;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting ? "Edit Meeting" : "Schedule New Meeting"}</DialogTitle>
          <DialogDescription>
            {meeting
              ? "Update the meeting details below."
              : "Enter the details for your meeting."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Quarterly Business Review"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="person">Person Meeting With *</Label>
              <Select
                value={formData.personId}
                onValueChange={(value) =>
                  setFormData({ ...formData, personId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  {persons.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex flex-col">
                        <span>{person.name}</span>
                        {person.company && (
                          <span className="text-xs text-zinc-500">
                            {person.company}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPerson && (
                <div className="text-sm text-zinc-500 bg-zinc-50 p-2 rounded-lg">
                  {selectedPerson.role && <span>{selectedPerson.role}</span>}
                  {selectedPerson.company && selectedPerson.role && <span> at </span>}
                  {selectedPerson.company && <span>{selectedPerson.company}</span>}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="destination">Destination (Country) *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value, hotelId: "" })
                }
                list="destinations"
                placeholder="Select or type destination country"
                required
              />
              <datalist id="destinations">
                {COUNTRIES.map((country) => (
                  <option key={country} value={country} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>From Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fromDate ? (
                        format(formData.fromDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fromDate}
                      onSelect={handleFromDateChange}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>To Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.toDate ? (
                        format(formData.toDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.toDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, toDate: date })
                      }
                      disabled={(date) => date < formData.fromDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="hotel">Hotel</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onAddHotel}
                  className="text-xs"
                >
                  + Add Hotel
                </Button>
              </div>
              <Select
                value={formData.hotelId}
                onValueChange={(value) =>
                  setFormData({ ...formData, hotelId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a hotel (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {filteredHotels.length === 0 ? (
                    <div className="p-2 text-sm text-zinc-500">
                      No hotels found for this destination
                    </div>
                  ) : (
                    filteredHotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        <div className="flex flex-col">
                          <span>{hotel.name}</span>
                          <span className="text-xs text-zinc-500">
                            {hotel.city}, {hotel.country}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedHotel && (
                <div className="text-sm text-zinc-500 bg-zinc-50 p-2 rounded-lg">
                  <div className="font-medium">{selectedHotel.name}</div>
                  <div>{selectedHotel.fullAddress}</div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Meeting["status"]) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes about this meeting..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{meeting ? "Update" : "Schedule Meeting"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
