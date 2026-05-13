import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft, Mail, Calendar, Activity, Shield, Clock, Ban, Trash2, Key,
  MessageSquare, Users as UsersIcon, Code, MapPin, Flag, Eye, Heart,
  AlertTriangle, FileText, User, ExternalLink, Monitor, Smartphone,
  Tablet, Globe, ChevronDown, ChevronUp, Search, Filter, MoreHorizontal,
  CheckCircle, X, Laptop, ShieldAlert, TrendingDown, BarChart3, Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Separator } from '../../components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import MediaAttachment, { AttachedFile } from '../components/MediaAttachment';
import CooldownSelector from '../components/CooldownSelector';
import { toast } from 'sonner';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  getUserById, getReportsAgainst, getReportsMade, getUserContent,
  getLoginSessions, getActivity, getFollowers, getFollowing,
  getStatusHistory, getModerationInsights,
  type UserData, type ReportAgainst, type ReportMade, type UserContent,
  type LoginSession, type ActivityEvent, type SocialConnection, type StatusEvent,
} from '../data/userData';

// ---- Helpers ----
const statusColor = (s: string) => {
  switch (s) {
    case 'active': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'banned': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'suspended': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    default: return 'bg-slate-500/10 text-slate-600 border-slate-200';
  }
};

const severityColor = (s: string) => {
  switch (s) {
    case 'high': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'medium': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'low': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default: return '';
  }
};

const activityColor: Record<string, string> = {
  post: 'bg-sky-500', code: 'bg-emerald-500', comment: 'bg-violet-500',
  profile: 'bg-amber-500', follow: 'bg-pink-500', login: 'bg-slate-400',
  report: 'bg-red-500', submission: 'bg-teal-500',
};

const activityIcon: Record<string, typeof FileText> = {
  post: FileText, code: Code, comment: MessageSquare, profile: User,
  follow: UsersIcon, login: Monitor, report: Flag, submission: Code,
};

const riskColors = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  high: { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
};

const deviceIcon = (device: string | undefined | null) => {
  if (!device) return Laptop;
  const d = device.toLowerCase();
  if (d.includes('mobile')) return Smartphone;
  if (d.includes('tablet')) return Tablet;
  return Laptop;
};

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'super_admin';

  const user = useMemo(() => getUserById(id || ''), [id]);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Activity filters
  const [activityFilter, setActivityFilter] = useState('all');
  const [activitySearch, setActivitySearch] = useState('');

  // Content filters
  const [contentFilter, setContentFilter] = useState('all');
  const [contentSort, setContentSort] = useState('date');

  // Report section toggle
  const [reportSection, setReportSection] = useState<'against' | 'made'>('against');

  // Action states
  const [actionDialog, setActionDialog] = useState<{ type: string | null }>({ type: null });
  const [actionReason, setActionReason] = useState('');
  const [actionFiles, setActionFiles] = useState<AttachedFile[]>([]);
  const [suspendDuration, setSuspendDuration] = useState('7');
  const [cooldownOpen, setCooldownOpen] = useState(false);

  // Expanded items
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <User className="size-12 text-muted-foreground/30" />
        <p className="mt-4 text-lg text-muted-foreground">User not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="mr-2 size-4" />Back to Users
        </Button>
      </div>
    );
  }

  // Data
  const reportsAgainst = getReportsAgainst(user.id);
  const reportsMade = getReportsMade(user.id);
  const content = getUserContent(user.id);
  const sessions = getLoginSessions(user.id);
  const activity = getActivity(user.id);
  const followersList = getFollowers(user.id);
  const followingList = getFollowing(user.id);
  const statusHistory = getStatusHistory(user.id);
  const insights = getModerationInsights(user.id);

  // Filtered data
  const filteredActivity = activity.filter(a => {
    if (activityFilter !== 'all' && a.type !== activityFilter) return false;
    if (activitySearch && !(a.action || '').toLowerCase().includes(activitySearch.toLowerCase()) && !(a.details || '').toLowerCase().includes(activitySearch.toLowerCase())) return false;
    return true;
  });

  const filteredContent = content
    .filter(c => contentFilter === 'all' || c.status === contentFilter)
    .sort((a, b) => {
      if (contentSort === 'views') return b.views - a.views;
      if (contentSort === 'likes') return b.likes - a.likes;
      if (contentSort === 'flags') return b.flags - a.flags;
      return 0;
    });

  const toggleExpandReport = (id: string) => {
    const next = new Set(expandedReports);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedReports(next);
  };

  const handleAction = (type: string) => {
    setActionReason('');
    setActionFiles([]);
    setSuspendDuration('7');
    if (type === 'restrict') {
      setCooldownOpen(true);
      return;
    }
    setActionDialog({ type });
  };

  const confirmAction = () => {
    if ((actionDialog.type === 'ban' || actionDialog.type === 'suspend') && !actionReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    const msgs: Record<string, string> = {
      ban: `${user.name} has been banned`,
      unban: `${user.name} has been unbanned`,
      suspend: `${user.name} has been suspended for ${suspendDuration} days`,
      delete: `${user.name}'s account has been permanently deleted`,
    };
    toast.success(msgs[actionDialog.type!] || 'Action completed');
    setActionDialog({ type: null });
    if (actionDialog.type === 'delete') navigate('/admin/users');
  };

  const rc = riskColors[insights.riskLevel];

  return (
    <div className="space-y-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 border-b border-border bg-background/95 backdrop-blur-sm px-6">
        {/* Top bar */}
        <div className="flex items-center gap-3 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-xs text-muted-foreground">User Management</span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs">{user.name}</span>
          <div className="flex-1" />
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${statusColor(user.status)}`}>
            {user.status}
          </span>
        </div>

        {/* Profile header */}
        <div className="flex items-start gap-4 pb-4">
          <Avatar className="size-14 border-2 border-border shrink-0">
            <AvatarFallback className="text-lg bg-primary/10 text-primary">{(user.name || '?').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg tracking-tight">{user.name}</h1>
                  <Badge variant="outline" className="text-[10px]">{user.role}</Badge>
                  {user.restriction && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 px-1.5 py-0 text-[10px]">
                            <Clock className="size-2.5 mr-0.5" />{user.restriction.type}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{user.restriction.remaining}</p>
                          <p className="text-[11px] text-muted-foreground">{user.restriction.reason}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="size-3" />{user.email}</span>
                  {user.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{user.location}</span>}
                  <span className="flex items-center gap-1"><Calendar className="size-3" />Joined {user.joinedAt}</span>
                  <span className="flex items-center gap-1"><Activity className="size-3" />Active {user.lastActive}</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="hidden lg:flex items-center gap-4 shrink-0">
                {[
                  { label: 'Posts', value: user.posts },
                  { label: 'Followers', value: user.followers },
                  { label: 'Reports', value: insights.totalReportsAgainst },
                  { label: 'Made', value: insights.totalReportsMade },
                  { label: 'Solved', value: user.codingSolved },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-sm">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              {user.status !== 'suspended' && user.status !== 'banned' && (
                <>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction('suspend')}>
                    <Clock className="mr-1 size-3" />Suspend
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction('restrict')}>
                    <Shield className="mr-1 size-3" />Restrict
                  </Button>
                </>
              )}
              {user.status === 'banned' ? (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction('unban')}>Unban</Button>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction('ban')}>
                  <Ban className="mr-1 size-3" />Ban
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction('reset-password')}>
                <Key className="mr-1 size-3" />Reset Password
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button
                variant="outline" size="sm"
                className="h-7 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => handleAction('delete')}
              >
                <Trash2 className="mr-1 size-3" />Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex gap-6 pt-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="reports">
                Reports
                {insights.pendingReports > 0 && (
                  <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">{insights.pendingReports}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="social">Social</TabsTrigger>}
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* ======= OVERVIEW TAB ======= */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Active restriction banner */}
              {user.restriction && (
                <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 p-3 flex items-center gap-3">
                  <Shield className="size-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-violet-800 dark:text-violet-300">Active restriction: {user.restriction.type}</p>
                    <p className="text-[11px] text-violet-600 dark:text-violet-400">{user.restriction.remaining} · {user.restriction.reason}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">Remove</Button>
                </div>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Account Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusColor(user.status)}`}>{user.status}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Reports Against</div>
                  <div className="text-lg mt-0.5">{insights.totalReportsAgainst}</div>
                  <div className="text-[11px] text-muted-foreground">{insights.pendingReports} pending</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Reports Made</div>
                  <div className="text-lg mt-0.5">{insights.totalReportsMade}</div>
                  <div className="text-[11px] text-muted-foreground">{insights.reportAccuracy}% accuracy</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Coding Stats</div>
                  <div className="text-lg mt-0.5">{user.codingSolved}</div>
                  <div className="text-[11px] text-muted-foreground">problems solved</div>
                </div>
              </div>

              {/* Warnings */}
              {insights.riskLevel !== 'low' && (
                <div className="space-y-2">
                  {insights.reasons.filter(r => r !== 'No concerns detected').map((reason, i) => (
                    <div key={i} className={`rounded-lg border p-3 flex items-start gap-2.5 ${rc.bg} ${rc.border}`}>
                      <AlertTriangle className={`size-4 shrink-0 mt-0.5 ${rc.text}`} />
                      <p className={`text-xs ${rc.text}`}>{reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1.5">Bio</div>
                  <p className="text-sm">{user.bio}</p>
                </div>
              )}

              {/* Status History Timeline */}
              <div>
                <div className="text-xs text-muted-foreground mb-3">Status History</div>
                <div className="relative">
                  <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-0">
                    {statusHistory.map(event => {
                      const isActive = event.active;
                      return (
                        <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                          <div className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border ${
                            event.type === 'ban' ? 'bg-red-500/10 border-red-200 dark:border-red-800' :
                            event.type === 'suspend' || event.type === 'warn' ? 'bg-amber-500/10 border-amber-200 dark:border-amber-800' :
                            event.type === 'restrict' ? 'bg-violet-500/10 border-violet-200 dark:border-violet-800' :
                            'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800'
                          } ${isActive ? 'ring-2 ring-primary/20' : ''}`}>
                            <div className={`size-2 rounded-full ${
                              event.type === 'ban' ? 'bg-red-500' :
                              event.type === 'suspend' || event.type === 'warn' ? 'bg-amber-500' :
                              event.type === 'restrict' ? 'bg-violet-500' :
                              'bg-emerald-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{event.type.replace('_', ' ')}</span>
                              {isActive && <span className="text-[10px] text-primary bg-primary/10 rounded-full px-1.5">active</span>}
                              <span className="text-[11px] text-muted-foreground ml-auto">{event.timestamp}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{event.reason}</p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span>by {event.appliedBy}</span>
                              {event.duration && <span>· {event.duration}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Activity (compact) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Recent Activity</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => setActiveTab('activity')}>View all</Button>
                </div>
                <div className="space-y-0">
                  {activity.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-start gap-2.5 py-2">
                      <div className={`size-1.5 rounded-full mt-1.5 shrink-0 ${activityColor[a.type] || 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs">{a.action}</span>
                        {a.details && <span className="text-[11px] text-muted-foreground ml-1">{a.details}</span>}
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{a.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ======= ACTIVITY TAB ======= */}
            <TabsContent value="activity" className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search activity..." value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)} className="pl-8 h-8 text-xs" />
                </div>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <Filter className="mr-1.5 size-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="post">Posts</SelectItem>
                    <SelectItem value="code">Coding</SelectItem>
                    <SelectItem value="comment">Comments</SelectItem>
                    <SelectItem value="login">Logins</SelectItem>
                    <SelectItem value="report">Reports</SelectItem>
                    <SelectItem value="follow">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-0">
                  {filteredActivity.length === 0 ? (
                    <p className="text-center py-12 text-sm text-muted-foreground">No matching activity</p>
                  ) : filteredActivity.map(a => {
                    const Icon = activityIcon[a.type] || Activity;
                    return (
                      <div key={a.id} className="relative flex gap-3 pb-4 last:pb-0 group">
                        <div className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background`}>
                          <Icon className="size-3 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5 rounded-lg hover:bg-muted/30 -my-1 py-2 px-2 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm">{a.action}</span>
                            <span className="text-[11px] text-muted-foreground shrink-0">{a.timestamp}</span>
                          </div>
                          {a.details && (
                            <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* ======= REPORTS TAB ======= */}
            <TabsContent value="reports" className="mt-4 space-y-4">
              {/* Report summary bar */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Against</div>
                  <div className="text-lg">{reportsAgainst.length}</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Made</div>
                  <div className="text-lg">{reportsMade.length}</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Pending</div>
                  <div className="text-lg text-amber-600 dark:text-amber-400">{insights.pendingReports}</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">Accuracy</div>
                  <div className={`text-lg ${insights.reportAccuracy < 50 ? 'text-amber-600 dark:text-amber-400' : ''}`}>{insights.reportAccuracy}%</div>
                  <div className="w-full bg-border rounded-full h-1 mt-1.5">
                    <div
                      className={`h-1 rounded-full ${insights.reportAccuracy >= 70 ? 'bg-emerald-500' : insights.reportAccuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${insights.reportAccuracy}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Abuse warning */}
              {insights.totalReportsMade >= 5 && insights.reportAccuracy < 50 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-start gap-2.5">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-800 dark:text-amber-300">Potential misuse of reporting system</p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                      {insights.totalReportsMade} reports submitted with only {insights.reportAccuracy}% accuracy. {insights.invalidReports} reports were found invalid.
                    </p>
                  </div>
                </div>
              )}

              {/* Section switcher */}
              <div className="flex gap-1 border-b border-border">
                <button
                  onClick={() => setReportSection('against')}
                  className={`px-3 py-2 text-xs border-b-2 transition-colors ${
                    reportSection === 'against' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Reports Against ({reportsAgainst.length})
                </button>
                <button
                  onClick={() => setReportSection('made')}
                  className={`px-3 py-2 text-xs border-b-2 transition-colors ${
                    reportSection === 'made' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Reports Made ({reportsMade.length})
                </button>
              </div>

              {reportSection === 'against' ? (
                <div className="space-y-2">
                  {reportsAgainst.length === 0 ? (
                    <div className="flex flex-col items-center py-12"><Flag className="size-8 text-muted-foreground/30" /><p className="mt-3 text-sm text-muted-foreground">No reports against this user</p></div>
                  ) : reportsAgainst.map(report => {
                    const isExpanded = expandedReports.has(report.id);
                    return (
                      <div key={report.id} className={`rounded-lg border transition-colors ${
                        report.severity === 'high' && report.status === 'pending' ? 'border-red-200 dark:border-red-900' : 'border-border'
                      }`}>
                        <button onClick={() => toggleExpandReport(report.id)} className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/30 transition-colors rounded-lg">
                          <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                            report.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {report.status === 'pending' ? <Flag className="size-3.5" /> : <CheckCircle className="size-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] ${severityColor(report.severity)}`}>{report.severity}</span>
                              <span className="text-sm">{report.reason}</span>
                              <span className="ml-auto text-[11px] text-muted-foreground">{report.timestamp}</span>
                              {isExpanded ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {report.contentType} · by {report.reporter}
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border px-3 pb-3 space-y-2.5">
                            <div className="mt-2.5 rounded-lg bg-muted/50 p-3">
                              {report.contentTitle && <p className="text-xs mb-1">{report.contentTitle}</p>}
                              <p className="text-xs text-muted-foreground">{report.contentPreview}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>Reporter: {report.reporter}</span>
                              <span>({report.reporterEmail})</span>
                            </div>
                            {report.status === 'resolved' && report.moderationAction && (
                              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-2.5 flex items-center gap-2">
                                <Shield className="size-3 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[11px] text-emerald-800 dark:text-emerald-300">{report.moderationAction} · by {report.moderatedBy} · {report.moderatedAt}</span>
                              </div>
                            )}
                            {report.status === 'pending' && (
                              <div className="flex items-center gap-2 pt-1">
                                <Button size="sm" variant="outline" className="h-7 text-xs"><X className="size-3 mr-1" />Dismiss</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs"><AlertTriangle className="size-3 mr-1" />Warn</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs"><Clock className="size-3 mr-1" />Suspend</Button>
                                <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"><Ban className="size-3 mr-1" />Ban</Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {reportsMade.length === 0 ? (
                    <div className="flex flex-col items-center py-12"><Flag className="size-8 text-muted-foreground/30" /><p className="mt-3 text-sm text-muted-foreground">No reports made by this user</p></div>
                  ) : (
                    <>
                      {/* Breakdown */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          {insights.validReports} valid
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-red-500" />
                          {insights.invalidReports} invalid
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-amber-500" />
                          {reportsMade.filter(r => r.outcome === 'pending').length} pending
                        </span>
                      </div>
                      {reportsMade.map(report => (
                        <div key={report.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{report.reason}</span>
                              <span className="text-xs text-muted-foreground">→ {report.target}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{report.timestamp}</div>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                            report.outcome === 'valid' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            report.outcome === 'invalid' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                            'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          }`}>{report.outcome}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ======= CONTENT TAB ======= */}
            <TabsContent value="content" className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Select value={contentFilter} onValueChange={setContentFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <Filter className="mr-1.5 size-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="removed">Removed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={contentSort} onValueChange={setContentSort}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">By Date</SelectItem>
                    <SelectItem value="views">By Views</SelectItem>
                    <SelectItem value="likes">By Likes</SelectItem>
                    <SelectItem value="flags">By Flags</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {filteredContent.map(item => (
                  <div key={item.id} className={`rounded-lg border p-3 hover:bg-muted/30 transition-colors ${
                    item.status === 'flagged' ? 'border-red-200 dark:border-red-900' : 'border-border'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.title}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">{item.type}</Badge>
                        </div>
                        {item.preview && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.preview}</p>}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                          <span>{item.date}</span>
                          {item.views > 0 && <span className="flex items-center gap-1"><Eye className="size-3" />{item.views}</span>}
                          {item.likes > 0 && <span className="flex items-center gap-1"><Heart className="size-3" />{item.likes}</span>}
                          {item.comments > 0 && <span className="flex items-center gap-1"><MessageSquare className="size-3" />{item.comments}</span>}
                          {item.flags > 0 && <span className="flex items-center gap-1 text-red-500"><Flag className="size-3" />{item.flags}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                          item.status === 'published' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                          item.status === 'flagged' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                          item.status === 'draft' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' :
                          'bg-slate-500/10 text-slate-600 border-slate-200'
                        }`}>{item.status}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7"><MoreHorizontal className="size-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="mr-2 size-3.5" />View</DropdownMenuItem>
                            {item.status === 'flagged' && <DropdownMenuItem><CheckCircle className="mr-2 size-3.5" />Approve</DropdownMenuItem>}
                            <DropdownMenuItem className="text-red-600 dark:text-red-400"><Trash2 className="mr-2 size-3.5" />Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ======= SOCIAL TAB ======= */}
            {isSuperAdmin && (
              <TabsContent value="social" className="mt-4 space-y-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Followers ({followersList.length})</div>
                  <div className="space-y-2">
                    {followersList.map(f => (
                      <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                        <Avatar className="size-8"><AvatarFallback className="text-[10px]">{(f.name || '?').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{f.name}</span>
                            <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] ${statusColor(f.status)}`}>{f.status}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{f.email}</div>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{f.since}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7" onClick={() => window.open(`/admin/users/${f.id}`, '_blank')}>
                                <ExternalLink className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><span className="text-xs">Inspect user</span></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Following ({followingList.length})</div>
                  <div className="space-y-2">
                    {followingList.map(f => (
                      <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                        <Avatar className="size-8"><AvatarFallback className="text-[10px]">{(f.name || '?').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{f.name}</span>
                            <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] ${statusColor(f.status)}`}>{f.status}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{f.email}</div>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{f.since}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7" onClick={() => window.open(`/admin/users/${f.id}`, '_blank')}>
                                <ExternalLink className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><span className="text-xs">Inspect user</span></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}

            {/* ======= SECURITY TAB ======= */}
            <TabsContent value="security" className="mt-4 space-y-4">
              {sessions.some(s => s.suspicious) && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-start gap-2.5">
                  <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-800 dark:text-amber-300">{sessions.filter(s => s.suspicious).length} suspicious login(s) detected</p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Unusual locations or devices that differ from this user's typical pattern.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{sessions.length} total sessions</span>
                <span>·</span>
                <span>{new Set(sessions.map(s => s.ip)).size} unique IPs</span>
                <span>·</span>
                <span>{new Set(sessions.map(s => s.location)).size} locations</span>
              </div>

              <div className="space-y-2">
                {sessions.map(session => {
                  const DeviceIcon = deviceIcon(session.device);
                  return (
                    <div key={session.id} className={`rounded-lg border p-3 ${
                      session.suspicious
                        ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10'
                        : 'border-border'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          session.suspicious
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : session.current
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          <DeviceIcon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{session.ip}</span>
                            {session.current && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-1.5">current</span>}
                            {session.suspicious && <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-1.5">suspicious</span>}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><MapPin className="size-3" />{session.location}</span>
                            <span>{session.browser} · {session.os}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-muted-foreground">{session.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar — Moderation Insights */}
        <div className="hidden xl:block w-72 shrink-0 space-y-4">
          {/* Risk level */}
          <div className={`rounded-lg border p-4 ${rc.bg} ${rc.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`size-2.5 rounded-full ${rc.dot}`} />
              <span className={`text-xs ${rc.text}`}>Risk Level: {insights.riskLevel.toUpperCase()}</span>
            </div>
            <div className="space-y-1">
              {insights.reasons.map((r, i) => (
                <p key={i} className={`text-[11px] ${rc.text}`}>• {r}</p>
              ))}
            </div>
          </div>

          {/* Report breakdown */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="text-xs text-muted-foreground">Report Intelligence</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Against user</span>
                <span>{insights.totalReportsAgainst}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Made by user</span>
                <span>{insights.totalReportsMade}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Valid</span>
                <span>{insights.validReports}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" />Invalid</span>
                <span>{insights.invalidReports}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />Pending</span>
                <span>{insights.pendingReports}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Accuracy</span>
                <span className={insights.reportAccuracy < 50 ? 'text-amber-600 dark:text-amber-400' : ''}>{insights.reportAccuracy}%</span>
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="text-xs text-muted-foreground">Quick Info</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Suspicious logins</span>
                <span className={insights.suspiciousLogins > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>{insights.suspiciousLogins}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Flagged content</span>
                <span className={insights.flaggedContent > 0 ? 'text-red-600 dark:text-red-400' : ''}>{insights.flaggedContent}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Posts</span>
                <span>{user.posts}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Followers</span>
                <span>{user.followers}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Following</span>
                <span>{user.following}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cooldown selector */}
      <CooldownSelector
        open={cooldownOpen}
        onClose={() => setCooldownOpen(false)}
        userName={user.name}
        onApply={(restriction) => {
          toast.success(`Restriction applied to ${user.name}`);
          setCooldownOpen(false);
        }}
      />

      {/* Action Dialog */}
      <AlertDialog open={actionDialog.type === 'ban' || actionDialog.type === 'unban' || actionDialog.type === 'suspend' || actionDialog.type === 'delete'} onOpenChange={() => setActionDialog({ type: null })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {(actionDialog.type === 'ban' || actionDialog.type === 'delete') && (
                <div className="flex size-8 items-center justify-center rounded-full bg-red-500/10"><AlertTriangle className="size-4 text-red-500" /></div>
              )}
              {actionDialog.type === 'ban' && 'Ban User'}
              {actionDialog.type === 'unban' && 'Unban User'}
              {actionDialog.type === 'suspend' && 'Suspend User'}
              {actionDialog.type === 'delete' && 'Delete User Account'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {actionDialog.type === 'ban' && `Are you sure you want to ban ${user.name}?`}
                  {actionDialog.type === 'unban' && `Restore full access for ${user.name}?`}
                  {actionDialog.type === 'suspend' && `Temporarily restrict ${user.name}'s access?`}
                  {actionDialog.type === 'delete' && `Permanently delete ${user.name}'s account? This cannot be undone.`}
                </p>
                {(actionDialog.type === 'ban' || actionDialog.type === 'delete') && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 space-y-1.5">
                    <p className="text-xs text-red-800 dark:text-red-300">This will:</p>
                    <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                      {actionDialog.type === 'ban' && (<><li>Immediately revoke platform access</li><li>Hide all user content from public view</li></>)}
                      {actionDialog.type === 'delete' && (<><li>Remove account and all personal data</li><li>Delete all posts, comments, and submissions</li><li>This action cannot be undone</li></>)}
                    </ul>
                  </div>
                )}
                {actionDialog.type === 'suspend' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Duration</Label>
                    <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem><SelectItem value="3">3 days</SelectItem><SelectItem value="7">7 days</SelectItem><SelectItem value="14">14 days</SelectItem><SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(actionDialog.type === 'ban' || actionDialog.type === 'suspend') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reason <span className="text-red-500">*</span></Label>
                    <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Provide a reason..." rows={2} className="resize-none" />
                  </div>
                )}
                {actionDialog.type !== 'unban' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Attach evidence (optional)</Label>
                    <MediaAttachment files={actionFiles} onChange={setActionFiles} maxFiles={3} compact />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} className={(actionDialog.type === 'ban' || actionDialog.type === 'delete') ? 'bg-red-600 hover:bg-red-700 text-white' : ''}>
              {actionDialog.type === 'delete' && 'Delete Permanently'}
              {actionDialog.type === 'ban' && 'Ban User'}
              {actionDialog.type === 'unban' && 'Unban User'}
              {actionDialog.type === 'suspend' && 'Suspend User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={actionDialog.type === 'reset-password'} onOpenChange={() => setActionDialog({ type: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Generate a password reset link for {user.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Avatar className="size-10"><AvatarFallback>{(user.name || '?').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              <div>
                <div className="text-sm">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <Button className="w-full" onClick={() => { toast.success('Reset link sent to ' + user.email); setActionDialog({ type: null }); }}>
              <Mail className="size-4 mr-2" />Send Reset Link via Email
            </Button>
            <p className="text-xs text-muted-foreground">This link expires in 24 hours.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null })}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
