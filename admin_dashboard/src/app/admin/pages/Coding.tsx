import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Plus, Edit, Trash2, CheckCircle, X, ChevronRight,
  Code, Tag, Target, TrendingUp, BookOpen, AlertCircle
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Switch } from '../../components/ui/switch';
import { Separator } from '../../components/ui/separator';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { toast } from 'sonner';
import { mockProblems, mockAdminSubmissions, type Problem, type Example, type TestCase } from '../data/codingData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    hard: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize ${styles[difficulty] || ''}`}>
      {difficulty}
    </span>
  );
}

function SolveRateBar({ rate, solved, attempted }: { rate: number; solved: number; attempted: number }) {
  return (
    <div className="space-y-1 min-w-[100px]">
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            rate >= 60 ? 'bg-emerald-500' : rate >= 35 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] tabular-nums text-muted-foreground">{solved.toLocaleString()}/{attempted.toLocaleString()}</span>
        <span className="text-[10px] tabular-nums text-muted-foreground">{rate}%</span>
      </div>
    </div>
  );
}

// ─── Summary stats ────────────────────────────────────────────────────────────

function StatsBar({ problems }: { problems: Problem[] }) {
  const total = problems.length;
  const active = problems.filter(p => p.status === 'active').length;
  const easy = problems.filter(p => p.difficulty === 'easy').length;
  const medium = problems.filter(p => p.difficulty === 'medium').length;
  const hard = problems.filter(p => p.difficulty === 'hard').length;
  const avgSolveRate = total > 0
    ? Math.round(problems.reduce((s, p) => s + p.solveRate, 0) / total)
    : 0;

  return (
    <div className="grid grid-cols-5 gap-3">
      {[
        { label: 'Total Problems', value: total, icon: BookOpen, color: 'text-foreground' },
        { label: 'Active', value: active, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Easy', value: easy, icon: Target, color: 'text-emerald-500' },
        { label: 'Medium', value: medium, icon: Target, color: 'text-amber-500' },
        { label: 'Hard', value: hard, icon: Target, color: 'text-red-500' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
          <div className="rounded-md bg-muted/60 p-1.5">
            <Icon className={`size-4 ${color}`} />
          </div>
          <div>
            <p className="text-lg tabular-nums leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyProblem = {
  title: '',
  difficulty: 'easy' as const,
  category: '',
  tags: [] as string[],
  description: '',
  constraints: '',
  examples: [{ input: '', output: '', explanation: '' }] as Example[],
  testCases: [{ id: '1', input: '', expectedOutput: '', hidden: false }] as TestCase[],
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CodingPage() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [adminSubmissions, setAdminSubmissions] = useState(mockAdminSubmissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Problem | null>(null);
  const [editorTab, setEditorTab] = useState('details');
  const [form, setForm] = useState(emptyProblem);
  const [tagInput, setTagInput] = useState('');

  const filteredProblems = problems.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q));
    const matchesDifficulty = difficultyFilter === 'all' || p.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const openEditor = (problem?: Problem) => {
    if (problem) {
      setEditingProblem(problem);
      setForm({
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category,
        tags: [...problem.tags],
        description: problem.description,
        constraints: problem.constraints,
        examples: [...problem.examples],
        testCases: [...problem.testCases],
      });
    } else {
      setEditingProblem(null);
      setForm({ ...emptyProblem, examples: [{ input: '', output: '', explanation: '' }], testCases: [{ id: '1', input: '', expectedOutput: '', hidden: false }] });
    }
    setEditorTab('details');
    setEditorOpen(true);
  };

  const handleSave = (asDraft = false) => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (editingProblem) {
      setProblems(problems.map((p) => p.id === editingProblem.id ? {
        ...editingProblem, ...form, status: asDraft ? 'draft' : 'active',
      } : p));
      toast.success('Problem updated');
    } else {
      const newProblem: Problem = {
        id: String(Date.now()), ...form,
        solved: 0, attempted: 0, status: asDraft ? 'draft' : 'active',
        solveRate: 0, createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setProblems([...problems, newProblem]);
      toast.success(asDraft ? 'Problem saved as draft' : 'Problem published');
    }
    setEditorOpen(false);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) setForm({ ...form, tags: [...form.tags, tag] });
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });

  const pendingCount = adminSubmissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight">Coding Platform</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage problems, test cases, and review submissions
          </p>
        </div>
        <Button onClick={() => openEditor()} className="gap-1.5">
          <Plus className="size-4" />
          New Problem
        </Button>
      </div>

      <Tabs defaultValue="problems">
        <TabsList>
          <TabsTrigger value="problems" className="gap-1.5">
            <Code className="size-3.5" />
            Problems
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-1.5">
            Submissions
            {pendingCount > 0 && (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Problems ── */}
        <TabsContent value="problems" className="space-y-4">
          <StatsBar problems={problems} />

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search problems, tags, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || difficultyFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-1"
                onClick={() => { setSearchQuery(''); setDifficultyFilter('all'); setStatusFilter('all'); }}
              >
                <X className="size-3.5" /> Clear
              </Button>
            )}
          </div>

          {/* Problems Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Solve Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProblems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Code className="size-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No problems found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProblems.map((problem) => (
                    <TableRow
                      key={problem.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      onClick={() => navigate(`/admin/coding/${problem.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <DifficultyBadge difficulty={problem.difficulty} />
                          <span className="text-sm group-hover:text-primary transition-colors">{problem.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{problem.category}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {problem.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              <Tag className="size-2.5 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {problem.tags.length > 2 && (
                            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              +{problem.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <SolveRateBar rate={problem.solveRate} solved={problem.solved} attempted={problem.attempted} />
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                          problem.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'
                        }`}>
                          {problem.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => { e.stopPropagation(); openEditor(problem); }}
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); setDeleteDialog(problem); }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                          <ChevronRight className="size-4 text-muted-foreground/40" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Admin Submissions Review ── */}
        <TabsContent value="submissions" className="space-y-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="text-sm">{submission.user}</TableCell>
                    <TableCell className="text-sm">{submission.problem}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{submission.language}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                        submission.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                          : submission.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                      }`}>
                        {submission.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{submission.submittedAt}</TableCell>
                    <TableCell className="text-right">
                      {submission.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setAdminSubmissions(adminSubmissions.map((s) =>
                                s.id === submission.id ? { ...s, status: 'rejected' as const } : s
                              ));
                              toast.success('Submission rejected');
                            }}
                          >
                            <X className="size-3 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setAdminSubmissions(adminSubmissions.map((s) =>
                                s.id === submission.id ? { ...s, status: 'approved' as const } : s
                              ));
                              toast.success('Submission approved');
                            }}
                          >
                            <CheckCircle className="size-3 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Problem Editor Dialog ── */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle>{editingProblem ? 'Edit Problem' : 'Create New Problem'}</DialogTitle>
          </DialogHeader>

          <div className="border-b border-border px-6 shrink-0">
            <div className="flex gap-1 -mb-px">
              {[
                { id: 'details', label: 'Details' },
                { id: 'examples', label: `Examples (${form.examples.length})` },
                { id: 'testcases', label: `Test Cases (${form.testCases.length})` },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setEditorTab(id)}
                  className={`px-3 py-2.5 text-sm border-b-2 transition-colors ${
                    editorTab === id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-5">
              {editorTab === 'details' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Title <span className="text-red-500">*</span></Label>
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Two Sum" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Difficulty</Label>
                      <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category</Label>
                      <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Arrays, Trees" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tags</Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-500"><X className="size-3" /></button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add tag and press Enter..."
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Problem Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the problem..."
                      rows={5}
                    />
                  </div>

                  {/* Constraints */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Constraints</Label>
                    <Textarea
                      value={form.constraints}
                      onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                      placeholder="e.g. 2 <= nums.length <= 10^4"
                      rows={3}
                      className="font-mono text-xs"
                    />
                  </div>
                </>
              )}

              {editorTab === 'examples' && (
                <div className="space-y-4">
                  {form.examples.map((ex, i) => (
                    <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Example {i + 1}</span>
                        {form.examples.length > 1 && (
                          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-500"
                            onClick={() => setForm({ ...form, examples: form.examples.filter((_, idx) => idx !== i) })}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Input</Label>
                          <Textarea value={ex.input} onChange={(e) => {
                            const updated = [...form.examples]; updated[i] = { ...updated[i], input: e.target.value };
                            setForm({ ...form, examples: updated });
                          }} rows={2} className="font-mono text-xs" placeholder="Input value..." />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Output</Label>
                          <Textarea value={ex.output} onChange={(e) => {
                            const updated = [...form.examples]; updated[i] = { ...updated[i], output: e.target.value };
                            setForm({ ...form, examples: updated });
                          }} rows={2} className="font-mono text-xs" placeholder="Expected output..." />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Explanation (optional)</Label>
                        <Input value={ex.explanation} onChange={(e) => {
                          const updated = [...form.examples]; updated[i] = { ...updated[i], explanation: e.target.value };
                          setForm({ ...form, examples: updated });
                        }} placeholder="Brief explanation..." />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full gap-1.5"
                    onClick={() => setForm({ ...form, examples: [...form.examples, { input: '', output: '', explanation: '' }] })}>
                    <Plus className="size-3.5" /> Add Example
                  </Button>
                </div>
              )}

              {editorTab === 'testcases' && (
                <div className="space-y-3">
                  {form.testCases.map((tc, i) => (
                    <div key={tc.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Case {i + 1}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Hidden</span>
                            <Switch
                              checked={tc.hidden}
                              onCheckedChange={(checked) => {
                                const updated = [...form.testCases]; updated[i] = { ...updated[i], hidden: checked };
                                setForm({ ...form, testCases: updated });
                              }}
                              className="scale-75"
                            />
                          </div>
                          {form.testCases.length > 1 && (
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-500"
                              onClick={() => setForm({ ...form, testCases: form.testCases.filter((_, idx) => idx !== i) })}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Input</Label>
                          <Textarea value={tc.input} onChange={(e) => {
                            const updated = [...form.testCases]; updated[i] = { ...updated[i], input: e.target.value };
                            setForm({ ...form, testCases: updated });
                          }} rows={2} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Expected Output</Label>
                          <Textarea value={tc.expectedOutput} onChange={(e) => {
                            const updated = [...form.testCases]; updated[i] = { ...updated[i], expectedOutput: e.target.value };
                            setForm({ ...form, testCases: updated });
                          }} rows={2} className="font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full gap-1.5"
                    onClick={() => setForm({ ...form, testCases: [...form.testCases, { id: String(Date.now()), input: '', expectedOutput: '', hidden: false }] })}>
                    <Plus className="size-3.5" /> Add Test Case
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t border-border gap-2">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleSave(true)}>Save as Draft</Button>
            <Button onClick={() => handleSave(false)}>
              {editingProblem ? 'Update Problem' : 'Publish Problem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Problem</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog?.title}</strong>? All associated test cases and submissions will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setProblems(problems.filter((p) => p.id !== deleteDialog?.id));
                setDeleteDialog(null);
                toast.success('Problem deleted');
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
