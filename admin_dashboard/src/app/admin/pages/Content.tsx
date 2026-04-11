import { useState } from 'react';
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
import { Badge } from '../../components/ui/badge';
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
import MediaAttachment, { AttachedFile } from '../components/MediaAttachment';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  author: string;
  content: string;
  createdAt: string;
  status: 'published' | 'flagged' | 'removed';
  flags: number;
  views: number;
}

const mockPosts: Post[] = [
  { id: '1', title: 'How to ace your technical interview', author: 'John Doe', content: 'Here are my top tips for technical interviews...', createdAt: '2 hours ago', status: 'published', flags: 0, views: 234 },
  { id: '2', title: 'Best practices for system design', author: 'Jane Smith', content: 'System design can be challenging, but...', createdAt: '5 hours ago', status: 'published', flags: 0, views: 567 },
  { id: '3', title: 'Inappropriate content example', author: 'Bob Wilson', content: 'This content has been flagged...', createdAt: '1 day ago', status: 'flagged', flags: 8, views: 89 },
  { id: '4', title: 'Data structures cheat sheet', author: 'Alice Brown', content: 'A comprehensive guide to data structures...', createdAt: '2 days ago', status: 'published', flags: 1, views: 1234 },
  { id: '5', title: 'Suspicious promotional content', author: 'Mike Johnson', content: 'Check out this amazing offer...', createdAt: '3 days ago', status: 'flagged', flags: 5, views: 45 },
  { id: '6', title: 'Algorithm complexity explained', author: 'Sara Lee', content: 'Understanding Big O notation...', createdAt: '4 days ago', status: 'published', flags: 0, views: 890 },
];

const statusStyles = (status: string) => {
  switch (status) {
    case 'published': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'flagged': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'removed': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default: return '';
  }
};

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve' | 'remove' | 'warn' | null;
    post: Post | null;
  }>({ type: null, post: null });
  const [actionReason, setActionReason] = useState('');
  const [actionFiles, setActionFiles] = useState<AttachedFile[]>([]);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allSelected = filteredPosts.length > 0 && filteredPosts.every(p => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredPosts.map(p => p.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const confirmAction = () => {
    if (!actionDialog.post) return;
    const updatedPosts = posts.map((p) => {
      if (p.id === actionDialog.post?.id) {
        if (actionDialog.type === 'approve') return { ...p, status: 'published' as const, flags: 0 };
        if (actionDialog.type === 'remove') return { ...p, status: 'removed' as const };
      }
      return p;
    });
    setPosts(updatedPosts);
    const messages = { approve: 'Post approved', remove: 'Post removed', warn: 'Warning sent to user' };
    toast.success(messages[actionDialog.type!] || 'Done');
    setActionDialog({ type: null, post: null });
    setActionReason('');
    setActionFiles([]);
  };

  const handleBulkAction = (action: 'approve' | 'remove') => {
    const count = selectedIds.size;
    setPosts(posts.map(p => {
      if (!selectedIds.has(p.id)) return p;
      if (action === 'approve') return { ...p, status: 'published' as const, flags: 0 };
      return { ...p, status: 'removed' as const };
    }));
    toast.success(`${count} post(s) ${action === 'approve' ? 'approved' : 'removed'}`);
    setSelectedIds(new Set());
  };

  const flaggedCount = posts.filter(p => p.status === 'flagged').length;

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
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('approve')}>
            <CheckCircle className="mr-1.5 size-3.5" />
            Approve
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleBulkAction('remove')}>
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
            {filteredPosts.map((post) => (
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
                      <AvatarFallback className="text-[10px]">{post.author.charAt(0)}</AvatarFallback>
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
                  {post.flags > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                      <Flag className="size-3" />
                      {post.flags}
                    </span>
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
                      <DropdownMenuItem>
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
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredPosts.length} of {posts.length} posts
      </div>

      <AlertDialog
        open={actionDialog.type !== null}
        onOpenChange={() => { setActionDialog({ type: null, post: null }); setActionReason(''); setActionFiles([]); }}
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
                  {actionDialog.type === 'warn' && `Send a warning to ${actionDialog.post?.author} about their post?`}
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
                {(actionDialog.type === 'remove' || actionDialog.type === 'warn') && (
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
            <AlertDialogAction
              onClick={confirmAction}
              className={actionDialog.type === 'remove' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {actionDialog.type === 'approve' && 'Approve'}
              {actionDialog.type === 'remove' && 'Remove Post'}
              {actionDialog.type === 'warn' && 'Send Warning'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}