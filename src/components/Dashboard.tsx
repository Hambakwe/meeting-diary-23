"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  CalendarDays,
  Users,
  Building2,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Globe,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  Timer,
  Hotel,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClickableAvatar } from "@/components/ImageLightbox";
import type { Person, Hotel as HotelType, Meeting } from "@/lib/types";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval, differenceInDays, getDay } from "date-fns";

interface DashboardProps {
  meetings: Meeting[];
  persons: Person[];
  hotels: HotelType[];
}

const CHART_COLORS = {
  primary: "#14b8a6",
  secondary: "#0891b2",
  accent: "#8b5cf6",
  warning: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  muted: "#94a3b8",
};

const STATUS_COLORS = {
  scheduled: "#f59e0b",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const PIE_COLORS = ["#14b8a6", "#0891b2", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#6366f1"];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Dashboard({ meetings, persons, hotels }: DashboardProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const scheduledMeetings = meetings.filter((m) => m.status === "scheduled");
    const completedMeetings = meetings.filter((m) => m.status === "completed");
    const cancelledMeetings = meetings.filter((m) => m.status === "cancelled");

    const upcomingMeetings = meetings.filter((m) => {
      const meetingDate = new Date(m.fromDate);
      return meetingDate >= today && m.status === "scheduled";
    });

    const pastMeetings = meetings.filter((m) => {
      const meetingDate = new Date(m.fromDate);
      return meetingDate < today;
    });

    // Meetings this month
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const meetingsThisMonth = meetings.filter((m) => {
      const meetingDate = parseISO(m.fromDate);
      return isWithinInterval(meetingDate, { start: startOfCurrentMonth, end: endOfCurrentMonth });
    });

    // Meetings last month for comparison
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));
    const meetingsLastMonth = meetings.filter((m) => {
      const meetingDate = parseISO(m.fromDate);
      return isWithinInterval(meetingDate, { start: startOfLastMonth, end: endOfLastMonth });
    });

    const monthlyGrowth = meetingsLastMonth.length > 0
      ? ((meetingsThisMonth.length - meetingsLastMonth.length) / meetingsLastMonth.length) * 100
      : meetingsThisMonth.length > 0 ? 100 : 0;

    // Completion rate (completed / (completed + cancelled))
    const finishedMeetings = completedMeetings.length + cancelledMeetings.length;
    const completionRate = finishedMeetings > 0
      ? Math.round((completedMeetings.length / finishedMeetings) * 100)
      : 100;

    // Average meeting duration in days
    const durations = meetings.map((m) => {
      const from = parseISO(m.fromDate);
      const to = parseISO(m.toDate);
      return Math.max(1, differenceInDays(to, from) + 1);
    });
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10
      : 0;

    // Next upcoming meeting
    const nextMeeting = upcomingMeetings.sort(
      (a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
    )[0];

    return {
      total: meetings.length,
      scheduled: scheduledMeetings.length,
      completed: completedMeetings.length,
      cancelled: cancelledMeetings.length,
      upcoming: upcomingMeetings.length,
      past: pastMeetings.length,
      thisMonth: meetingsThisMonth.length,
      lastMonth: meetingsLastMonth.length,
      monthlyGrowth,
      completionRate,
      avgDuration,
      nextMeeting,
      personsCount: persons.length,
      hotelsCount: hotels.length,
    };
  }, [meetings, persons, hotels]);

  // Status distribution for pie chart
  const statusData = useMemo(() => [
    { name: "Scheduled", value: stats.scheduled, color: STATUS_COLORS.scheduled },
    { name: "Completed", value: stats.completed, color: STATUS_COLORS.completed },
    { name: "Cancelled", value: stats.cancelled, color: STATUS_COLORS.cancelled },
  ].filter(item => item.value > 0), [stats]);

  // Completion rate for radial chart
  const completionRateData = useMemo(() => [
    { name: "Completion", value: stats.completionRate, fill: CHART_COLORS.success },
  ], [stats.completionRate]);

  // Meetings by month (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 5),
      end: now,
    });

    return months.map((month) => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const monthMeetings = meetings.filter((m) => {
        const meetingDate = parseISO(m.fromDate);
        return isWithinInterval(meetingDate, { start, end });
      });

      const scheduled = monthMeetings.filter((m) => m.status === "scheduled").length;
      const completed = monthMeetings.filter((m) => m.status === "completed").length;
      const cancelled = monthMeetings.filter((m) => m.status === "cancelled").length;

      return {
        month: format(month, "MMM"),
        fullMonth: format(month, "MMMM yyyy"),
        total: monthMeetings.length,
        scheduled,
        completed,
        cancelled,
      };
    });
  }, [meetings]);

  // Meetings by day of week
  const dayOfWeekData = useMemo(() => {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat

    for (const meeting of meetings) {
      const dayIndex = getDay(parseISO(meeting.fromDate));
      dayCounts[dayIndex]++;
    }

    return DAY_NAMES.map((name, index) => ({
      day: name,
      meetings: dayCounts[index],
      fill: index === 0 || index === 6 ? CHART_COLORS.muted : CHART_COLORS.primary,
    }));
  }, [meetings]);

  // Top destinations
  const topDestinations = useMemo(() => {
    const destinationCounts: Record<string, number> = {};

    for (const meeting of meetings) {
      const dest = meeting.destination || "Unknown";
      destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
    }

    return Object.entries(destinationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [meetings]);

  // Top hotels usage
  const topHotels = useMemo(() => {
    const hotelCounts: Record<string, { count: number; hotel: HotelType }> = {};

    for (const meeting of meetings) {
      if (meeting.hotelId) {
        const hotel = hotels.find((h) => h.id === meeting.hotelId);
        if (hotel) {
          if (!hotelCounts[hotel.id]) {
            hotelCounts[hotel.id] = { count: 0, hotel };
          }
          hotelCounts[hotel.id].count++;
        }
      }
    }

    return Object.values(hotelCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [meetings, hotels]);

  // Top contacts by meetings
  const topContacts = useMemo(() => {
    const contactCounts: Record<string, { count: number; person: Person }> = {};

    for (const meeting of meetings) {
      const person = persons.find((p) => p.id === meeting.personId);
      if (person) {
        if (!contactCounts[person.id]) {
          contactCounts[person.id] = { count: 0, person };
        }
        contactCounts[person.id].count++;
      }
    }

    return Object.values(contactCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [meetings, persons]);

  // Upcoming meetings (next 5)
  const upcomingMeetingsList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return meetings
      .filter((m) => new Date(m.fromDate) >= today && m.status === "scheduled")
      .sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime())
      .slice(0, 5);
  }, [meetings]);

  // Recent activity (last 5 meetings by creation date)
  const recentActivity = useMemo(() => {
    return [...meetings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [meetings]);

  // Get initials helper
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const getInitialsColor = (name: string): string => {
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
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Meetings */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 font-medium">Total</p>
                <p className="text-2xl font-bold mt-0.5">{stats.total}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-white/40" />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 font-medium">Upcoming</p>
                <p className="text-2xl font-bold mt-0.5">{stats.upcoming}</p>
              </div>
              <Clock className="h-8 w-8 text-white/40" />
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 font-medium">Completed</p>
                <p className="text-2xl font-bold mt-0.5">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-white/40" />
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 font-medium">Success Rate</p>
                <p className="text-2xl font-bold mt-0.5">{stats.completionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-white/40" />
            </div>
          </CardContent>
        </Card>

        {/* Avg Duration */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 font-medium">Avg Duration</p>
                <p className="text-2xl font-bold mt-0.5">{stats.avgDuration}d</p>
              </div>
              <Timer className="h-8 w-8 text-white/40" />
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-pink-500 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 font-medium">This Month</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold mt-0.5">{stats.thisMonth}</p>
                  {stats.monthlyGrowth !== 0 && (
                    <span className="text-[10px] flex items-center">
                      {stats.monthlyGrowth > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(stats.monthlyGrowth).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-white/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-zinc-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-500" />
              Meeting Trends
            </CardTitle>
            <CardDescription className="text-xs">Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.some(d => d.total > 0) ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value) => [value ?? 0, "Total"]}
                      labelFormatter={(label) => monthlyData.find(d => d.month === label)?.fullMonth || label}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      fill="url(#colorTotal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No meeting data</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-zinc-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Status Overview
            </CardTitle>
            <CardDescription className="text-xs">Meeting status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-zinc-600">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No meetings yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Meetings by Day of Week */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-zinc-800 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              By Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.length > 0 ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value) => [value ?? 0, "Meetings"]}
                    />
                    <Bar dataKey="meetings" radius={[4, 4, 0, 0]}>
                      {dayOfWeekData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center">
                <p className="text-xs text-zinc-400">No data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Destinations */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-zinc-800 flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-500" />
              Top Destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topDestinations.length > 0 ? (
              <div className="space-y-2">
                {topDestinations.slice(0, 4).map((dest, index) => (
                  <div key={dest.name} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-700 truncate">{dest.name}</span>
                        <span className="text-xs text-zinc-500">{dest.value}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full mt-1">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${(dest.value / topDestinations[0].value) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center">
                <p className="text-xs text-zinc-400">No destinations</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Hotels */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-zinc-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-500" />
              Most Used Hotels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topHotels.length > 0 ? (
              <div className="space-y-2">
                {topHotels.slice(0, 4).map(({ hotel, count }, index) => (
                  <div key={hotel.id} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700 truncate">{hotel.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{hotel.city}, {hotel.country}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-violet-50 text-violet-700">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center">
                <p className="text-xs text-zinc-400">No hotel data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-zinc-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.slice(0, 4).map((meeting) => {
                  const person = persons.find((p) => p.id === meeting.personId);
                  return (
                    <div key={meeting.id} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        meeting.status === "completed" ? "bg-emerald-500" :
                        meeting.status === "cancelled" ? "bg-red-500" : "bg-amber-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-700 truncate">{meeting.title}</p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {person?.name || "Unknown"} • {format(parseISO(meeting.fromDate), "MMM d")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center">
                <p className="text-xs text-zinc-400">No activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Contacts */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-zinc-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              Top Contacts
            </CardTitle>
            <CardDescription className="text-xs">Most frequent meeting partners</CardDescription>
          </CardHeader>
          <CardContent>
            {topContacts.length > 0 ? (
              <div className="space-y-2">
                {topContacts.map(({ person, count }, index) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-xs font-medium">
                      {index + 1}
                    </div>
                    <ClickableAvatar
                      photo={person.photo}
                      name={person.name}
                      size="md"
                      badgeColor={person.badgeColor}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{person.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{person.company || person.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-teal-50 text-teal-700">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No contacts with meetings</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-zinc-800 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              Upcoming Meetings
            </CardTitle>
            <CardDescription className="text-xs">Your next scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetingsList.length > 0 ? (
              <div className="space-y-2">
                {upcomingMeetingsList.map((meeting) => {
                  const person = persons.find((p) => p.id === meeting.personId);
                  const daysUntil = differenceInDays(parseISO(meeting.fromDate), new Date());

                  return (
                    <div
                      key={meeting.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-zinc-50 to-white border border-zinc-100"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex flex-col items-center justify-center text-white">
                          <span className="text-[8px] font-medium leading-none">
                            {format(parseISO(meeting.fromDate), "MMM")}
                          </span>
                          <span className="text-sm font-bold leading-none">
                            {format(parseISO(meeting.fromDate), "d")}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">{meeting.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5 text-zinc-400" />
                          <span className="text-[10px] text-zinc-500 truncate">{meeting.destination}</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          daysUntil === 0
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : daysUntil <= 3
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No upcoming meetings</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-zinc-800 flex items-center gap-2">
              <BarChart className="h-4 w-4 text-violet-500" />
              Monthly Breakdown
            </CardTitle>
            <CardDescription className="text-xs">Status by month</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.some(d => d.total > 0) ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                        fontSize: "11px",
                      }}
                      labelFormatter={(label) => monthlyData.find(d => d.month === label)?.fullMonth || label}
                    />
                    <Bar dataKey="completed" name="Done" stackId="a" fill={STATUS_COLORS.completed} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="scheduled" name="Scheduled" stackId="a" fill={STATUS_COLORS.scheduled} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill={STATUS_COLORS.cancelled} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No data</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
