import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Edit, Trash2, CheckCircle, X, ChevronRight,
  Code, Tag,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { apiClient } from '../../../lib/apiClient';

type Difficulty = 'easy' | 'medium' | 'hard';
type ProblemStatus = 'active' | 'draft';

type Problem = {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  solved: number;
  attempted: number;
  status: ProblemStatus;
  description: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation: string }>;
  testCases: Array<{ id: string; input: string; expectedOutput: string; hidden: boolean }>;
  createdAt: string;
  updatedAt: string;
  solveRate: number;
};

type Proposal = {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  createdBy?: {
    id: string;
    name?: string;
    username?: string;
  } | null;
};

type ProblemsResponse = {
  success?: boolean;
  data?: {
    problems?: Array<{
      id: string;
      title: string;
      difficulty: string;
      tags?: string[];
      status?: string;
      createdAt?: string;
      updatedAt?: string;
    }>;
  };
};

type ProposalsResponse = {
  success?: boolean;
  data?: {
    proposals?: Proposal[];
  };
};

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

function StatsBar({ problems }: { problems: Problem[] }) {
  const total = problems.length;
  const active = problems.filter((problem) => problem.status === 'active').length;
  const easy = problems.filter((problem) => problem.difficulty === 'easy').length;
  const medium = problems.filter((problem) => problem.difficulty === 'medium').length;
  const hard = problems.filter((problem) => problem.difficulty === 'hard').length;

  return (
    <div className="grid grid-cols-5 gap-3">
      {[
        { label: 'Total Problems', value: total },
        { label: 'Active', value: active },
        { label: 'Easy', value: easy },
        { label: 'Medium', value: medium },
        { label: 'Hard', value: hard },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-3">
          <p className="text-lg tabular-nums leading-none">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

const toProblemRow = (problem: any): Problem => {
  const attempted = Number(problem?.totalSubmissions || 0);
  const solved = Number(problem?.totalAccepted || 0);
  const solveRate = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;

  return {
    id: String(problem?.id || ''),
    title: String(problem?.title || 'Untitled problem'),
    difficulty: (String(problem?.difficulty || 'easy').toLowerCase() as Difficulty),
    category: Array.isArray(problem?.tags) ? String(problem.tags[0] || 'General') : 'General',
    tags: Array.isArray(problem?.tags) ? problem.tags : [],
    solved,
    attempted,
    status: String(problem?.status || 'active').toLowerCase() === 'approved' ? 'active' : 'active',
    description: '',
    constraints: '',
    examples: [],
    testCases: [],
    createdAt: String(problem?.createdAt || ''),
    updatedAt: String(problem?.updatedAt || ''),
    solveRate,
  };
};

export default function CodingPage() {
  const navigate = useNavigate();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState<Problem | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [problemsResponse, proposalsResponse] = await Promise.all([
        apiClient.get<ProblemsResponse>('/admin/coding/problems?limit=200'),
        apiClient.get<ProposalsResponse>('/coding/admin/problem-submissions?limit=200'),
      ]);

      const backendProblems = problemsResponse?.data?.problems;
      const problemRows = Array.isArray(backendProblems)
        ? backendProblems.map((problem) => toProblemRow(problem))
        : [];

      const backendProposals = proposalsResponse?.data?.proposals;
      const proposalRows = Array.isArray(backendProposals)
        ? backendProposals
        : [];

      setProblems(problemRows);
      setProposals(proposalRows);
    } catch (error) {
      toast.error('Failed to load coding data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        problem.title.toLowerCase().includes(q) ||
        problem.category.toLowerCase().includes(q) ||
        problem.tags.some((tag) => tag.includes(q));
      const matchesDifficulty = difficultyFilter === 'all' || problem.difficulty === difficultyFilter;
      const matchesStatus = statusFilter === 'all' || problem.status === statusFilter;
      return matchesSearch && matchesDifficulty && matchesStatus;
    });
  }, [problems, searchQuery, difficultyFilter, statusFilter]);

  const pendingCount = proposals.filter((proposal) => proposal.approvalStatus === 'pending').length;

  const handleDeleteProblem = async () => {
    if (!deleteDialog) return;

    setIsSubmitting(true);

    try {
      await apiClient.delete(`/admin/coding/problems/${deleteDialog.id}`);
      toast.success('Problem deleted');
      setDeleteDialog(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete problem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewProposal = async (proposalId: string, decision: 'approved' | 'rejected') => {
    setIsSubmitting(true);

    try {
      if (decision === 'approved') {
        await apiClient.patch(`/coding/admin/problem-submissions/${proposalId}/approve`, {
          notes: 'Approved by admin',
        });
      } else {
        await apiClient.patch(`/coding/admin/problem-submissions/${proposalId}/reject`, {
          reason: 'Rejected by admin review',
        });
      }

      toast.success(`Submission ${decision}`);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to review submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight">Coding Platform</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage problems and review community submissions
          </p>
        </div>
        <Button disabled className="gap-1.5">
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

        <TabsContent value="problems" className="space-y-4">
          <StatsBar problems={problems} />

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
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
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
                onClick={() => {
                  setSearchQuery('');
                  setDifficultyFilter('all');
                  setStatusFilter('all');
                }}
              >
                <X className="size-3.5" /> Clear
              </Button>
            )}
          </div>

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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">Loading problems...</TableCell>
                  </TableRow>
                ) : filteredProblems.length === 0 ? (
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
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          {problem.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/admin/coding/${problem.id}`);
                            }}
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-red-500"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteDialog(problem);
                            }}
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

        <TabsContent value="submissions" className="space-y-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">Loading submissions...</TableCell>
                  </TableRow>
                ) : proposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">No submissions found</TableCell>
                  </TableRow>
                ) : (
                  proposals.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="text-sm">{submission.createdBy?.name || submission.createdBy?.username || 'Unknown'}</TableCell>
                      <TableCell className="text-sm">{submission.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{submission.difficulty}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                          submission.approvalStatus === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                            : submission.approvalStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                        }`}>
                          {submission.approvalStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {submission.approvalStatus === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => reviewProposal(submission.id, 'rejected')}
                              disabled={isSubmitting}
                            >
                              <X className="size-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => reviewProposal(submission.id, 'approved')}
                              disabled={isSubmitting}
                            >
                              <CheckCircle className="size-3 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Problem</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteDialog?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProblem} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
