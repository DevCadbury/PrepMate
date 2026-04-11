export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubmissionStatus = 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compile_error';
export type ProblemStatus = 'active' | 'draft';

export interface Example {
  input: string;
  output: string;
  explanation: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  hidden: boolean;
}

export interface UserSubmission {
  id: string;
  user: {
    name: string;
    email: string;
    initials: string;
    color: string;
  };
  language: string;
  status: SubmissionStatus;
  runtime: string;
  memory: string;
  submittedAt: string;
  code: string;
  problemId: string;
  output?: string;
  errorMessage?: string;
  passedTests?: number;
  totalTests?: number;
}

export interface Solver {
  user: {
    name: string;
    email: string;
    initials: string;
    color: string;
  };
  solvedAt: string;
  timeTaken: string;
  attempts: number;
  bestRuntime: string;
  bestLanguage: string;
}

export interface Problem {
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
  examples: Example[];
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
  solveRate: number; // percentage
}

// ─── Admin Submissions Review ──────────────────────────────────────────────────

export interface AdminSubmission {
  id: string;
  user: string;
  problem: string;
  problemId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  language: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

export const mockProblems: Problem[] = [
  {
    id: 'p_001',
    title: 'Two Sum',
    difficulty: 'easy',
    category: 'Arrays',
    tags: ['array', 'hash-table'],
    solved: 1234,
    attempted: 2345,
    status: 'active',
    solveRate: 52.6,
    createdAt: '2026-01-15',
    updatedAt: '2026-03-20',
    description:
      'Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    constraints:
      '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'nums[1] + nums[2] == 6, return [1, 2].',
      },
    ],
    testCases: [
      { id: 'tc1', input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', hidden: false },
      { id: 'tc2', input: '[3,2,4]\n6', expectedOutput: '[1,2]', hidden: false },
      { id: 'tc3', input: '[3,3]\n6', expectedOutput: '[0,1]', hidden: true },
      { id: 'tc4', input: '[1,2,3,4,5]\n9', expectedOutput: '[3,4]', hidden: true },
    ],
  },
  {
    id: 'p_002',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'medium',
    category: 'Trees',
    tags: ['tree', 'bfs', 'binary-tree'],
    solved: 876,
    attempted: 1543,
    status: 'active',
    solveRate: 56.8,
    createdAt: '2026-01-20',
    updatedAt: '2026-03-15',
    description:
      "Given the `root` of a binary tree, return the **level order traversal** of its nodes' values (i.e., from left to right, level by level).",
    constraints:
      'The number of nodes in the tree is in the range [0, 2000].\n-1000 <= Node.val <= 1000',
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '[[3],[9,20],[15,7]]',
        explanation: 'Return nodes level by level from root to leaves.',
      },
    ],
    testCases: [
      { id: 'tc1', input: '[3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]', hidden: false },
      { id: 'tc2', input: '[1]', expectedOutput: '[[1]]', hidden: false },
      { id: 'tc3', input: '[]', expectedOutput: '[]', hidden: true },
    ],
  },
  {
    id: 'p_003',
    title: 'Dynamic Programming: 0/1 Knapsack',
    difficulty: 'hard',
    category: 'Dynamic Programming',
    tags: ['dp', 'knapsack', 'optimization'],
    solved: 234,
    attempted: 876,
    status: 'active',
    solveRate: 26.7,
    createdAt: '2026-02-01',
    updatedAt: '2026-04-01',
    description:
      'Given `n` items with weights and values, and a knapsack with capacity `W`, find the **maximum total value** you can put in the knapsack without exceeding the weight limit.\n\nEach item can be included **at most once** (0/1 property).',
    constraints: '1 <= n <= 100\n1 <= W <= 1000\n1 <= weights[i], values[i] <= 1000',
    examples: [
      {
        input: 'W = 50, weights = [10,20,30], values = [60,100,120]',
        output: '220',
        explanation: 'Take items with weight 20 and 30 (values 100 + 120 = 220).',
      },
    ],
    testCases: [
      { id: 'tc1', input: '50\n[10,20,30]\n[60,100,120]', expectedOutput: '220', hidden: false },
      { id: 'tc2', input: '10\n[5,4,6,3]\n[10,40,30,50]', expectedOutput: '90', hidden: true },
    ],
  },
  {
    id: 'p_004',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    category: 'Stack',
    tags: ['stack', 'string'],
    solved: 2100,
    attempted: 2800,
    status: 'active',
    solveRate: 75.0,
    createdAt: '2026-01-10',
    updatedAt: '2026-02-28',
    description:
      "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is **valid**.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only `()[]{}`.',
    examples: [
      { input: 's = "()"', output: 'true', explanation: '' },
      { input: 's = "()[]{}"', output: 'true', explanation: '' },
      { input: 's = "(]"', output: 'false', explanation: '' },
    ],
    testCases: [
      { id: 'tc1', input: '()', expectedOutput: 'true', hidden: false },
      { id: 'tc2', input: '()[]{}"', expectedOutput: 'true', hidden: false },
      { id: 'tc3', input: '(]', expectedOutput: 'false', hidden: true },
      { id: 'tc4', input: '{[]}', expectedOutput: 'true', hidden: true },
    ],
  },
  {
    id: 'p_005',
    title: 'Merge K Sorted Lists',
    difficulty: 'hard',
    category: 'Linked List',
    tags: ['linked-list', 'heap', 'divide-and-conquer'],
    solved: 145,
    attempted: 720,
    status: 'draft',
    solveRate: 20.1,
    createdAt: '2026-03-15',
    updatedAt: '2026-04-08',
    description:
      'You are given an array of `k` linked-lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    constraints: 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500',
    examples: [
      {
        input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
        output: '[1,1,2,3,4,4,5,6]',
        explanation: 'Merge all lists into one sorted list.',
      },
    ],
    testCases: [
      { id: 'tc1', input: '[[1,4,5],[1,3,4],[2,6]]', expectedOutput: '[1,1,2,3,4,4,5,6]', hidden: false },
    ],
  },
];

// ─── Per-problem submissions ───────────────────────────────────────────────────

export const mockUserSubmissions: UserSubmission[] = [
  // Two Sum
  {
    id: 's_001',
    problemId: 'p_001',
    user: { name: 'John Doe', email: 'john.doe@email.com', initials: 'JD', color: 'bg-blue-500' },
    language: 'Python',
    status: 'accepted',
    runtime: '48ms',
    memory: '16.4MB',
    submittedAt: '45 min ago',
    passedTests: 4,
    totalTests: 4,
    code: `def twoSum(self, nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  },
  {
    id: 's_002',
    problemId: 'p_001',
    user: { name: 'Alice Brown', email: 'alice.brown@email.com', initials: 'AB', color: 'bg-purple-500' },
    language: 'TypeScript',
    status: 'accepted',
    runtime: '52ms',
    memory: '15.8MB',
    submittedAt: '1 day ago',
    passedTests: 4,
    totalTests: 4,
    code: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
  },
  {
    id: 's_003',
    problemId: 'p_001',
    user: { name: 'Mike Johnson', email: 'mike.johnson@email.com', initials: 'MJ', color: 'bg-teal-500' },
    language: 'Java',
    status: 'wrong_answer',
    runtime: '62ms',
    memory: '18.2MB',
    submittedAt: '2 days ago',
    passedTests: 2,
    totalTests: 4,
    output: '[0,2]',
    errorMessage: 'Expected [1,2] but got [0,2] on test case #2',
    code: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{};
    }
}`,
  },
  {
    id: 's_004',
    problemId: 'p_001',
    user: { name: 'Sara Lee', email: 'sara.lee@email.com', initials: 'SL', color: 'bg-rose-500' },
    language: 'JavaScript',
    status: 'accepted',
    runtime: '55ms',
    memory: '17.1MB',
    submittedAt: '3 days ago',
    passedTests: 4,
    totalTests: 4,
    code: `var twoSum = function(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map[complement] !== undefined) {
      return [map[complement], i];
    }
    map[nums[i]] = i;
  }
};`,
  },
  // Binary Tree
  {
    id: 's_005',
    problemId: 'p_002',
    user: { name: 'Mike Johnson', email: 'mike.johnson@email.com', initials: 'MJ', color: 'bg-teal-500' },
    language: 'JavaScript',
    status: 'accepted',
    runtime: '45ms',
    memory: '14.2MB',
    submittedAt: '3 hours ago',
    passedTests: 3,
    totalTests: 3,
    code: `var levelOrder = function(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  while (queue.length) {
    const level = [];
    const len = queue.length;
    for (let i = 0; i < len; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
};`,
  },
  {
    id: 's_006',
    problemId: 'p_002',
    user: { name: 'Jane Smith', email: 'jane.smith@email.com', initials: 'JS', color: 'bg-pink-500' },
    language: 'Python',
    status: 'runtime_error',
    runtime: '—',
    memory: '—',
    submittedAt: '5 hours ago',
    passedTests: 0,
    totalTests: 3,
    errorMessage: "AttributeError: 'NoneType' object has no attribute 'val' on line 8",
    code: `from collections import deque

def levelOrder(self, root):
    result = []
    queue = deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)  # Bug: no null check
            queue.append(node.left)
            queue.append(node.right)
        result.append(level)
    return result`,
  },
  // Knapsack
  {
    id: 's_007',
    problemId: 'p_003',
    user: { name: 'Mike Johnson', email: 'mike.johnson@email.com', initials: 'MJ', color: 'bg-teal-500' },
    language: 'Java',
    status: 'time_limit_exceeded',
    runtime: 'TLE',
    memory: '22.4MB',
    submittedAt: '8 hours ago',
    passedTests: 1,
    totalTests: 2,
    errorMessage: 'Time Limit Exceeded on test case #2 (recursive solution without memoization)',
    code: `class Solution {
    public int knapSack(int W, int[] wt, int[] val, int n) {
        if (n == 0 || W == 0) return 0;
        if (wt[n - 1] > W)
            return knapSack(W, wt, val, n - 1);
        return Math.max(
            val[n-1] + knapSack(W - wt[n-1], wt, val, n - 1),
            knapSack(W, wt, val, n - 1)
        );
    }
}`,
  },
];

// ─── Solvers ──────────────────────────────────────────────────────────────────

export const mockSolvers: Solver[] = [
  {
    user: { name: 'John Doe', email: 'john.doe@email.com', initials: 'JD', color: 'bg-blue-500' },
    solvedAt: '45 min ago',
    timeTaken: '12m 34s',
    attempts: 1,
    bestRuntime: '48ms',
    bestLanguage: 'Python',
  },
  {
    user: { name: 'Alice Brown', email: 'alice.brown@email.com', initials: 'AB', color: 'bg-purple-500' },
    solvedAt: '1 day ago',
    timeTaken: '8m 12s',
    attempts: 2,
    bestRuntime: '52ms',
    bestLanguage: 'TypeScript',
  },
  {
    user: { name: 'Sara Lee', email: 'sara.lee@email.com', initials: 'SL', color: 'bg-rose-500' },
    solvedAt: '3 days ago',
    timeTaken: '19m 05s',
    attempts: 3,
    bestRuntime: '55ms',
    bestLanguage: 'JavaScript',
  },
  {
    user: { name: 'Mike Johnson', email: 'mike.johnson@email.com', initials: 'MJ', color: 'bg-teal-500' },
    solvedAt: '1 week ago',
    timeTaken: '28m 41s',
    attempts: 5,
    bestRuntime: '62ms',
    bestLanguage: 'Java',
  },
  {
    user: { name: 'Jane Smith', email: 'jane.smith@email.com', initials: 'JS', color: 'bg-pink-500' },
    solvedAt: '2 weeks ago',
    timeTaken: '6m 58s',
    attempts: 1,
    bestRuntime: '44ms',
    bestLanguage: 'Python',
  },
];

// ─── Admin Submission Review ───────────────────────────────────────────────────

export const mockAdminSubmissions: AdminSubmission[] = [
  { id: 'as_1', user: 'john.doe@email.com', problem: 'Custom Array Problem', problemId: 'p_001', status: 'pending', submittedAt: '2 hours ago', language: 'Python' },
  { id: 'as_2', user: 'jane.smith@email.com', problem: 'Graph Algorithm', problemId: 'p_002', status: 'pending', submittedAt: '5 hours ago', language: 'JavaScript' },
  { id: 'as_3', user: 'alice.brown@email.com', problem: 'Linked List Cycle', problemId: 'p_004', status: 'approved', submittedAt: '1 day ago', language: 'Java' },
  { id: 'as_4', user: 'mike.johnson@email.com', problem: 'Max Subarray', problemId: 'p_003', status: 'rejected', submittedAt: '2 days ago', language: 'C++' },
];
