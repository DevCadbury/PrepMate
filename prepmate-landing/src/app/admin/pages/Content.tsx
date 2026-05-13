import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Filter, Trash2, CheckCircle, AlertTriangle, Eye, Flag, MoreHorizontal } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Checkbox } from '../../components/ui/checkbox';
import { Separator } from '../../components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { apiClient } from '../../../lib/apiClient';
import { mapBackendPostToContentRow } from '../lib/backendAdapters';

type Post = {
  id: string;
  title: string;
  author: string;
  content: string;
  createdAt: string;
  status: 'published' | 'flagged' | 'removed';
  flags: number;
  views: number;
};

type BackendPostRecord = {
  id: string;
  status?: string;
  contentPreview?: string;
  reportsCount?: number;
  pendingReportsCount?: number;
  latestReportReason?: string;
  createdAt?: string;
  user?: {
    id: string;
    name?: string;
    username?: string;
  } | null;
};

type ListPostsResponse = {
  success?: boolean;
  data?: {
    posts?: BackendPostRecord[];
  };
};

const statusStyles = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'flagged':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'removed':
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default:
      return '';
  }
};

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve' | 'remove' | 'warn' | null;
    post: Post | null;
  }>({ type: null, post: null });
  const [actionReason, setActionReason] = useState('');

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('limit', '200');

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      if (statusFilter === 'published') {
        params.set('status', 'active');
      }

      if (statusFilter === 'removed') {
        params.set('status', 'hidden');
      }

      if (statusFilter === 'flagged') {
        params.set('reportedOnly', 'true');
      }

      const response = await apiClient.get<ListPostsResponse>(`/admin/social/posts?${params.toString()}`);
      const backendPosts = response?.data?.posts;
      const rows = Array.isArray(backendPosts) ? backendPosts : [];
      const mapped = rows.map((post) => mapBackendPostToContentRow(post as any));
      setPosts(mapped);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = useMemo(() => {
    return (posts || []).filter((post) => {
      const matchesSearch =
        (post?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (post?.author || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      const matchesStatus = statusFilter === 'all' || post?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [posts, searchQuery, statusFilter]);

  const allSelected = filteredPosts.length > 0 && filteredPosts.every((post) => selectedIds.has(post.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredPosts.map((post) => post.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const moderatePost = async (postId: string, decision: 'approve' | 'remove') => {
    await apiClient.patch(`/admin/social/posts/${postId}/moderate`, {
      status: decision === 'approve' ? 'active' : 'hidden',
      resolutionNote: actionReason.trim(),
    });
  };

  const confirmAction = async () => {
    if (!actionDialog.post || !actionDialog.type) return;

    setIsSubmitting(true);

    try {
      if (actionDialog.type === 'warn') {
        toast.success(`Warning recorded for ${actionDialog.post.author}`);
      } else {
        await moderatePost(actionDialog.post.id, actionDialog.type);
        toast.success(actionDialog.type === 'approve' ? 'Post approved' : 'Post removed');
      }

      setActionDialog({ type: null, post: null });
      setActionReason('');
      await fetchPosts();
    } catch (error: any) {
      toast.error(error?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'remove') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsSubmitting(true);

    try {
      await Promise.allSettled(ids.map((id) => moderatePost(id, action)));
      toast.success(`${ids.length} post(s) ${action === 'approve' ? 'approved' : 'removed'}`);
      setSelectedIds(new Set());
      await fetchPosts();
    } catch (error: any) {
      toast.error(error?.message || 'Bulk moderation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const flaggedCount = posts.filter((post) => post.status === 'flagged').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight">Content Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and moderate user-generated content
          </p>
        </div>
        {flaggedCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5">
            <Flag className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-700 dark:text-amber-400">{flaggedCount} flagged post(s) need review</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 size-4" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <Separator orientation="vertical" className="h-5" />
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('approve')} disabled={isSubmitting}>
            <CheckCircle className="mr-1.5 size-3.5" />
            Approve
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleBulkAction('remove')} disabled={isSubmitting}>
            <Trash2 className="mr-1.5 size-3.5" />
            Remove
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Loading posts...</TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No posts found</TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id} className={selectedIds.has(post.id) ? 'bg-primary/[0.03]' : ''}>
                  <TableCell>
                    <Checkbox checked={selectedIds.has(post.id)} onCheckedChange={() => toggleOne(post.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-sm">
                      <div className="text-sm line-clamp-1">{post.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{post.content}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">{(post.author || '?').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{post.author}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusStyles(post.status)}`}>
                      {post.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {post.flags > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                        <Flag className="size-3" />
                        {post.flags}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{post.views.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{post.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info('Preview route is not available for this content yet')}>
                          <Eye className="mr-2 size-4" />
                          View Post
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {post.status === 'flagged' && (
                          <DropdownMenuItem onClick={() => setActionDialog({ type: 'approve', post })}>
                            <CheckCircle className="mr-2 size-4" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setActionDialog({ type: 'remove', post })}>
                          <Trash2 className="mr-2 size-4" />
                          Remove
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActionDialog({ type: 'warn', post })}>
                          <AlertTriangle className="mr-2 size-4" />
                          Warn Author
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredPosts.length} of {posts.length} posts
      </div>

      <AlertDialog
        open={actionDialog.type !== null}
        onOpenChange={() => {
          setActionDialog({ type: null, post: null });
          setActionReason('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'approve' && 'Approve Post'}
              {actionDialog.type === 'remove' && 'Remove Post'}
              {actionDialog.type === 'warn' && 'Warn Author'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {actionDialog.type === 'approve' && 'Approve this post and clear all flags?'}
                  {actionDialog.type === 'remove' && `Remove "${actionDialog.post?.title}"? The author will be notified.`}
                  {actionDialog.type === 'warn' && `Record a warning for ${actionDialog.post?.author}?`}
                </p>
                {(actionDialog.type === 'remove' || actionDialog.type === 'warn') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reason</Label>
                    <Textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Provide a reason..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isSubmitting}
              className={actionDialog.type === 'remove' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {isSubmitting ? 'Processing...' : null}
              {!isSubmitting && actionDialog.type === 'approve' && 'Approve'}
              {!isSubmitting && actionDialog.type === 'remove' && 'Remove Post'}
              {!isSubmitting && actionDialog.type === 'warn' && 'Send Warning'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
