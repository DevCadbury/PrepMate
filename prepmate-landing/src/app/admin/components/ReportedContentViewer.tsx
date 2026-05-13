import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card, CardContent } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  User,
  Calendar,
  Flag,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  AlertTriangle,
  CheckCircle,
  X as XIcon,
} from 'lucide-react';
import { useState } from 'react';
import UserProfilePanel from './UserProfilePanel';

interface Reporter {
  id: string;
  name: string;
  email: string;
  reason: string;
  timestamp: string;
}

interface ReportedContent {
  id: string;
  type: 'post' | 'comment';
  title?: string;
  content: string;
  author: {
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
  };
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reporters: Reporter[];
  severity: 'low' | 'medium' | 'high';
}

interface ReportedContentViewerProps {
  content: ReportedContent | null;
  open: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onRemove?: () => void;
  onWarnUser?: () => void;
  onBanUser?: () => void;
}

export default function ReportedContentViewer({
  content,
  open,
  onClose,
  onApprove,
  onRemove,
  onWarnUser,
  onBanUser,
}: ReportedContentViewerProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  if (!content) return null;

  const handleViewProfile = (user: any) => {
    setSelectedUser(user);
    setProfileOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Reported Content Review</DialogTitle>
              <Badge
                variant={
                  content.severity === 'high'
                    ? 'destructive'
                    : content.severity === 'medium'
                    ? 'default'
                    : 'secondary'
                }
                className="text-sm px-3 py-1"
              >
                {content.severity} severity
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Author Info Card */}
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="size-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {(content.author.name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{content.author.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {content.author.role}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{content.author.email}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProfile(content.author)}
                      >
                        <User className="size-4 mr-2" />
                        View Full Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Card */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{content.type}</Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        {content.createdAt}
                      </div>
                    </div>

                    {content.title && (
                      <h3 className="text-xl font-semibold">{content.title}</h3>
                    )}

                    <div className="prose prose-sm max-w-none">
                      <p className="text-foreground whitespace-pre-wrap">{content.content}</p>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="size-4" />
                        <span>{content.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="size-4" />
                        <span>{content.likes} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="size-4" />
                        <span>{content.comments} comments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="size-4" />
                        <span>{content.shares} shares</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reports Tab */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Flag className="size-5 text-destructive" />
                      <h3 className="font-semibold text-lg">
                        Reports ({content.reporters.length})
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {content.reporters.map((reporter, index) => (
                        <div
                          key={reporter.id}
                          className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="size-8">
                                <AvatarFallback className="text-xs">
                                  {(reporter.name || '?').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">{reporter.name}</div>
                                <div className="text-xs text-muted-foreground">{reporter.email}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="size-4 text-destructive mt-0.5" />
                              <div>
                                <div className="text-sm font-medium">Reason: {reporter.reason}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Reported {reporter.timestamp}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>

          {/* Action Footer */}
          <div className="border-t border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
              <div className="flex gap-2">
                {onApprove && (
                  <Button variant="outline" onClick={onApprove}>
                    <CheckCircle className="size-4 mr-2" />
                    Approve Content
                  </Button>
                )}
                {onWarnUser && (
                  <Button variant="outline" onClick={onWarnUser}>
                    <AlertTriangle className="size-4 mr-2" />
                    Warn User
                  </Button>
                )}
                {onRemove && (
                  <Button variant="destructive" onClick={onRemove}>
                    <XIcon className="size-4 mr-2" />
                    Remove Content
                  </Button>
                )}
                {onBanUser && (
                  <Button variant="destructive" onClick={onBanUser}>
                    Ban User
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UserProfilePanel user={selectedUser} open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}