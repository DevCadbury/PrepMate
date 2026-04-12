import { useState } from 'react';
import { Mail, Calendar, Shield, Activity, MessageSquare, Users as UsersIcon, Code, MapPin, Clock, Ban, Trash2, Key, Flag, Eye, AlertTriangle, FileText, User, Heart, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card, CardContent } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Separator } from '../../components/ui/separator';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  lastActive: string;
  posts: number;
  followers: number;
  following: number;
  reports: number;
  codingSolved: number;
  phone?: string;
  location?: string;
  restriction?: { type: string; remaining: string; reason: string };
}

interface UserProfilePanelProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onAction?: (type: string) => void;
}

const loginHistory = [
  { ip: '192.168.1.1', location: 'San Francisco, CA', time: '2 hours ago', device: 'Chrome on Windows' },
  { ip: '192.168.1.2', location: 'San Francisco, CA', time: '1 day ago', device: 'Safari on MacOS' },
  { ip: '10.0.0.1', location: 'New York, NY', time: '3 days ago', device: 'Firefox on Linux' },
];

const activityLog = [
  { action: 'Posted a new article', time: '3 hours ago', type: 'post' },
  { action: 'Solved coding problem #234', time: '5 hours ago', type: 'code' },
  { action: 'Commented on post', time: '1 day ago', type: 'comment' },
  { action: 'Updated profile', time: '2 days ago', type: 'profile' },
  { action: 'Followed @johndoe', time: '3 days ago', type: 'follow' },
  { action: 'Submitted solution for Binary Tree', time: '4 days ago', type: 'code' },
];

const reportsAgainst = [
  { id: '1', reporter: 'Mike Johnson', reason: 'Harassment', timestamp: '2 days ago', severity: 'high' as const, status: 'pending' },
  { id: '2', reporter: 'Sara Lee', reason: 'Spam', timestamp: '1 week ago', severity: 'medium' as const, status: 'resolved' },
  { id: '3', reporter: 'Alice Brown', reason: 'Inappropriate language', timestamp: '2 weeks ago', severity: 'low' as const, status: 'resolved' },
];

const reportsMade = [
  { id: '1', target: 'Bob Wilson', reason: 'Harassment', timestamp: '3 days ago', outcome: 'valid' as const },
  { id: '2', target: 'Post #8923', reason: 'Spam', timestamp: '1 week ago', outcome: 'valid' as const },
  { id: '3', target: 'Alice Brown', reason: 'Impersonation', timestamp: '2 weeks ago', outcome: 'invalid' as const },
  { id: '4', target: 'Post #7654', reason: 'Inappropriate', timestamp: '3 weeks ago', outcome: 'valid' as const },
  { id: '5', target: 'Mike Johnson', reason: 'Harassment', timestamp: '1 month ago', outcome: 'invalid' as const },
];

const userContent = [
  { id: '1', title: 'How to ace technical interviews', type: 'post', status: 'published', views: 234, likes: 45, flags: 0, date: '2 days ago' },
  { id: '2', title: 'My system design notes', type: 'post', status: 'published', views: 567, likes: 89, flags: 0, date: '5 days ago' },
  { id: '3', title: 'Re: Best sorting algorithms', type: 'comment', status: 'flagged', views: 0, likes: 2, flags: 3, date: '1 week ago' },
  { id: '4', title: 'Dynamic programming patterns', type: 'post', status: 'published', views: 1234, likes: 178, flags: 0, date: '2 weeks ago' },
];

const followers = [
  { name: 'Alice Brown', email: 'alice@email.com', since: '3 months ago' },
  { name: 'Mike Johnson', email: 'mike@email.com', since: '2 months ago' },
  { name: 'Sara Lee', email: 'sara@email.com', since: '1 month ago' },
];

const following = [
  { name: 'Bob Wilson', email: 'bob@email.com', since: '4 months ago' },
  { name: 'Jane Smith', email: 'jane@email.com', since: '2 months ago' },
];

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = { post: 'bg-sky-500', code: 'bg-emerald-500', comment: 'bg-violet-500', profile: 'bg-amber-500', follow: 'bg-pink-500' };
  return colors[type] || 'bg-gray-500';
};

const severityColor = (s: string) => {
  switch (s) {
    case 'high': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'medium': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'low': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default: return '';
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'banned': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'suspended': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    default: return '';
  }
};

export default function UserProfilePanel({ user, open, onClose, onAction }: UserProfilePanelProps) {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'super_admin';
  const navigate = useNavigate();

  if (!user) return null;

  const handleOpenInNewTab = () => {
    window.open(`/admin/users/${user.id}`, '_blank');
  };

  const handleOpenInline = () => {
    onClose();
    navigate(`/admin/users/${user.id}`);
  };

  const validReports = reportsMade.filter(r => r.outcome === 'valid').length;
  const totalReports = reportsMade.length;
  const accuracy = totalReports > 0 ? Math.round((validReports / totalReports) * 100) : 0;
  const isMassReporter = totalReports >= 5 && accuracy < 50;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">User Profile</SheetTitle>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleOpenInline}>
                      Open Full View
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><span className="text-xs">Open dedicated profile page</span></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7" onClick={handleOpenInNewTab}>
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><span className="text-xs">Open in new tab</span></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-6 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Avatar className="size-16 border-2 border-border">
                <AvatarFallback className="text-xl bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg">{user.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${statusColor(user.status)}`}>
                      {user.status}
                    </span>
                    {user.restriction && (
                      <span className="inline-flex items-center rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5 text-[10px]">
                        <Clock className="size-2.5 mr-0.5" />{user.restriction.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="size-3" />Joined {user.joinedAt}</span>
                  <span className="flex items-center gap-1"><Activity className="size-3" />Active {user.lastActive}</span>
                </div>
              </div>
            </div>

            {/* Active restriction banner */}
            {user.restriction && (
              <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 p-3 flex items-center gap-3">
                <Shield className="size-4 text-violet-600 dark:text-violet-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-violet-800 dark:text-violet-300">Active restriction: {user.restriction.type}</p>
                  <p className="text-[11px] text-violet-600 dark:text-violet-400">{user.restriction.remaining} · {user.restriction.reason}</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {onAction && (
              <div className="flex flex-wrap gap-2">
                {user.status !== 'suspended' && user.status !== 'banned' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onAction('suspend')}>
                      <Clock className="mr-1.5 size-3.5" />Suspend
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onAction('restrict')}>
                      <Shield className="mr-1.5 size-3.5" />Restrict
                    </Button>
                  </>
                )}
                {user.status === 'banned' ? (
                  <Button variant="outline" size="sm" onClick={() => onAction('unban')}>Unban</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => onAction('ban')}><Ban className="mr-1.5 size-3.5" />Ban</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onAction('reset-password')}><Key className="mr-1.5 size-3.5" />Reset Password</Button>
                <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onAction('delete')}>
                  <Trash2 className="mr-1.5 size-3.5" />Delete
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: MessageSquare, value: user.posts, label: 'Posts' },
                { icon: UsersIcon, value: user.followers, label: 'Followers' },
                { icon: Shield, value: user.reports, label: 'Reports' },
                { icon: Code, value: user.codingSolved, label: 'Solved' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border p-3 text-center">
                  <div className="text-lg">{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="reports">
                  Reports
                  {user.reports > 0 && (
                    <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">{user.reports}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                {isSuperAdmin && <TabsTrigger value="social">Social</TabsTrigger>}
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Abuse detection */}
                {isMassReporter && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-start gap-2.5">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-amber-800 dark:text-amber-300">Potential misuse of reporting system</p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        {totalReports} reports submitted · {accuracy}% accuracy rate
                      </p>
                    </div>
                  </div>
                )}

                {/* Report metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Reports Against</div>
                    <div className="text-lg">{reportsAgainst.length}</div>
                    <div className="text-[11px] text-muted-foreground">{reportsAgainst.filter(r => r.status === 'pending').length} pending</div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Reports Made</div>
                    <div className="text-lg">{totalReports}</div>
                    <div className="text-[11px] text-muted-foreground">{validReports} valid</div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Report Accuracy</div>
                    <div className={`text-lg ${accuracy < 50 ? 'text-amber-600 dark:text-amber-400' : ''}`}>{accuracy}%</div>
                    <div className="text-[11px] text-muted-foreground">{totalReports} total</div>
                  </div>
                </div>

                {/* Login history */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Recent Logins</p>
                  <div className="space-y-2">
                    {loginHistory.map((login, index) => (
                      <div key={index} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{login.ip}</span>
                          <span className="text-[11px] text-muted-foreground">{login.time}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="size-3" />{login.location}</span>
                          <span>{login.device}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Activity */}
              <TabsContent value="activity" className="mt-4">
                <div className="space-y-1">
                  {activityLog.map((log, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`size-1.5 rounded-full mt-2 shrink-0 ${getActivityColor(log.type)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{log.action}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{log.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Reports */}
              <TabsContent value="reports" className="mt-4 space-y-4">
                {/* Reports against */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Reports Against This User</p>
                  {reportsAgainst.length === 0 ? (
                    <p className="text-center py-6 text-sm text-muted-foreground">No reports</p>
                  ) : (
                    <div className="space-y-2">
                      {reportsAgainst.map((report) => (
                        <div key={report.id} className="rounded-lg border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${severityColor(report.severity)}`}>{report.severity}</span>
                              <span className="text-sm">{report.reason}</span>
                            </div>
                            <Badge variant={report.status === 'pending' ? 'default' : 'secondary'} className="text-[11px]">{report.status}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Reported by {report.reporter}</span>
                            <span>{report.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Reports made by user */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Reports Made By This User</p>
                    {isMassReporter && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-3" />
                        Low accuracy
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {reportsMade.map((report) => (
                      <div key={report.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{report.reason}</span>
                            <span className="text-xs text-muted-foreground">→ {report.target}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{report.timestamp}</div>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                          report.outcome === 'valid'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                        }`}>
                          {report.outcome}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Content */}
              <TabsContent value="content" className="mt-4">
                <div className="space-y-2">
                  {userContent.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate">{item.title}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">{item.type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                          <span>{item.date}</span>
                          {item.views > 0 && (<span className="flex items-center gap-1"><Eye className="size-3" />{item.views}</span>)}
                          {item.likes > 0 && (<span className="flex items-center gap-1"><Heart className="size-3" />{item.likes}</span>)}
                          {item.flags > 0 && (<span className="flex items-center gap-1 text-red-500"><Flag className="size-3" />{item.flags}</span>)}
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                        item.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Social (Super Admin only) */}
              {isSuperAdmin && (
                <TabsContent value="social" className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Followers ({followers.length})</p>
                    <div className="space-y-2">
                      {followers.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <Avatar className="size-8"><AvatarFallback className="text-[10px]">{f.name.charAt(0)}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{f.name}</div>
                            <div className="text-[11px] text-muted-foreground">{f.email}</div>
                          </div>
                          <span className="text-[11px] text-muted-foreground">Since {f.since}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Following ({following.length})</p>
                    <div className="space-y-2">
                      {following.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <Avatar className="size-8"><AvatarFallback className="text-[10px]">{f.name.charAt(0)}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{f.name}</div>
                            <div className="text-[11px] text-muted-foreground">{f.email}</div>
                          </div>
                          <span className="text-[11px] text-muted-foreground">Since {f.since}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}