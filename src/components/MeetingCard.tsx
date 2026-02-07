"use client";

import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Meeting, Person, Hotel } from "@/lib/types";
import { ClickableAvatar } from "@/components/ImageLightbox";

interface MeetingCardProps {
  meeting: Meeting;
  person?: Person;
  hotel?: Hotel;
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

// Helper to generate a consistent color based on name
function getInitialsColor(name: string, savedColor?: string): string {
  // Use saved color if available
  if (savedColor) return savedColor;

  const colors = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-orange-500",
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export function MeetingCard({
  meeting,
  person,
  hotel,
  onEdit,
  onDelete,
}: MeetingCardProps) {
  const statusConfig = {
    scheduled: { variant: "secondary" as const, color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    completed: { variant: "success" as const, color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    cancelled: { variant: "destructive" as const, color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
  };

  const fromDate = new Date(meeting.fromDate);
  const toDate = new Date(meeting.toDate);

  const status = statusConfig[meeting.status];

  return (
    <Card className="group relative border-0 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1" align="end">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={() => onEdit(meeting)}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(meeting.id)}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <div className={`h-1.5 ${status.color}`} />
      <CardHeader className="pb-1.5 pt-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold leading-tight text-zinc-800">{meeting.title}</CardTitle>
            <span className={`inline-flex items-center mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-4 pb-4">
        {/* Person with photo/initials */}
        <div className="flex items-center gap-2">
          {person ? (
            <>
              <ClickableAvatar
                photo={person.photo}
                name={person.name}
                size="sm"
                badgeColor={person.badgeColor}
              />
              <div className="text-xs text-zinc-600">
                <span className="font-medium">{person.name}</span>
                {person.company && (
                  <span className="text-zinc-400"> - {person.company}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="h-7 w-7 rounded-full bg-zinc-200 flex items-center justify-center">
                <span className="text-[10px] text-zinc-400">?</span>
              </div>
              <span className="text-xs text-zinc-400">Person not found</span>
            </>
          )}
        </div>

        {/* Destination */}
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <MapPin className="h-3 w-3 text-zinc-400" />
          <span>{meeting.destination}</span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <Calendar className="h-3 w-3 text-zinc-400" />
          <span>
            {format(fromDate, "MMM d, yyyy")} - {format(toDate, "MMM d, yyyy")}
          </span>
        </div>

        {/* Hotel */}
        {hotel && (
          <div className="flex items-start gap-2 text-xs text-zinc-600">
            <Building2 className="h-3 w-3 text-zinc-400 mt-0.5" />
            <div>
              <div className="font-medium">{hotel.name}</div>
              <div className="text-[10px] text-zinc-400">
                {hotel.area && `${hotel.area}, `}{hotel.city}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {meeting.notes && (
          <p className="text-[11px] text-zinc-500 border-t border-zinc-100 pt-2 mt-2">
            {meeting.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
