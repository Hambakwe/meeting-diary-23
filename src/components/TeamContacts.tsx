'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Building2,
  User,
  Users,
  Shield,
  Briefcase,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// Team member interface from API
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
  category_id: number;
  category_slug?: string;
  category_name?: string;
  is_primary: boolean;
}

// Team member categories
const teamCategories = [
  { id: 'all', label: 'All Team' },
  { id: 'ocf', label: 'OCF Team' },
  { id: 'legal', label: 'Legal' },
  { id: 'advisors', label: 'Advisors' },
  { id: 'client', label: 'Client Team' },
];

// Fallback sample team members (used when API not available)
const sampleTeamMembers: TeamMember[] = [
  // OCF Team
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Deal Manager',
    category_id: 1,
    category_slug: 'ocf',
    email: 'sarah@oasiscapitalfinance.com',
    phone: '+44 20 7123 4567',
    mobile: '+44 7700 900123',
    company: 'Oasis Capital Finance',
    location: 'London, UK',
    linkedin_url: 'linkedin.com/in/sarahjohnson',
    avatar_url: '',
    is_primary: true,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Senior Analyst',
    category_id: 1,
    category_slug: 'ocf',
    email: 'michael@oasiscapitalfinance.com',
    phone: '+44 20 7123 4568',
    mobile: '+44 7700 900124',
    company: 'Oasis Capital Finance',
    location: 'London, UK',
    linkedin_url: 'linkedin.com/in/michaelchen',
    avatar_url: '',
    is_primary: false,
  },
  {
    id: 3,
    name: 'Emma Williams',
    role: 'Associate',
    category_id: 1,
    category_slug: 'ocf',
    email: 'emma@oasiscapitalfinance.com',
    phone: '+44 20 7123 4569',
    company: 'Oasis Capital Finance',
    location: 'London, UK',
    avatar_url: '',
    is_primary: false,
  },
  // Legal
  {
    id: 4,
    name: 'James Morrison',
    role: 'Partner - Capital Markets',
    category_id: 2,
    category_slug: 'legal',
    email: 'j.morrison@linklaters.com',
    phone: '+44 20 7456 7890',
    company: 'Linklaters LLP',
    location: 'London, UK',
    linkedin_url: 'linkedin.com/in/jamesmorrison',
    avatar_url: '',
    is_primary: true,
  },
  {
    id: 5,
    name: 'Anna Schmidt',
    role: 'Senior Associate',
    category_id: 2,
    category_slug: 'legal',
    email: 'a.schmidt@linklaters.com',
    phone: '+44 20 7456 7891',
    company: 'Linklaters LLP',
    location: 'London, UK',
    avatar_url: '',
    is_primary: false,
  },
  // Advisors
  {
    id: 6,
    name: 'Robert Anderson',
    role: 'Credit Rating Analyst',
    category_id: 3,
    category_slug: 'advisors',
    email: 'r.anderson@moodys.com',
    phone: '+44 20 7789 0123',
    company: "Moody's Investors Service",
    location: 'London, UK',
    avatar_url: '',
    is_primary: true,
  },
  {
    id: 7,
    name: 'Lisa Tanaka',
    role: 'Tax Advisor',
    category_id: 3,
    category_slug: 'advisors',
    email: 'l.tanaka@pwc.com',
    phone: '+44 20 7890 1234',
    company: 'PricewaterhouseCoopers',
    location: 'London, UK',
    avatar_url: '',
    is_primary: false,
  },
  // Client Team
  {
    id: 8,
    name: 'Henrik Larsson',
    role: 'CFO',
    category_id: 4,
    category_slug: 'client',
    email: 'h.larsson@acmecorp.com',
    phone: '+46 8 123 4567',
    company: 'Acme Corporation',
    location: 'Stockholm, Sweden',
    avatar_url: '',
    is_primary: true,
  },
  {
    id: 9,
    name: 'Maria Svensson',
    role: 'Treasury Manager',
    category_id: 4,
    category_slug: 'client',
    email: 'm.svensson@acmecorp.com',
    phone: '+46 8 123 4568',
    company: 'Acme Corporation',
    location: 'Stockholm, Sweden',
    avatar_url: '',
    is_primary: false,
  },
];

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'ocf':
      return <Building2 className="h-4 w-4" />;
    case 'legal':
      return <Shield className="h-4 w-4" />;
    case 'advisors':
      return <Briefcase className="h-4 w-4" />;
    case 'client':
      return <Users className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'ocf':
      return 'from-teal-500 to-teal-600';
    case 'legal':
      return 'from-blue-500 to-blue-600';
    case 'advisors':
      return 'from-purple-500 to-purple-600';
    case 'client':
      return 'from-amber-500 to-amber-600';
    default:
      return 'from-stone-500 to-stone-600';
  }
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0">
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300" />
      )}
    </Button>
  );
}

export function TeamContacts() {
  const { currentProject } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(sampleTeamMembers);
  const [loading, setLoading] = useState(true);

  // Fetch team members from API
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const res = await fetch('/api/contacts.php');
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          // Map API response to our format
          const members = data.data.map((m: Record<string, unknown>) => ({
            ...m,
            category_slug: m.category_slug || getCategorySlugById(m.category_id as number),
          }));
          setTeamMembers(members);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        // Keep using sample data on error
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Helper to get category slug by ID (fallback)
  const getCategorySlugById = (id: number): string => {
    const slugMap: Record<number, string> = { 1: 'ocf', 2: 'legal', 3: 'advisors', 4: 'client' };
    return slugMap[id] || 'ocf';
  };

  // Filter team members
  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || member.category_slug === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Group stats
  const categoryStats = teamCategories.slice(1).map((cat) => ({
    ...cat,
    count: teamMembers.filter((m) => m.category_slug === cat.id).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-white">
            Deal Team Contacts
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Contact information for the {currentProject?.name || 'deal'} team
          </p>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categoryStats.map((cat) => (
          <Card
            key={cat.id}
            className={`bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 cursor-pointer transition-all ${
              activeCategory === cat.id ? 'ring-2 ring-teal-500' : 'hover:shadow-md'
            }`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(cat.id)}`}>
                  <span className="text-white">{getCategoryIcon(cat.id)}</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-stone-800 dark:text-white">{cat.count}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{cat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search by name, role, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700"
              />
            </div>
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-5 md:flex bg-stone-100 dark:bg-stone-900">
                {teamCategories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Grid */}
      {filteredMembers.length === 0 ? (
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
              <p className="text-stone-500 dark:text-stone-400">No team members found</p>
              <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:shadow-lg transition-all"
            >
              <CardContent className="pt-6">
                {/* Avatar and Name */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Show image if avatar_url exists, otherwise show initials */}
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(
                        member.category_slug || ''
                      )} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white font-semibold text-lg">
                        {getInitials(member.name)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-800 dark:text-white truncate">
                        {member.name}
                      </h3>
                      {member.is_primary && (
                        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{member.role}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3" />
                      {member.company}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  {member.email && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 min-w-0">
                        <Mail className="h-4 w-4 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <CopyButton text={member.email} label="Email" />
                    </div>
                  )}

                  {member.phone && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                        <Phone className="h-4 w-4 text-stone-400 flex-shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                      <CopyButton text={member.phone} label="Phone" />
                    </div>
                  )}

                  {member.mobile && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                        <Phone className="h-4 w-4 text-stone-400 flex-shrink-0" />
                        <span>{member.mobile}</span>
                        <Badge variant="outline" className="text-xs">Mobile</Badge>
                      </div>
                      <CopyButton text={member.mobile} label="Mobile" />
                    </div>
                  )}

                  {member.location && (
                    <div className="flex items-center gap-2 p-2 text-stone-500 dark:text-stone-400">
                      <MapPin className="h-4 w-4 text-stone-400 flex-shrink-0" />
                      <span>{member.location}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                  {member.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-stone-600 dark:text-stone-300"
                      onClick={() => (window.location.href = `mailto:${member.email}`)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                  {member.linkedin_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-stone-600 dark:text-stone-300"
                      onClick={() => window.open(`https://${member.linkedin_url}`, '_blank')}
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
