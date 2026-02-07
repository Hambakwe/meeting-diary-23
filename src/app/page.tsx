"use client";

import { useState, useEffect, Component, type ReactNode } from "react";
import {
  Users,
  Building2,
  CalendarDays,
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  LogOut,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Calendar,
  History,
  ListFilter,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MeetingCard } from "@/components/MeetingCard";
import { MeetingDialog } from "@/components/MeetingDialog";
import { PersonDialog } from "@/components/PersonDialog";
import { HotelDialog } from "@/components/HotelDialog";
import { LoginPage } from "@/components/LoginPage";
import { Dashboard } from "@/components/Dashboard";
import { ClickableAvatar } from "@/components/ImageLightbox";
import {
  personsApi,
  hotelsApi,
  meetingsApi,
} from "@/lib/api";
import { getStoredUser, logout, type AuthUser } from "@/lib/auth";
import type { Person, Hotel, Meeting } from "@/lib/types";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper to get initials
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

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

function HomeContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [meetingView, setMeetingView] = useState<'future' | 'past' | 'all'>('future');

  // Dialog states
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    try {
      const storedUser = getStoredUser();
      setUser(storedUser);
      setAuthChecked(true);
      if (storedUser) {
        refreshData();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthChecked(true);
    }
  }, []);

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    refreshData();
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setPersons([]);
    setHotels([]);
    setMeetings([]);
  };

  const refreshData = async (showToast = false) => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [personsData, hotelsData, meetingsData] = await Promise.all([
        personsApi.getAll(),
        hotelsApi.getAll(),
        meetingsApi.getAll(),
      ]);
      setPersons(Array.isArray(personsData) ? personsData : []);
      setHotels(Array.isArray(hotelsData) ? hotelsData : []);
      setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
      if (showToast) {
        toast.success('Data refreshed from database');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to database';
      setApiError(errorMessage);
      toast.error(errorMessage);
      // Set empty arrays so page doesn't crash
      setPersons([]);
      setHotels([]);
      setMeetings([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Meeting handlers
  const handleSaveMeeting = async (meetingData: Omit<Meeting, "id" | "createdAt">) => {
    try {
      if (editingMeeting) {
        await meetingsApi.update(editingMeeting.id, meetingData);
        toast.success("Meeting updated successfully");
      } else {
        await meetingsApi.create(meetingData);
        toast.success("Meeting scheduled successfully");
      }
      await refreshData();
      setEditingMeeting(null);
    } catch (error) {
      toast.error("Failed to save meeting");
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setMeetingDialogOpen(true);
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      await meetingsApi.delete(id);
      toast.success("Meeting deleted");
      await refreshData();
    } catch (error) {
      toast.error("Failed to delete meeting");
    }
  };

  // Person handlers
  const handleSavePerson = async (personData: Omit<Person, "id" | "createdAt">) => {
    try {
      if (editingPerson) {
        await personsApi.update(editingPerson.id, personData);
        toast.success("Person updated successfully");
      } else {
        await personsApi.create(personData);
        toast.success("Person added successfully");
      }
      await refreshData();
      setEditingPerson(null);
    } catch (error) {
      toast.error("Failed to save person");
    }
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setPersonDialogOpen(true);
  };

  const handleDeletePerson = async (id: string) => {
    try {
      await personsApi.delete(id);
      toast.success("Person deleted");
      await refreshData();
    } catch (error) {
      toast.error("Failed to delete person");
    }
  };

  // Hotel handlers
  const handleSaveHotel = async (hotelData: Omit<Hotel, "id" | "createdAt">) => {
    try {
      if (editingHotel) {
        await hotelsApi.update(editingHotel.id, hotelData);
        toast.success("Hotel updated successfully");
      } else {
        await hotelsApi.create(hotelData);
        toast.success("Hotel added successfully");
      }
      await refreshData();
      setEditingHotel(null);
    } catch (error) {
      toast.error("Failed to save hotel");
    }
  };

  const handleEditHotel = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setHotelDialogOpen(true);
  };

  const handleDeleteHotel = async (id: string) => {
    try {
      await hotelsApi.delete(id);
      toast.success("Hotel deleted");
      await refreshData();
    } catch (error) {
      toast.error("Failed to delete hotel");
    }
  };

  // Filter meetings by search and view, then sort by date
  const filteredMeetings = meetings
    .filter((meeting) => {
      const person = persons.find((p) => p.id === meeting.personId);
      const hotel = hotels.find((h) => h.id === meeting.hotelId);
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        meeting.title.toLowerCase().includes(searchLower) ||
        meeting.destination.toLowerCase().includes(searchLower) ||
        person?.name.toLowerCase().includes(searchLower) ||
        hotel?.name.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Filter by view
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const fromDate = new Date(meeting.fromDate);
      const toDate = new Date(meeting.toDate);

      if (meetingView === 'future') {
        // Future: toDate is today or later (meeting hasn't ended yet)
        return toDate >= today;
      } else if (meetingView === 'past') {
        // Past: toDate is before today (meeting has ended)
        return toDate < today;
      }
      return true; // 'all'
    })
    .sort((a, b) => {
      // Sort by fromDate
      // Past meetings: most recent first (descending)
      // Future/All meetings: earliest first (ascending)
      if (meetingView === 'past') {
        return new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime();
      }
      return new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime();
    });



  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Meeting Diary</h1>
                <p className="text-xs text-white/70">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => refreshData(true)}
                disabled={isRefreshing}
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10"
                title="Refresh from database"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => {
                  setEditingMeeting(null);
                  setMeetingDialogOpen(true);
                }}
                className="gap-2 bg-white/20 hover:bg-white/30 backdrop-blur border-0 text-white"
              >
                <Plus className="h-4 w-4" />
                New Meeting
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* API Error Banner */}
      {apiError && (
        <div className="bg-red-500 text-white px-4 py-3 text-center">
          <p className="text-sm">
            <strong>Database Connection Error:</strong> {apiError}
          </p>
          <p className="text-xs mt-1">Check that the API is configured correctly at /api/</p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white shadow-md border-0 p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg">
              <CalendarDays className="h-4 w-4" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="persons" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg">
              <Users className="h-4 w-4" />
              Persons
            </TabsTrigger>
            <TabsTrigger value="hotels" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg">
              <Building2 className="h-4 w-4" />
              Hotels
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <Dashboard meetings={meetings} persons={persons} hotels={hotels} />
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search meetings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-zinc-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={meetingView === "future" ? "default" : "outline"}
                  className={`gap-1 ${meetingView === "future" ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white" : ""}`}
                  onClick={() => setMeetingView("future")}
                  size="sm"
                  title="Upcoming"
                >
                  <Calendar className="h-4 w-4" />
                  Upcoming
                </Button>
                <Button
                  variant={meetingView === "past" ? "default" : "outline"}
                  className={`gap-1 ${meetingView === "past" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : ""}`}
                  onClick={() => setMeetingView("past")}
                  size="sm"
                  title="Past"
                >
                  <History className="h-4 w-4" />
                  Past
                </Button>
                <Button
                  variant={meetingView === "all" ? "default" : "outline"}
                  className={`gap-1 ${meetingView === "all" ? "bg-gradient-to-r from-zinc-500 to-zinc-700 text-white" : ""}`}
                  onClick={() => setMeetingView("all")}
                  size="sm"
                  title="All"
                >
                  <ListFilter className="h-4 w-4" />
                  All
                </Button>
              </div>
            </div>

            {filteredMeetings.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-700 mb-2">No meetings found</h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Get started by scheduling your first meeting"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => {
                        setEditingMeeting(null);
                        setMeetingDialogOpen(true);
                      }}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                    >
                      Schedule Meeting
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    person={persons.find((p) => p.id === meeting.personId)}
                    hotel={hotels.find((h) => h.id === meeting.hotelId)}
                    onEdit={handleEditMeeting}
                    onDelete={handleDeleteMeeting}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Persons Tab */}
          <TabsContent value="persons" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-800">Contact Directory</h2>
              <Button
                onClick={() => {
                  setEditingPerson(null);
                  setPersonDialogOpen(true);
                }}
                className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              >
                <Plus className="h-4 w-4" />
                Add Person
              </Button>
            </div>

            <Card className="border-0 shadow-lg">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-zinc-50">
                      <TableHead>Person</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {persons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Users className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                          <p className="text-sm text-zinc-400">No contacts yet</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      persons.map((person) => (
                        <TableRow key={person.id} className="hover:bg-teal-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <ClickableAvatar
                                photo={person.photo}
                                name={person.name}
                                size="md"
                                badgeColor={person.badgeColor}
                              />
                              <span className="font-medium text-zinc-800">{person.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-600">{person.company || "-"}</TableCell>
                          <TableCell className="text-zinc-600">{person.role || "-"}</TableCell>
                          <TableCell className="text-zinc-600">
                            {person.homeCountry ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                                {person.homeCountry}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-zinc-600 hidden md:table-cell">{person.email || "-"}</TableCell>
                          <TableCell className="text-zinc-600 hidden lg:table-cell">{person.phone || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPerson(person)}
                                className="hover:bg-teal-100 hover:text-teal-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePerson(person.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Hotels Tab */}
          <TabsContent value="hotels" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-800">Hotel Directory</h2>
              <Button
                onClick={() => {
                  setEditingHotel(null);
                  setHotelDialogOpen(true);
                }}
                className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              >
                <Plus className="h-4 w-4" />
                Add Hotel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotels.length === 0 ? (
                <Card className="col-span-full border-0 shadow-lg">
                  <CardContent className="py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                      <Building2 className="h-8 w-8 text-violet-600" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-700 mb-2">No hotels yet</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                      Add hotels to use for your meetings
                    </p>
                    <Button
                      onClick={() => {
                        setEditingHotel(null);
                        setHotelDialogOpen(true);
                      }}
                      className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                    >
                      Add Hotel
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                hotels.map((hotel) => (
                  <Card key={hotel.id} className="group relative border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/80 hover:bg-white"
                        onClick={() => handleEditHotel(hotel)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/80 hover:bg-white text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteHotel(hotel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-t-xl" />
                    <CardHeader>
                      <CardTitle className="text-lg text-zinc-800">{hotel.name}</CardTitle>
                      <CardDescription className="text-zinc-500">
                        {hotel.city}, {hotel.country}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {hotel.area && (
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <MapPin className="h-4 w-4 text-violet-500" />
                          <span>{hotel.area}</span>
                        </div>
                      )}
                      <p className="text-sm text-zinc-500">{hotel.fullAddress}</p>
                      {hotel.latitude && hotel.longitude && (
                        <div className="rounded-lg overflow-hidden border border-zinc-200 mt-2">
                          <iframe
                            title={`${hotel.name} location`}
                            width="100%"
                            height="120"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${hotel.longitude - 0.005},${hotel.latitude - 0.005},${hotel.longitude + 0.005},${hotel.latitude + 0.005}&layer=mapnik&marker=${hotel.latitude},${hotel.longitude}`}
                            style={{ border: 0 }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <MeetingDialog
        open={meetingDialogOpen}
        onOpenChange={(open) => {
          setMeetingDialogOpen(open);
          if (!open) setEditingMeeting(null);
        }}
        meeting={editingMeeting}
        persons={persons}
        hotels={hotels}
        onSave={handleSaveMeeting}
        onAddHotel={() => {
          setEditingHotel(null);
          setHotelDialogOpen(true);
        }}
      />

      <PersonDialog
        open={personDialogOpen}
        onOpenChange={(open) => {
          setPersonDialogOpen(open);
          if (!open) setEditingPerson(null);
        }}
        person={editingPerson}
        onSave={handleSavePerson}
      />

      <HotelDialog
        open={hotelDialogOpen}
        onOpenChange={(open) => {
          setHotelDialogOpen(open);
          if (!open) setEditingHotel(null);
        }}
        hotel={editingHotel}
        onSave={handleSaveHotel}
      />
    </div>
  );
}

export default function Home() {
  // Top-level error boundary and try-catch for main content
  try {
    return (
      <ErrorBoundary>
        <HomeContent />
      </ErrorBoundary>
    );
  } catch (error) {
    // Fallback UI if something catastrophic happens outside React error boundary
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Critical Error</h1>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
