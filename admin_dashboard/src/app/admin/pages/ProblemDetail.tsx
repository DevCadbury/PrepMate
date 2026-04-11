import { mockProblems, mockUserSubmissions, mockSolvers, type UserSubmission, type SubmissionStatus } from '../data/codingData';
import { SubmissionDrawer } from '../components/coding/SubmissionDrawer';

// ─── Difficulty badge ─────────────────────────────────────────────────────────

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

// ─── Submission status display ────────────────────────────────────────────────

const statusConfig: Record<SubmissionStatus, { label: string; color: string; icon: React.ElementType }> = {
  accepted: { label: 'Accepted', color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
  wrong_answer: { label: 'Wrong Answer', color: 'text-red-500 dark:text-red-400', icon: XCircle },
  time_limit_exceeded: { label: 'TLE', color: 'text-amber-600 dark:text-amber-400', icon: Clock },
  runtime_error: { label: 'Runtime Error', color: 'text-orange-500 dark:text-orange-400', icon: AlertTriangle },
  compile_error: { label: 'Compile Error', color: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
};

function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${cfg.color}`}>
      <Icon className="size-3.5" />
      {cfg.label}
    </span>
  );
}

// ─── Mock analytics data ──────────────────────────────────────────────────────

const solveRateTrend = [
  { date: 'Jan', rate: 48, attempts: 120 },
  { date: 'Feb', rate: 52, attempts: 145 },
  { date: 'Mar', rate: 50, attempts: 162 },
  { date: 'Apr', rate: 55, attempts: 198 },
  { date: 'May', rate: 53, attempts: 210 },
  { date: 'Jun', rate: 58, attempts: 245 },
];

const languageData = [
  { lang: 'Python', count: 42, color: '#3b82f6' },
  { lang: 'JavaScript', count: 28, color: '#8b5cf6' },
  { lang: 'Java', count: 18, color: '#f59e0b' },
  { lang: 'TypeScript', count: 8, color: '#10b981' },
  { lang: 'C++', count: 4, color: '#ef4444' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSubmission, setSelectedSubmission] = useState<UserSubmission | null>(null);
  const [showHiddenCases, setShowHiddenCases] = useState(false);

  const problem = useMemo(() => mockProblems.find((p) => p.id === id), [id]);
  const submissions = useMemo(
    () => mockUserSubmissions.filter((s) => s.problemId === id),
    [id]
  );

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Target className="size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Problem not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/coding')}>
          <ArrowLeft className="size-3.5 mr-1.5" />
          Back to Coding
        </Button>
      </div>
    );
  }

  const acceptedCount = submissions.filter((s) => s.status === 'accepted').length;
  const solveRate = submissions.length > 0 ? Math.round((acceptedCount / submissions.length) * 100) : 0;
  const visibleTestCases = showHiddenCases ? problem.testCases : problem.testCases.filter((tc) => !tc.hidden);

  return (
    <div className="space-y-0 -m-6 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Back header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-background shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/admin/coding')}
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <DifficultyBadge difficulty={problem.difficulty} />
          <h1 className="text-base truncate">{problem.title}</h1>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
            problem.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'
          }`}>
            {problem.status}
          </span>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
          <Edit className="size-3.5" />
          Edit Problem
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left stats sidebar */}
        <div className="w-56 shrink-0 border-r border-border overflow-y-auto p-4 space-y-4">
          {/* Stats */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Statistics</p>
            {[
              { label: 'Solved', value: problem.solved.toLocaleString(), icon: CheckCircle, color: 'text-emerald-500' },
              { label: 'Attempted', value: problem.attempted.toLocaleString(), icon: Target, color: 'text-sky-500' },
              { label: 'Solve Rate', value: `${problem.solveRate}%`, icon: TrendingUp, color: 'text-violet-500' },
              { label: 'Test Cases', value: problem.testCases.length, icon: Code, color: 'text-amber-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between rounded-md bg-muted/30 border border-border px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <Icon className={`size-3.5 ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <span className="text-xs tabular-nums">{value}</span>
              </div>
            ))}
          </div>

          {/* Solve rate bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Solve Rate</span>
              <span className="text-[11px] tabular-nums">{problem.solveRate}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${problem.solveRate}%` }}
              />
            </div>
          </div>

          <Separator />

          {/* Meta */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Meta</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Code className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{problem.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{problem.updatedAt}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {problem.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  <Tag className="size-2.5 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b border-border px-6 shrink-0">
              <TabsList className="h-10 bg-transparent p-0 gap-0 -mb-px">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'testcases', label: `Test Cases (${problem.testCases.length})` },
                  { id: 'submissions', label: `Submissions (${submissions.length})` },
                  { id: 'solvers', label: `Solvers (${mockSolvers.length})` },
                  { id: 'analytics', label: 'Analytics' },
                ].map(({ id: tabId, label }) => (
                  <button
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
                      activeTab === tabId
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </TabsList>
            </div>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-6 max-w-3xl space-y-6">
                  {/* Description */}
                  <div className="space-y-3">
                    <h2 className="text-sm text-muted-foreground uppercase tracking-wider">Problem Statement</h2>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {problem.description}
                    </div>
                  </div>

                  <Separator />

                  {/* Examples */}
                  {problem.examples.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm text-muted-foreground uppercase tracking-wider">Examples</h2>
                      {problem.examples.map((ex, i) => (
                        <div key={i} className="rounded-lg border border-border overflow-hidden">
                          <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
                            <span className="text-xs text-muted-foreground">Example {i + 1}</span>
                          </div>
                          <div className="p-3 space-y-2 text-sm">
                            <div>
                              <span className="text-xs text-muted-foreground mr-2">Input:</span>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{ex.input}</code>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground mr-2">Output:</span>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{ex.output}</code>
                            </div>
                            {ex.explanation && (
                              <div>
                                <span className="text-xs text-muted-foreground mr-2">Explanation:</span>
                                <span className="text-xs">{ex.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Constraints */}
                  <div className="space-y-3">
                    <h2 className="text-sm text-muted-foreground uppercase tracking-wider">Constraints</h2>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-border p-3">
                      <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{problem.constraints}</pre>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Test Cases ── */}
            <TabsContent value="testcases" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{problem.testCases.length} test cases total</span>
                      <span className="text-xs text-muted-foreground">
                        ({problem.testCases.filter((tc) => tc.hidden).length} hidden)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Show hidden</span>
                      <Switch checked={showHiddenCases} onCheckedChange={setShowHiddenCases} className="scale-75" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {visibleTestCases.map((tc, idx) => (
                      <div key={tc.id} className="rounded-lg border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Case {idx + 1}</span>
                            {tc.hidden && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                <EyeOff className="size-2.5" /> Hidden
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-border text-xs">
                          <div className="p-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Input</p>
                            <code className="font-mono text-foreground/80 whitespace-pre-wrap break-all">{tc.input}</code>
                          </div>
                          <div className="p-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Expected Output</p>
                            <code className="font-mono text-foreground/80 break-all">{tc.expectedOutput}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => toast.info('Test case editor coming soon')}>
                    <Plus className="size-3.5" />
                    Add Test Case
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Submissions ── */}
            <TabsContent value="submissions" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  {/* Summary row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Total', value: submissions.length, color: 'text-foreground' },
                      { label: 'Accepted', value: submissions.filter(s => s.status === 'accepted').length, color: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'Failed', value: submissions.filter(s => s.status !== 'accepted').length, color: 'text-red-500 dark:text-red-400' },
                      { label: 'Accept Rate', value: `${solveRate}%`, color: 'text-primary' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                        <p className={`text-lg tabular-nums ${color}`}>{value}</p>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>

                  {submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Code className="size-8 text-muted-foreground/20 mb-3" />
                      <p className="text-sm text-muted-foreground">No submissions yet</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Runtime</TableHead>
                            <TableHead>Memory</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.map((sub) => (
                            <TableRow
                              key={sub.id}
                              className="cursor-pointer hover:bg-muted/30 transition-colors"
                              onClick={() => setSelectedSubmission(sub)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-6">
                                    <AvatarFallback className={`text-[10px] text-white ${sub.user.color}`}>
                                      {sub.user.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs">{sub.user.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{sub.user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{sub.language}</Badge>
                              </TableCell>
                              <TableCell>
                                <SubmissionStatusBadge status={sub.status} />
                              </TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">{sub.runtime}</TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">{sub.memory}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{sub.submittedAt}</TableCell>
                              <TableCell>
                                <ChevronRight className="size-3.5 text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Solvers ── */}
            <TabsContent value="solvers" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-amber-500" />
                    <span className="text-sm">{mockSolvers.length} users solved this problem</span>
                  </div>

                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Time to Solve</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Best Runtime</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Solved At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockSolvers.map((solver, idx) => (
                          <TableRow key={solver.user.email}>
                            <TableCell>
                              <span className={`text-xs tabular-nums ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700 dark:text-amber-600' : 'text-muted-foreground'}`}>
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="size-7">
                                  <AvatarFallback className={`text-[10px] text-white ${solver.user.color}`}>
                                    {solver.user.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs">{solver.user.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{solver.user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{solver.timeTaken}</TableCell>
                            <TableCell>
                              <span className={`text-xs tabular-nums ${solver.attempts === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                {solver.attempts}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{solver.bestRuntime}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{solver.bestLanguage}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{solver.solvedAt}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Analytics ── */}
            <TabsContent value="analytics" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Solve Rate', value: `${problem.solveRate}%`, desc: 'vs 45% avg', icon: TrendingUp, positive: problem.solveRate > 45 },
                      { label: 'Total Solvers', value: mockSolvers.length, desc: 'unique users', icon: Users },
                      { label: 'Avg Attempts', value: '2.4', desc: 'per solver', icon: Target },
                      { label: 'Best Runtime', value: '44ms', desc: 'Python', icon: Clock },
                    ].map(({ label, value, desc, icon: Icon, positive }) => (
                      <div key={label} className="rounded-lg border border-border bg-card p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <Icon className="size-4 text-muted-foreground/50" />
                        </div>
                        <p className="text-2xl tabular-nums">{value}</p>
                        <p className={`text-[11px] ${positive === false ? 'text-red-500' : positive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Solve rate over time */}
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="size-4 text-muted-foreground" />
                      <span className="text-sm">Solve Rate Trend</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={solveRateTrend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                        <defs>
                          <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} domain={[30, 70]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                          formatter={(value) => [`${value}%`, 'Solve Rate']}
                        />
                        <Area type="monotone" dataKey="rate" stroke="#0284c7" strokeWidth={1.5} fill="url(#rateGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Language distribution */}
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Code className="size-4 text-muted-foreground" />
                      <span className="text-sm">Language Distribution</span>
                    </div>
                    <div className="flex items-end gap-4">
                      <ResponsiveContainer width="60%" height={160}>
                        <BarChart data={languageData} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                          <XAxis dataKey="lang" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                          />
                          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                            {languageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.7} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {languageData.map((lang) => (
                          <div key={lang.lang} className="flex items-center gap-2">
                            <div className="size-2 rounded-full" style={{ background: lang.color }} />
                            <span className="text-xs text-muted-foreground flex-1">{lang.lang}</span>
                            <span className="text-xs tabular-nums">{lang.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Submission drawer */}
      {selectedSubmission && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setSelectedSubmission(null)}
          />
          <SubmissionDrawer
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        </>
      )}
    </div>
  );
}