import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  Flame,
  Heart,
  ListChecks,
  Loader2,
  MessageSquare,
  Play,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";

import { apiClient } from "../../../lib/apiClient";
import { cn } from "../../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Separator } from "../../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Textarea } from "../../ui/textarea";

type Difficulty = "Easy" | "Medium" | "Hard";
type ProblemStatus = "Unseen" | "Attempted" | "Solved";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface CodingProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  acceptanceRate: number;
  status: ProblemStatus;
  totalSubmissions: number;
  totalAccepted: number;
  updatedAt?: string;
}

interface CodingTestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

interface CodingProblemDetail extends CodingProblemSummary {
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  sampleTestCases: CodingTestCase[];
  publicTestCases: CodingTestCase[];
  hiddenTestCasesCount: number;
  starterCode: Record<string, string>;
  editorial: {
    content: string;
    codeExamples: Record<string, string>;
  };
}

interface ExecutionResult {
  status: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  runtimeMs: number;
  memoryKb: number;
}

interface SubmissionTestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: string;
  isHidden: boolean;
  runtimeMs: number;
  memoryKb: number;
}

interface CodingSubmission {
  id: string;
  problemId: string;
  problemTitle?: string;
  status: string;
  mode: "run" | "submit";
  language: string;
  runtimeMs: number;
  memoryKb: number;
  passedTestCases: number;
  totalTestCases: number;
  createdAt?: string;
  updatedAt?: string;
  code?: string;
  testResults: SubmissionTestResult[];
}

interface DiscussionUser {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  profilePicture?: string;
}

interface DiscussionReply {
  id: string;
  user: DiscussionUser;
  content: string;
  createdAt?: string;
}

interface CodingDiscussion {
  id: string;
  content: string;
  user: DiscussionUser;
  likes: string[];
  likeCount: number;
  replies: DiscussionReply[];
  createdAt?: string;
  updatedAt?: string;
}

interface CodingProgress {
  solvedProblems: number;
  attemptedProblems: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  accuracy: number;
  streak: number;
  difficultyBreakdown: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  heatmap: Array<{
    date: string;
    count: number;
  }>;
}

interface CodingLanguage {
  id: string;
  label: string;
}

interface CodingContest {
  id: string;
  title: string;
  startsAt?: string;
  durationMinutes?: number;
}

interface CodingProposal {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  approvalStatus: "pending" | "approved" | "rejected";
  approvalNotes?: string;
  isPublished: boolean;
  submittedAt?: string;
  updatedAt?: string;
}

interface ProblemProposalForm {
  title: string;
  difficulty: Difficulty;
  tags: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  sampleExplanation: string;
  publicCasesJson: string;
  hiddenCasesJson: string;
  starterJavascript: string;
  starterPython: string;
  starterJava: string;
  starterCpp: string;
  starterC: string;
  editorialContent: string;
}

interface Notice {
  type: "success" | "error" | "info";
  message: string;
}

const FALLBACK_LANGUAGES: CodingLanguage[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
];

const DEFAULT_LANGUAGE = "javascript";

const DEFAULT_PROPOSAL_FORM: ProblemProposalForm = {
  title: "",
  difficulty: "Easy",
  tags: "",
  description: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  sampleInput: "",
  sampleOutput: "",
  sampleExplanation: "",
  publicCasesJson: "",
  hiddenCasesJson: "",
  starterJavascript: "",
  starterPython: "",
  starterJava: "",
  starterCpp: "",
  starterC: "",
  editorialContent: "",
};

const difficultyBadgeClass: Record<Difficulty, string> = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusBadgeClass: Record<ProblemStatus, string> = {
  Solved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Attempted: "bg-amber-50 text-amber-700 border-amber-200",
  Unseen: "bg-slate-50 text-slate-700 border-slate-200",
};

const submissionStatusClass = (status: string) => {
  if (status === "Accepted") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "Wrong Answer") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-rose-50 text-rose-700 border-rose-200";
};

const heatmapClass = (count: number) => {
  if (count <= 0) return "bg-slate-100";
  if (count === 1) return "bg-emerald-200";
  if (count === 2) return "bg-emerald-300";
  if (count === 3) return "bg-emerald-400";
  return "bg-emerald-600";
};

const makeDraftKey = (problemId: string, language: string) =>
  `${problemId}::${language}`;

const formatDateTime = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

const getUserInitials = (user?: DiscussionUser) => {
  const value = user?.name || user?.username || "U";
  return value.charAt(0).toUpperCase();
};

const getProfilePath = (user?: DiscussionUser) => {
  if (user?.username) {
    return `/profile/${user.username}`;
  }

  return "/profile";
};

const parseTestCasesJson = (rawValue: string, label: string): CodingTestCase[] => {
  const raw = String(rawValue || "").trim();
  if (!raw) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${label} must be a valid JSON array`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array`);
  }

  return parsed
    .map((item) => ({
      input: String((item as CodingTestCase)?.input || ""),
      expectedOutput: String((item as CodingTestCase)?.expectedOutput || ""),
      explanation: (item as CodingTestCase)?.explanation
        ? String((item as CodingTestCase).explanation)
        : undefined,
    }))
    .filter((item) => item.input || item.expectedOutput);
};

const proposalStatusClass: Record<CodingProposal["approvalStatus"], string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-700",
  approved: "bg-emerald-50 border-emerald-200 text-emerald-700",
  rejected: "bg-rose-50 border-rose-200 text-rose-700",
};

const CodingPage: React.FC<{ user: any }> = ({ user }) => {
  const currentUserId = String(user?._id || user?.id || "");
  const isAdminUser = String(user?.role || "").toLowerCase() === "admin";

  const [problems, setProblems] = useState<CodingProblemSummary[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblemDetail | null>(
    null
  );
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [discussions, setDiscussions] = useState<CodingDiscussion[]>([]);
  const [progress, setProgress] = useState<CodingProgress | null>(null);
  const [contests, setContests] = useState<CodingContest[]>([]);
  const [languages, setLanguages] = useState<CodingLanguage[]>(FALLBACK_LANGUAGES);

  const [searchText, setSearchText] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const [workspaceTab, setWorkspaceTab] = useState("description");
  const [editorLanguage, setEditorLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [draftByProblemLanguage, setDraftByProblemLanguage] = useState<
    Record<string, string>
  >({});

  const [runResult, setRunResult] = useState<ExecutionResult | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<CodingSubmission | null>(
    null
  );

  const [discussionDraft, setDiscussionDraft] = useState("");
  const [replyDraftByDiscussion, setReplyDraftByDiscussion] = useState<
    Record<string, string>
  >({});

  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostingDiscussion, setIsPostingDiscussion] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isProposalPanelOpen, setIsProposalPanelOpen] = useState(false);
  const [proposalForm, setProposalForm] =
    useState<ProblemProposalForm>(DEFAULT_PROPOSAL_FORM);
  const [myProposals, setMyProposals] = useState<CodingProposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const selectedProblemIdentifier = useMemo(() => {
    if (!selectedProblemId) return null;
    const summary = problems.find((item) => item.id === selectedProblemId);
    return summary?.slug || selectedProblemId;
  }, [problems, selectedProblemId]);

  const tags = useMemo(() => {
    const allTags = problems.flatMap((problem) => problem.tags || []);
    return Array.from(new Set(allTags)).sort((a, b) => a.localeCompare(b));
  }, [problems]);

  const filteredProblems = useMemo(() => {
    if (statusFilter === "all") {
      return problems;
    }

    return problems.filter((problem) => problem.status === statusFilter);
  }, [problems, statusFilter]);

  const acceptedRate = useMemo(() => {
    if (!progress || progress.totalSubmissions <= 0) {
      return 0;
    }

    return Number(progress.accuracy.toFixed(2));
  }, [progress]);

  const persistCurrentDraft = useCallback(() => {
    if (!selectedProblem) return;

    const key = makeDraftKey(selectedProblem.id, editorLanguage);
    setDraftByProblemLanguage((prev) => ({
      ...prev,
      [key]: code,
    }));
  }, [code, editorLanguage, selectedProblem]);

  const fetchLanguages = useCallback(async () => {
    try {
      const response = await apiClient.get<
        ApiResponse<{ languages: CodingLanguage[] }>
      >("/coding/languages");

      if (response?.data?.languages?.length) {
        setLanguages(response.data.languages);
      }
    } catch {
      setLanguages(FALLBACK_LANGUAGES);
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<{ progress: CodingProgress }>>(
        "/coding/progress/me"
      );
      setProgress(response.data.progress);
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    }
  }, []);

  const fetchContests = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<{ contests: CodingContest[] }>>(
        "/coding/contests"
      );
      setContests(response.data.contests || []);
    } catch {
      setContests([]);
    }
  }, []);

  const fetchMyProposals = useCallback(async () => {
    setIsLoadingProposals(true);

    try {
      const response = await apiClient.get<ApiResponse<{ proposals: CodingProposal[] }>>(
        "/coding/problems/proposals/me?limit=20"
      );
      setMyProposals(response.data.proposals || []);
    } catch {
      setMyProposals([]);
    } finally {
      setIsLoadingProposals(false);
    }
  }, []);

  const fetchProblems = useCallback(async () => {
    setIsLoadingProblems(true);

    try {
      const params = new URLSearchParams();
      if (searchText.trim()) params.set("search", searchText.trim());
      if (difficultyFilter !== "all") params.set("difficulty", difficultyFilter);
      if (tagFilter !== "all") params.set("tags", tagFilter);

      const query = params.toString();
      const response = await apiClient.get<
        ApiResponse<{ problems: CodingProblemSummary[] }>
      >(`/coding/problems${query ? `?${query}` : ""}`);

      setProblems(response.data.problems || []);
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
      setProblems([]);
    } finally {
      setIsLoadingProblems(false);
    }
  }, [difficultyFilter, searchText, tagFilter]);

  const fetchWorkspace = useCallback(
    async (problemId: string) => {
      const summary = problems.find((item) => item.id === problemId);
      const identifier = summary?.slug || problemId;

      setIsLoadingWorkspace(true);

      try {
        const [problemResponse, submissionsResponse, discussionsResponse] =
          await Promise.all([
            apiClient.get<ApiResponse<{ problem: CodingProblemDetail }>>(
              `/coding/problems/${identifier}`
            ),
            apiClient.get<ApiResponse<{ submissions: CodingSubmission[] }>>(
              `/coding/problems/${identifier}/submissions?limit=20`
            ),
            apiClient.get<ApiResponse<{ discussions: CodingDiscussion[] }>>(
              `/coding/problems/${identifier}/discussions`
            ),
          ]);

        const problem = problemResponse.data.problem;
        setSelectedProblem(problem);
        setSubmissions(submissionsResponse.data.submissions || []);
        setDiscussions(discussionsResponse.data.discussions || []);
      } catch (error) {
        setNotice({
          type: "error",
          message: getErrorMessage(error),
        });
      } finally {
        setIsLoadingWorkspace(false);
      }
    },
    [problems]
  );

  const refreshProblemSubmissions = useCallback(async () => {
    if (!selectedProblemIdentifier) return;

    try {
      const response = await apiClient.get<ApiResponse<{ submissions: CodingSubmission[] }>>(
        `/coding/problems/${selectedProblemIdentifier}/submissions?limit=20`
      );
      setSubmissions(response.data.submissions || []);
    } catch {
      // Keep existing UI state if this refresh fails.
    }
  }, [selectedProblemIdentifier]);

  const refreshProblemDetail = useCallback(async () => {
    if (!selectedProblemIdentifier) return;

    try {
      const response = await apiClient.get<ApiResponse<{ problem: CodingProblemDetail }>>(
        `/coding/problems/${selectedProblemIdentifier}`
      );
      setSelectedProblem(response.data.problem);
    } catch {
      // Keep existing UI state if this refresh fails.
    }
  }, [selectedProblemIdentifier]);

  useEffect(() => {
    void fetchLanguages();
    void fetchProgress();
    void fetchContests();
    void fetchMyProposals();
  }, [fetchContests, fetchLanguages, fetchMyProposals, fetchProgress]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchProblems();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [fetchProblems]);

  useEffect(() => {
    if (!filteredProblems.length) {
      setSelectedProblemId(null);
      setSelectedProblem(null);
      setSubmissions([]);
      setDiscussions([]);
      return;
    }

    const exists = filteredProblems.some((problem) => problem.id === selectedProblemId);
    if (!selectedProblemId || !exists) {
      setSelectedProblemId(filteredProblems[0].id);
    }
  }, [filteredProblems, selectedProblemId]);

  useEffect(() => {
    if (!selectedProblemId) return;
    void fetchWorkspace(selectedProblemId);
  }, [fetchWorkspace, selectedProblemId]);

  useEffect(() => {
    if (!selectedProblem) return;

    const starterCode = selectedProblem.starterCode || {};
    const languagesForProblem = Object.keys(starterCode);
    const nextLanguage = languagesForProblem.includes(editorLanguage)
      ? editorLanguage
      : languagesForProblem[0] || DEFAULT_LANGUAGE;

    const draftKey = makeDraftKey(selectedProblem.id, nextLanguage);
    const draft = draftByProblemLanguage[draftKey];
    const starter =
      starterCode[nextLanguage] || starterCode[DEFAULT_LANGUAGE] || "";

    setEditorLanguage(nextLanguage);
    setCode(typeof draft === "string" ? draft : starter);
    setCustomInput("");
    setRunResult(null);
    setLatestSubmission(null);
    setWorkspaceTab("description");
    // We intentionally reset only when the selected problem changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProblem?.id]);

  const handleLanguageChange = (nextLanguage: string) => {
    if (!selectedProblem || nextLanguage === editorLanguage) {
      return;
    }

    const currentKey = makeDraftKey(selectedProblem.id, editorLanguage);
    const nextKey = makeDraftKey(selectedProblem.id, nextLanguage);
    const updatedDrafts = {
      ...draftByProblemLanguage,
      [currentKey]: code,
    };

    const starter =
      selectedProblem.starterCode[nextLanguage] ||
      selectedProblem.starterCode[DEFAULT_LANGUAGE] ||
      "";

    setDraftByProblemLanguage(updatedDrafts);
    setEditorLanguage(nextLanguage);
    setCode(updatedDrafts[nextKey] ?? starter);
  };

  const handleSelectProblem = (problemId: string) => {
    if (problemId === selectedProblemId) {
      return;
    }

    persistCurrentDraft();
    setSelectedProblemId(problemId);
  };

  const handleRunCode = async () => {
    if (!selectedProblemIdentifier) return;

    if (!code.trim()) {
      setNotice({ type: "error", message: "Write code before running." });
      return;
    }

    setIsRunning(true);
    setNotice(null);

    try {
      persistCurrentDraft();

      const response = await apiClient.post<ApiResponse<{ result: ExecutionResult }>>(
        `/coding/problems/${selectedProblemIdentifier}/run`,
        {
          code,
          language: editorLanguage,
          customInput,
        }
      );

      setRunResult(response.data.result);
      setLatestSubmission(null);
      setNotice({
        type: "success",
        message: "Run completed. Check the output panel.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!selectedProblemIdentifier) return;

    if (!code.trim()) {
      setNotice({ type: "error", message: "Write code before submitting." });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      persistCurrentDraft();

      const response = await apiClient.post<
        ApiResponse<{ submission: CodingSubmission }>
      >(`/coding/problems/${selectedProblemIdentifier}/submit`, {
        code,
        language: editorLanguage,
      });

      const submission = response.data.submission;
      setLatestSubmission(submission);
      setRunResult(null);

      await Promise.all([
        refreshProblemSubmissions(),
        fetchProgress(),
        fetchProblems(),
        refreshProblemDetail(),
      ]);

      setNotice({
        type: submission.status === "Accepted" ? "success" : "info",
        message:
          submission.status === "Accepted"
            ? "Accepted. Great work!"
            : `Submitted with status: ${submission.status}`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostDiscussion = async () => {
    if (!selectedProblemIdentifier) return;

    const content = discussionDraft.trim();
    if (!content) return;

    setIsPostingDiscussion(true);

    try {
      const response = await apiClient.post<
        ApiResponse<{ discussion: CodingDiscussion }>
      >(`/coding/problems/${selectedProblemIdentifier}/discussions`, {
        content,
      });

      setDiscussions((prev) => [response.data.discussion, ...prev]);
      setDiscussionDraft("");
      setNotice({ type: "success", message: "Discussion posted." });
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsPostingDiscussion(false);
    }
  };

  const handleToggleLike = async (discussionId: string) => {
    try {
      const response = await apiClient.post<
        ApiResponse<{ isLiked: boolean; likeCount: number }>
      >(`/coding/discussions/${discussionId}/like`);

      setDiscussions((prev) =>
        prev.map((item) => {
          if (item.id !== discussionId) return item;

          const likes = response.data.isLiked
            ? Array.from(new Set([...(item.likes || []), currentUserId]))
            : (item.likes || []).filter((entry) => entry !== currentUserId);

          return {
            ...item,
            likes,
            likeCount: response.data.likeCount,
          };
        })
      );
    } catch {
      setNotice({ type: "error", message: "Could not update like right now." });
    }
  };

  const handleReply = async (discussionId: string) => {
    const content = (replyDraftByDiscussion[discussionId] || "").trim();
    if (!content) return;

    try {
      const response = await apiClient.post<ApiResponse<{ reply: DiscussionReply }>>(
        `/coding/discussions/${discussionId}/replies`,
        { content }
      );

      setDiscussions((prev) =>
        prev.map((item) =>
          item.id === discussionId
            ? {
                ...item,
                replies: [...item.replies, response.data.reply],
              }
            : item
        )
      );

      setReplyDraftByDiscussion((prev) => ({
        ...prev,
        [discussionId]: "",
      }));
    } catch {
      setNotice({ type: "error", message: "Could not post reply right now." });
    }
  };

  const handleSubmitProblemProposal = async () => {
    const title = proposalForm.title.trim();
    const description = proposalForm.description.trim();

    if (!title || !description) {
      setNotice({
        type: "error",
        message: "Proposal title and description are required.",
      });
      return;
    }

    const sampleInput = proposalForm.sampleInput;
    const sampleOutput = proposalForm.sampleOutput;

    if (!sampleInput.trim() || !sampleOutput.trim()) {
      setNotice({
        type: "error",
        message: "At least one sample test case (input/output) is required.",
      });
      return;
    }

    let publicTestCases: CodingTestCase[] = [];
    let hiddenTestCases: CodingTestCase[] = [];

    try {
      publicTestCases = parseTestCasesJson(
        proposalForm.publicCasesJson,
        "Public test cases"
      );
      hiddenTestCases = parseTestCasesJson(
        proposalForm.hiddenCasesJson,
        "Hidden test cases"
      );
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
      return;
    }

    if (hiddenTestCases.length === 0) {
      setNotice({
        type: "error",
        message: "At least one hidden test case is required.",
      });
      return;
    }

    const starterCode: Record<string, string> = {
      javascript: proposalForm.starterJavascript.trim(),
      python: proposalForm.starterPython.trim(),
      java: proposalForm.starterJava.trim(),
      cpp: proposalForm.starterCpp.trim(),
      c: proposalForm.starterC.trim(),
    };

    const filteredStarterCode = Object.fromEntries(
      Object.entries(starterCode).filter(([, value]) => Boolean(value))
    );

    if (Object.keys(filteredStarterCode).length === 0) {
      setNotice({
        type: "error",
        message: "Provide starter code in at least one language.",
      });
      return;
    }

    setIsSubmittingProposal(true);

    try {
      const payload = {
        title,
        difficulty: proposalForm.difficulty,
        tags: proposalForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        description,
        inputFormat: proposalForm.inputFormat,
        outputFormat: proposalForm.outputFormat,
        constraints: proposalForm.constraints
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        sampleTestCases: [
          {
            input: proposalForm.sampleInput,
            expectedOutput: proposalForm.sampleOutput,
            explanation: proposalForm.sampleExplanation.trim() || undefined,
          },
        ],
        publicTestCases,
        hiddenTestCases,
        starterCode: filteredStarterCode,
        editorialContent: proposalForm.editorialContent,
      };

      const response = await apiClient.post<ApiResponse<{ proposal: CodingProposal }>>(
        "/coding/problems/proposals",
        payload
      );

      setProposalForm(DEFAULT_PROPOSAL_FORM);
      setIsProposalPanelOpen(false);

      await Promise.all([fetchMyProposals(), fetchProblems()]);

      setNotice({
        type: "success",
        message:
          response.message ||
          (isAdminUser
            ? "Problem created and published."
            : "Problem submitted for admin review."),
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Coding Arena
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Practice with real test cases, run code instantly, submit against hidden
              checks, and track growth with a modern interview-style workspace.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge className="border-sky-200 bg-sky-100 text-sky-700">
                <Brain className="mr-1.5 h-3.5 w-3.5" />
                Problem Bank
              </Badge>
              <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
                <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                Progress Tracking
              </Badge>
              <Badge className="border-amber-200 bg-amber-100 text-amber-700">
                <Trophy className="mr-1.5 h-3.5 w-3.5" />
                Contest Ready
              </Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/70 p-3 backdrop-blur-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Last 12 Weeks
            </p>
            <div className="grid grid-cols-14 gap-1">
              {(progress?.heatmap || []).slice(-84).map((entry) => (
                <div
                  key={entry.date}
                  className={cn(
                    "h-2.5 w-2.5 rounded-[3px]",
                    heatmapClass(entry.count)
                  )}
                  title={`${entry.date}: ${entry.count} accepted`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 bg-white/80 shadow-none">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Solved
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {progress?.solvedProblems || 0}
                </p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/80 shadow-none">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Attempted
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {progress?.attemptedProblems || 0}
                </p>
              </div>
              <Target className="h-6 w-6 text-sky-600" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/80 shadow-none">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Accuracy
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {acceptedRate}%
                </p>
              </div>
              <Activity className="h-6 w-6 text-indigo-600" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/80 shadow-none">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Streak
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {progress?.streak || 0} days
                </p>
              </div>
              <Flame className="h-6 w-6 text-orange-500" />
            </CardContent>
          </Card>
        </div>

        {(contests || []).length === 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-700">
            No active contests yet. Contest endpoints are wired, so you can add
            schedules and leaderboards without changing this page structure.
          </div>
        ) : null}
      </section>

      {notice ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            notice.type === "success" &&
              "border-emerald-200 bg-emerald-50 text-emerald-700",
            notice.type === "error" && "border-rose-200 bg-rose-50 text-rose-700",
            notice.type === "info" && "border-sky-200 bg-sky-50 text-sky-700"
          )}
        >
          {notice.message}
        </div>
      ) : null}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Contribute a Coding Question
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Any user can submit a problem. Admin approvals are required before
                public publication.
              </p>
            </div>
            <Button
              variant={isProposalPanelOpen ? "outline" : "default"}
              className={cn(
                isProposalPanelOpen && "border-slate-300 bg-white text-slate-700"
              )}
              onClick={() => setIsProposalPanelOpen((prev) => !prev)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {isProposalPanelOpen ? "Close Form" : "New Problem Proposal"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isProposalPanelOpen ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={proposalForm.title}
                  onChange={(event) =>
                    setProposalForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Problem title"
                  className="border-slate-200"
                />
                <Select
                  value={proposalForm.difficulty}
                  onValueChange={(value) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      difficulty: value as Difficulty,
                    }))
                  }
                >
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                value={proposalForm.tags}
                onChange={(event) =>
                  setProposalForm((prev) => ({ ...prev, tags: event.target.value }))
                }
                placeholder="Tags (comma separated, e.g. Array, Hash Table)"
                className="border-slate-200"
              />

              <Textarea
                value={proposalForm.description}
                onChange={(event) =>
                  setProposalForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Describe the problem statement"
                className="min-h-[120px] border-slate-200"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <Textarea
                  value={proposalForm.inputFormat}
                  onChange={(event) =>
                    setProposalForm((prev) => ({ ...prev, inputFormat: event.target.value }))
                  }
                  placeholder="Input format"
                  className="min-h-[90px] border-slate-200"
                />
                <Textarea
                  value={proposalForm.outputFormat}
                  onChange={(event) =>
                    setProposalForm((prev) => ({ ...prev, outputFormat: event.target.value }))
                  }
                  placeholder="Output format"
                  className="min-h-[90px] border-slate-200"
                />
              </div>

              <Textarea
                value={proposalForm.constraints}
                onChange={(event) =>
                  setProposalForm((prev) => ({ ...prev, constraints: event.target.value }))
                }
                placeholder="Constraints (one per line)"
                className="min-h-[90px] border-slate-200"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <Textarea
                  value={proposalForm.sampleInput}
                  onChange={(event) =>
                    setProposalForm((prev) => ({ ...prev, sampleInput: event.target.value }))
                  }
                  placeholder="Sample input"
                  className="min-h-[80px] border-slate-200"
                />
                <Textarea
                  value={proposalForm.sampleOutput}
                  onChange={(event) =>
                    setProposalForm((prev) => ({ ...prev, sampleOutput: event.target.value }))
                  }
                  placeholder="Sample output"
                  className="min-h-[80px] border-slate-200"
                />
              </div>

              <Textarea
                value={proposalForm.sampleExplanation}
                onChange={(event) =>
                  setProposalForm((prev) => ({
                    ...prev,
                    sampleExplanation: event.target.value,
                  }))
                }
                placeholder="Sample explanation (optional)"
                className="min-h-[70px] border-slate-200"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <Textarea
                  value={proposalForm.publicCasesJson}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      publicCasesJson: event.target.value,
                    }))
                  }
                  placeholder='Public tests JSON: [{"input":"...","expectedOutput":"..."}]'
                  className="min-h-[110px] border-slate-200 font-mono text-xs"
                />
                <Textarea
                  value={proposalForm.hiddenCasesJson}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      hiddenCasesJson: event.target.value,
                    }))
                  }
                  placeholder='Hidden tests JSON: [{"input":"...","expectedOutput":"..."}]'
                  className="min-h-[110px] border-slate-200 font-mono text-xs"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Textarea
                  value={proposalForm.starterJavascript}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      starterJavascript: event.target.value,
                    }))
                  }
                  placeholder="Starter code: JavaScript"
                  className="min-h-[100px] border-slate-200 font-mono text-xs"
                />
                <Textarea
                  value={proposalForm.starterPython}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      starterPython: event.target.value,
                    }))
                  }
                  placeholder="Starter code: Python"
                  className="min-h-[100px] border-slate-200 font-mono text-xs"
                />
                <Textarea
                  value={proposalForm.starterJava}
                  onChange={(event) =>
                    setProposalForm((prev) => ({ ...prev, starterJava: event.target.value }))
                  }
                  placeholder="Starter code: Java"
                  className="min-h-[100px] border-slate-200 font-mono text-xs"
                />
                <Textarea
                  value={proposalForm.starterCpp}
                  onChange={(event) =>
                    setProposalForm((prev) => ({ ...prev, starterCpp: event.target.value }))
                  }
                  placeholder="Starter code: C++"
                  className="min-h-[100px] border-slate-200 font-mono text-xs"
                />
                <Textarea
                  value={proposalForm.starterC}
                  onChange={(event) =>
                    setProposalForm((prev) => ({ ...prev, starterC: event.target.value }))
                  }
                  placeholder="Starter code: C"
                  className="min-h-[100px] border-slate-200 font-mono text-xs"
                />
              </div>

              <Textarea
                value={proposalForm.editorialContent}
                onChange={(event) =>
                  setProposalForm((prev) => ({
                    ...prev,
                    editorialContent: event.target.value,
                  }))
                }
                placeholder="Editorial summary (optional but recommended)"
                className="min-h-[90px] border-slate-200"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                <span>
                  {isAdminUser
                    ? "Admin submissions are auto-approved and published instantly."
                    : "Your proposal will stay pending until an admin approves it."}
                </span>
                <Button
                  onClick={handleSubmitProblemProposal}
                  disabled={isSubmittingProposal}
                >
                  {isSubmittingProposal ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-1.5 h-4 w-4" />
                  )}
                  Submit Proposal
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              My Proposals
            </p>
            {isLoadingProposals ? (
              <div className="text-sm text-slate-500">Loading submissions...</div>
            ) : myProposals.length === 0 ? (
              <div className="text-sm text-slate-500">
                You have not submitted any coding question yet.
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {myProposals.slice(0, 6).map((proposal) => (
                  <div
                    key={proposal.id}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {proposal.title}
                      </p>
                      <Badge
                        className={cn(
                          "border text-[10px]",
                          proposalStatusClass[proposal.approvalStatus]
                        )}
                      >
                        {proposal.approvalStatus}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {proposal.difficulty} | {formatDateTime(proposal.submittedAt)}
                    </p>
                    {proposal.approvalNotes ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {proposal.approvalNotes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4">
            <CardTitle className="text-base font-semibold text-slate-900">
              Problem Set
            </CardTitle>
            <div className="space-y-3 pt-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search title or tag"
                  className="h-9 border-slate-200 pl-9"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Select
                  value={difficultyFilter}
                  onValueChange={(value) => setDifficultyFilter(value)}
                >
                  <SelectTrigger className="h-9 border-slate-200">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger className="h-9 border-slate-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Solved">Solved</SelectItem>
                    <SelectItem value="Attempted">Attempted</SelectItem>
                    <SelectItem value="Unseen">Unseen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={tagFilter} onValueChange={(value) => setTagFilter(value)}>
                <SelectTrigger className="h-9 border-slate-200">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[560px]">
              {isLoadingProblems ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading problems...
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No problems matched the current filters.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredProblems.map((problem) => (
                    <button
                      type="button"
                      key={problem.id}
                      onClick={() => handleSelectProblem(problem.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors",
                        selectedProblemId === problem.id
                          ? "bg-sky-50"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {problem.title}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(problem.tags || []).slice(0, 3).map((tag) => (
                              <Badge
                                key={`${problem.id}-${tag}`}
                                variant="outline"
                                className="border-slate-200 bg-white text-[10px] text-slate-600"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            className={cn(
                              "border text-[10px]",
                              difficultyBadgeClass[problem.difficulty]
                            )}
                          >
                            {problem.difficulty}
                          </Badge>
                          <Badge
                            className={cn(
                              "border text-[10px]",
                              statusBadgeClass[problem.status]
                            )}
                          >
                            {problem.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{problem.acceptanceRate}% accepted</span>
                        <span>
                          {problem.totalAccepted}/{problem.totalSubmissions}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4">
            {selectedProblem ? (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {selectedProblem.title}
                    </CardTitle>
                    <Badge
                      className={cn(
                        "border",
                        difficultyBadgeClass[selectedProblem.difficulty]
                      )}
                    >
                      {selectedProblem.difficulty}
                    </Badge>
                    <Badge className="border-slate-200 bg-white text-slate-600">
                      {selectedProblem.acceptanceRate}% accepted
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedProblem.hiddenTestCasesCount} hidden tests +{" "}
                    {selectedProblem.publicTestCases.length} visible tests
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(selectedProblem.tags || []).map((tag) => (
                    <Badge
                      key={`${selectedProblem.id}-top-${tag}`}
                      variant="outline"
                      className="border-slate-200 bg-white text-xs text-slate-600"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <CardTitle className="text-base font-semibold text-slate-900">
                Select a problem to start coding
              </CardTitle>
            )}
          </CardHeader>

          <CardContent className="p-4">
            {isLoadingWorkspace ? (
              <div className="flex h-[560px] items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading workspace...
              </div>
            ) : !selectedProblem ? (
              <div className="flex h-[560px] flex-col items-center justify-center gap-3 text-center text-slate-500">
                <ListChecks className="h-10 w-10 text-slate-300" />
                <p className="max-w-sm text-sm">
                  Pick a problem from the list to view details, code in Monaco,
                  run custom input, and submit against hidden test cases.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-[minmax(320px,44%)_1fr]">
                <div className="min-h-[560px] rounded-2xl border border-slate-200 bg-white">
                  <Tabs
                    value={workspaceTab}
                    onValueChange={setWorkspaceTab}
                    className="flex h-full flex-col"
                  >
                    <div className="border-b border-slate-100 p-3">
                      <TabsList className="grid h-9 w-full grid-cols-4 bg-slate-100 text-xs">
                        <TabsTrigger value="description">Problem</TabsTrigger>
                        <TabsTrigger value="editorial">Editorial</TabsTrigger>
                        <TabsTrigger value="discussions">Discuss</TabsTrigger>
                        <TabsTrigger value="submissions">History</TabsTrigger>
                      </TabsList>
                    </div>

                    <ScrollArea className="h-[510px] px-4 pb-4 pt-3">
                      <TabsContent value="description" className="space-y-5">
                        <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {selectedProblem.description}
                        </div>

                        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Input Format
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-slate-700">
                            {selectedProblem.inputFormat}
                          </p>
                        </div>

                        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Output Format
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-slate-700">
                            {selectedProblem.outputFormat}
                          </p>
                        </div>

                        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Constraints
                          </p>
                          {(selectedProblem.constraints || []).map((constraint) => (
                            <p key={constraint} className="text-sm text-slate-700">
                              - {constraint}
                            </p>
                          ))}
                        </div>

                        {(selectedProblem.sampleTestCases || []).map((testCase, index) => (
                          <div
                            key={`sample-${index}`}
                            className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Example {index + 1}
                            </p>
                            <div>
                              <p className="text-xs font-medium text-slate-500">Input</p>
                              <pre className="mt-1 overflow-auto rounded-md bg-slate-100 p-2 text-xs text-slate-700">
                                {testCase.input}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500">Output</p>
                              <pre className="mt-1 overflow-auto rounded-md bg-slate-100 p-2 text-xs text-slate-700">
                                {testCase.expectedOutput}
                              </pre>
                            </div>
                            {testCase.explanation ? (
                              <p className="text-xs text-slate-600">
                                {testCase.explanation}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </TabsContent>

                      <TabsContent value="editorial" className="space-y-4">
                        <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm leading-6 text-slate-700">
                          {selectedProblem.editorial?.content ||
                            "Editorial has not been added yet."}
                        </div>

                        {selectedProblem.editorial?.codeExamples?.[editorLanguage] ? (
                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                              {editorLanguage} Walkthrough
                            </p>
                            <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
                              {selectedProblem.editorial.codeExamples[editorLanguage]}
                            </pre>
                          </div>
                        ) : null}
                      </TabsContent>

                      <TabsContent value="discussions" className="space-y-4">
                        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <Textarea
                            value={discussionDraft}
                            onChange={(event) => setDiscussionDraft(event.target.value)}
                            placeholder="Share your approach, ask a doubt, or post an optimization..."
                            className="min-h-[90px] border-slate-200"
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={handlePostDiscussion}
                              disabled={isPostingDiscussion || !discussionDraft.trim()}
                            >
                              {isPostingDiscussion ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquare className="mr-1.5 h-4 w-4" />
                              )}
                              Post
                            </Button>
                          </div>
                        </div>

                        {(discussions || []).length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No discussion threads yet. Start the conversation.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {discussions.map((discussion) => {
                              const likedByCurrentUser = (discussion.likes || []).includes(
                                currentUserId
                              );

                              return (
                                <div
                                  key={discussion.id}
                                  className="rounded-xl border border-slate-200 bg-white p-3"
                                >
                                  <div className="flex items-start gap-3">
                                    <Link to={getProfilePath(discussion.user)}>
                                      <Avatar className="h-8 w-8 border border-slate-200">
                                        <AvatarImage
                                          src={discussion.user?.profilePicture}
                                          alt={discussion.user?.name || discussion.user?.username}
                                        />
                                        <AvatarFallback>
                                          {getUserInitials(discussion.user)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </Link>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <Link
                                          to={getProfilePath(discussion.user)}
                                          className="truncate text-xs font-semibold text-slate-700 hover:text-sky-700"
                                        >
                                          {discussion.user?.name ||
                                            discussion.user?.username ||
                                            "Anonymous"}
                                        </Link>
                                        <span className="text-[11px] text-slate-500">
                                          {formatDateTime(discussion.createdAt)}
                                        </span>
                                      </div>

                                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                        {discussion.content}
                                      </p>

                                      <div className="mt-2 flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={cn(
                                            "h-7 gap-1 border-slate-200 px-2 text-xs",
                                            likedByCurrentUser &&
                                              "border-rose-200 bg-rose-50 text-rose-700"
                                          )}
                                          onClick={() => handleToggleLike(discussion.id)}
                                        >
                                          <Heart className="h-3.5 w-3.5" />
                                          {discussion.likeCount}
                                        </Button>
                                        <span className="text-xs text-slate-500">
                                          {discussion.replies.length} replies
                                        </span>
                                      </div>

                                      {(discussion.replies || []).length > 0 ? (
                                        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-2.5">
                                          {discussion.replies.map((reply) => (
                                            <div
                                              key={reply.id}
                                              className="flex items-start gap-2"
                                            >
                                              <Avatar className="h-6 w-6 border border-slate-200">
                                                <AvatarImage
                                                  src={reply.user?.profilePicture}
                                                  alt={
                                                    reply.user?.name || reply.user?.username
                                                  }
                                                />
                                                <AvatarFallback>
                                                  {getUserInitials(reply.user)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-slate-700">
                                                  {reply.user?.name ||
                                                    reply.user?.username ||
                                                    "Anonymous"}
                                                </p>
                                                <p className="text-xs text-slate-600">
                                                  {reply.content}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}

                                      <div className="mt-2 flex gap-2">
                                        <Input
                                          value={replyDraftByDiscussion[discussion.id] || ""}
                                          onChange={(event) =>
                                            setReplyDraftByDiscussion((prev) => ({
                                              ...prev,
                                              [discussion.id]: event.target.value,
                                            }))
                                          }
                                          placeholder="Reply..."
                                          className="h-8 border-slate-200 text-xs"
                                        />
                                        <Button
                                          size="sm"
                                          className="h-8 px-3"
                                          onClick={() => handleReply(discussion.id)}
                                        >
                                          <Send className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="submissions" className="space-y-3">
                        {submissions.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No submissions yet for this problem.
                          </p>
                        ) : (
                          submissions.map((submission) => (
                            <div
                              key={submission.id}
                              className="rounded-xl border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <Badge
                                  className={cn(
                                    "border",
                                    submissionStatusClass(submission.status)
                                  )}
                                >
                                  {submission.status}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {formatDateTime(submission.createdAt)}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
                                <div>
                                  <p className="text-[11px] text-slate-500">Language</p>
                                  <p className="font-medium">{submission.language}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] text-slate-500">Runtime</p>
                                  <p className="font-medium">{submission.runtimeMs} ms</p>
                                </div>
                                <div>
                                  <p className="text-[11px] text-slate-500">Passed</p>
                                  <p className="font-medium">
                                    {submission.passedTestCases}/{submission.totalTestCases}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </div>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">
                          {selectedProblem.title}
                        </span>
                        <Badge variant="outline" className="border-slate-200 bg-white text-[10px] text-slate-600">
                          {editorLanguage}
                        </Badge>
                      </div>

                      <div className="w-full sm:w-48">
                        <Select
                          value={editorLanguage}
                          onValueChange={handleLanguageChange}
                        >
                          <SelectTrigger className="h-8 border-slate-200 bg-white text-xs">
                            <SelectValue placeholder="Language" />
                          </SelectTrigger>
                          <SelectContent>
                            {(languages || FALLBACK_LANGUAGES).map((language) => (
                              <SelectItem key={language.id} value={language.id}>
                                {language.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Editor
                      height="430px"
                      language={editorLanguage}
                      value={code}
                      onChange={(value) => setCode(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        lineNumbersMinChars: 3,
                        tabSize: 2,
                      }}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Custom Input (Run Only)
                    </p>
                    <Textarea
                      value={customInput}
                      onChange={(event) => setCustomInput(event.target.value)}
                      className="min-h-[90px] border-slate-200 font-mono text-xs"
                      placeholder="Provide stdin input for quick run..."
                    />

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        className="border-slate-300"
                        onClick={handleRunCode}
                        disabled={isRunning || isSubmitting}
                      >
                        {isRunning ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-1.5 h-4 w-4" />
                        )}
                        Run
                      </Button>
                      <Button
                        onClick={handleSubmitCode}
                        disabled={isSubmitting || isRunning}
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-1.5 h-4 w-4" />
                        )}
                        Submit
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Output
                      </p>
                      {runResult ? (
                        <Badge
                          className={cn("border", submissionStatusClass(runResult.status))}
                        >
                          {runResult.status}
                        </Badge>
                      ) : null}
                      {latestSubmission ? (
                        <Badge
                          className={cn(
                            "border",
                            submissionStatusClass(latestSubmission.status)
                          )}
                        >
                          {latestSubmission.status}
                        </Badge>
                      ) : null}
                    </div>

                    {!runResult && !latestSubmission ? (
                      <p className="text-sm text-slate-500">
                        Run code or submit to see execution details.
                      </p>
                    ) : null}

                    {runResult ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div className="rounded-md bg-slate-100 px-2 py-1">
                            Runtime: {runResult.runtimeMs} ms
                          </div>
                          <div className="rounded-md bg-slate-100 px-2 py-1">
                            Memory: {runResult.memoryKb} KB
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-xs">
                          <div>
                            <p className="font-semibold text-slate-600">Stdout</p>
                            <pre className="mt-1 max-h-28 overflow-auto rounded-md bg-slate-900 p-2 text-slate-100">
                              {runResult.stdout || "<empty>"}
                            </pre>
                          </div>
                          {runResult.stderr ? (
                            <div>
                              <p className="font-semibold text-slate-600">Stderr</p>
                              <pre className="mt-1 max-h-28 overflow-auto rounded-md bg-rose-900/90 p-2 text-rose-100">
                                {runResult.stderr}
                              </pre>
                            </div>
                          ) : null}
                          {runResult.compileOutput ? (
                            <div>
                              <p className="font-semibold text-slate-600">Compiler</p>
                              <pre className="mt-1 max-h-28 overflow-auto rounded-md bg-amber-900/90 p-2 text-amber-100">
                                {runResult.compileOutput}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {latestSubmission ? (
                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-md bg-slate-100 px-2 py-1">
                            Runtime: {latestSubmission.runtimeMs} ms
                          </div>
                          <div className="rounded-md bg-slate-100 px-2 py-1">
                            Memory: {latestSubmission.memoryKb} KB
                          </div>
                          <div className="rounded-md bg-slate-100 px-2 py-1">
                            Passed: {latestSubmission.passedTestCases}/
                            {latestSubmission.totalTestCases}
                          </div>
                          <div className="rounded-md bg-slate-100 px-2 py-1">
                            Language: {latestSubmission.language}
                          </div>
                        </div>

                        {(latestSubmission.testResults || []).length > 0 ? (
                          <div className="max-h-44 space-y-2 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                            {latestSubmission.testResults.map((result, index) => (
                              <div key={`${result.status}-${index}`} className="rounded-md bg-white p-2">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="font-medium text-slate-700">
                                    Test {index + 1}
                                  </span>
                                  <Badge
                                    className={cn(
                                      "border text-[10px]",
                                      result.passed
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                    )}
                                  >
                                    {result.status}
                                  </Badge>
                                </div>
                                <p className="truncate text-[11px] text-slate-500">
                                  Expected: {result.expectedOutput}
                                </p>
                                <p className="truncate text-[11px] text-slate-500">
                                  Actual: {result.actualOutput || "<empty>"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="flex items-start gap-2">
                      <Clock3 className="mt-0.5 h-4 w-4 text-slate-500" />
                      <p className="text-xs text-slate-600">
                        Submission history is persisted per problem. Discuss tab supports
                        likes and threaded replies, and avatars link to profile pages.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CodingPage;
