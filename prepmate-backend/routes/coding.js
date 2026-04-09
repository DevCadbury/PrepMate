const express = require("express");
const mongoose = require("mongoose");
const { authenticateToken } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const CodingProblem = require("../models/CodingProblem");
const CodingSubmission = require("../models/CodingSubmission");
const CodingDiscussion = require("../models/CodingDiscussion");
const {
  executeCode,
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
} = require("../services/codeExecutionService");

const router = express.Router();

const SUPPORTED_LANGUAGE_KEYS = Object.keys(SUPPORTED_LANGUAGES);

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isAdminRole = (user) => String(user?.role || "").toLowerCase() === "admin";

const normalizeStringList = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      )
    );
  }

  return Array.from(
    new Set(
      String(value || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const normalizeTags = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      )
    );
  }

  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const normalizeTestCases = (testCases = []) => {
  if (!Array.isArray(testCases)) return [];

  return testCases
    .map((testCase) => ({
      input: String(testCase?.input || ""),
      expectedOutput: String(testCase?.expectedOutput || ""),
      explanation: testCase?.explanation
        ? String(testCase.explanation)
        : undefined,
    }))
    .filter((testCase) => testCase.input !== "" || testCase.expectedOutput !== "");
};

const normalizeStarterCode = (value = {}) => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const entries = Object.entries(value)
    .map(([language, source]) => [normalizeLanguage(language), String(source || "")])
    .filter(([language, source]) => SUPPORTED_LANGUAGES[language] && source.trim().length > 0);

  return Object.fromEntries(entries);
};

const normalizeEditorialCodeExamples = (value = {}) => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const entries = Object.entries(value)
    .map(([language, source]) => [normalizeLanguage(language), String(source || "")])
    .filter(([language, source]) => SUPPORTED_LANGUAGES[language] && source.trim().length > 0);

  return Object.fromEntries(entries);
};

const toPlainMap = (value) => {
  if (!value) return {};
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }

  return { ...value };
};

const normalizeDifficulty = (difficulty = "") => {
  const normalized = String(difficulty || "").trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";

  return null;
};

const computeAcceptanceRate = (acceptance = {}) => {
  const totalSubmissions = Number(acceptance?.totalSubmissions || 0);
  const totalAccepted = Number(acceptance?.totalAccepted || 0);

  if (totalSubmissions <= 0) {
    return 0;
  }

  return Number(((totalAccepted / totalSubmissions) * 100).toFixed(2));
};

const languageLabelByKey = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
};

const DEFAULT_PROBLEMS = [
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    description:
      "Given an array of integers and a target integer, print the indices of the two numbers that add up to target.\n\nInput follows stdin format for coding-judge style execution.",
    inputFormat:
      "Line 1: n (length of array)\nLine 2: n space-separated integers\nLine 3: target",
    outputFormat:
      "Print two zero-based indices in ascending order separated by a space",
    constraints: [
      "2 <= n <= 200000",
      "-10^9 <= nums[i], target <= 10^9",
      "Exactly one valid answer exists",
    ],
    sampleTestCases: [
      {
        input: "4\n2 7 11 15\n9",
        expectedOutput: "0 1",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9",
      },
    ],
    publicTestCases: [
      {
        input: "4\n2 7 11 15\n9",
        expectedOutput: "0 1",
      },
      {
        input: "3\n3 2 4\n6",
        expectedOutput: "1 2",
      },
    ],
    hiddenTestCases: [
      {
        input: "5\n1 5 6 8 10\n16",
        expectedOutput: "2 4",
      },
      {
        input: "6\n-5 2 7 11 15 20\n9",
        expectedOutput: "1 2",
      },
      {
        input: "4\n100 200 300 400\n700",
        expectedOutput: "2 3",
      },
    ],
    starterCode: {
      javascript:
        "const fs = require('fs');\nconst data = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n\nconst n = data[0];\nconst nums = data.slice(1, n + 1);\nconst target = data[n + 1];\n\n// TODO: implement O(n) solution\nconst map = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const need = target - nums[i];\n  if (map.has(need)) {\n    const a = map.get(need);\n    const b = i;\n    console.log(`${Math.min(a, b)} ${Math.max(a, b)}`);\n    process.exit(0);\n  }\n  map.set(nums[i], i);\n}\n",
      python:
        "import sys\n\ndata = list(map(int, sys.stdin.read().strip().split()))\nn = data[0]\nnums = data[1:n+1]\ntarget = data[n+1]\n\n# TODO: implement O(n) solution\npos = {}\nfor i, num in enumerate(nums):\n    need = target - num\n    if need in pos:\n        a, b = pos[need], i\n        print(min(a, b), max(a, b))\n        break\n    pos[num] = i\n",
      java:
        "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    int target = sc.nextInt();\n\n    Map<Integer, Integer> pos = new HashMap<>();\n    for (int i = 0; i < n; i++) {\n      int need = target - nums[i];\n      if (pos.containsKey(need)) {\n        int a = pos.get(need), b = i;\n        System.out.println(Math.min(a, b) + \" \" + Math.max(a, b));\n        return;\n      }\n      pos.put(nums[i], i);\n    }\n  }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  int n;\n  cin >> n;\n  vector<long long> nums(n);\n  for (int i = 0; i < n; i++) cin >> nums[i];\n  long long target;\n  cin >> target;\n\n  unordered_map<long long, int> pos;\n  for (int i = 0; i < n; i++) {\n    long long need = target - nums[i];\n    if (pos.count(need)) {\n      int a = pos[need], b = i;\n      cout << min(a, b) << \" \" << max(a, b) << \"\\n\";\n      return 0;\n    }\n    pos[nums[i]] = i;\n  }\n\n  return 0;\n}\n",
      c:
        "#include <stdio.h>\n\nint main() {\n  int n;\n  if (scanf(\"%d\", &n) != 1) return 0;\n  long long nums[200000];\n  for (int i = 0; i < n; i++) scanf(\"%lld\", &nums[i]);\n  long long target;\n  scanf(\"%lld\", &target);\n\n  for (int i = 0; i < n; i++) {\n    for (int j = i + 1; j < n; j++) {\n      if (nums[i] + nums[j] == target) {\n        printf(\"%d %d\\n\", i, j);\n        return 0;\n      }\n    }\n  }\n\n  return 0;\n}\n",
    },
    editorial: {
      content:
        "Use a hash map to store value -> index as you iterate. For each value x, check if target - x already exists. This reduces complexity from O(n^2) to O(n).",
      codeExamples: {
        javascript:
          "const seen = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const need = target - nums[i];\n  if (seen.has(need)) return [seen.get(need), i];\n  seen.set(nums[i], i);\n}",
      },
    },
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    tags: ["Stack", "String"],
    description:
      "Given a string containing only brackets ()[]{} determine whether it is valid. A string is valid if every opening bracket has the correct closing bracket in the correct order.",
    inputFormat: "Line 1: string s",
    outputFormat: "Print true or false",
    constraints: ["1 <= s.length <= 200000"],
    sampleTestCases: [
      {
        input: "()[]{}",
        expectedOutput: "true",
      },
    ],
    publicTestCases: [
      {
        input: "()[]{}",
        expectedOutput: "true",
      },
      {
        input: "(]",
        expectedOutput: "false",
      },
    ],
    hiddenTestCases: [
      {
        input: "([{}])",
        expectedOutput: "true",
      },
      {
        input: "((({{{[[[]]]}}})))",
        expectedOutput: "true",
      },
      {
        input: "([)]",
        expectedOutput: "false",
      },
    ],
    starterCode: {
      javascript:
        "const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconst stack = [];\nconst pairs = { ')': '(', ']': '[', '}': '{' };\n\nfor (const ch of s) {\n  if (ch === '(' || ch === '[' || ch === '{') {\n    stack.push(ch);\n    continue;\n  }\n\n  if (!pairs[ch] || stack.pop() !== pairs[ch]) {\n    console.log('false');\n    process.exit(0);\n  }\n}\n\nconsole.log(stack.length === 0 ? 'true' : 'false');\n",
      python:
        "import sys\n\ns = sys.stdin.read().strip()\nstack = []\npairs = {')': '(', ']': '[', '}': '{'}\n\nfor ch in s:\n    if ch in '([{':\n        stack.append(ch)\n    else:\n        if ch not in pairs or not stack or stack.pop() != pairs[ch]:\n            print('false')\n            break\nelse:\n    print('true' if not stack else 'false')\n",
      java:
        "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.nextLine().trim();\n    Deque<Character> stack = new ArrayDeque<>();\n\n    for (char ch : s.toCharArray()) {\n      if (ch == '(' || ch == '[' || ch == '{') {\n        stack.push(ch);\n      } else {\n        if (stack.isEmpty()) {\n          System.out.println(\"false\");\n          return;\n        }\n        char top = stack.pop();\n        if ((ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{')) {\n          System.out.println(\"false\");\n          return;\n        }\n      }\n    }\n\n    System.out.println(stack.isEmpty() ? \"true\" : \"false\");\n  }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  string s;\n  getline(cin, s);\n  vector<char> st;\n\n  for (char ch : s) {\n    if (ch == '(' || ch == '[' || ch == '{') st.push_back(ch);\n    else {\n      if (st.empty()) {\n        cout << \"false\\n\";\n        return 0;\n      }\n      char top = st.back();\n      st.pop_back();\n      if ((ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{')) {\n        cout << \"false\\n\";\n        return 0;\n      }\n    }\n  }\n\n  cout << (st.empty() ? \"true\" : \"false\") << \"\\n\";\n  return 0;\n}\n",
      c:
        "#include <stdio.h>\n#include <string.h>\n\nint main() {\n  char s[300000];\n  if (!fgets(s, sizeof(s), stdin)) return 0;\n  int n = strlen(s);\n  if (n > 0 && s[n - 1] == '\\n') s[n - 1] = '\\0';\n\n  char st[300000];\n  int top = -1;\n\n  for (int i = 0; s[i]; i++) {\n    char ch = s[i];\n    if (ch == '(' || ch == '[' || ch == '{') st[++top] = ch;\n    else {\n      if (top < 0) {\n        printf(\"false\\n\");\n        return 0;\n      }\n      char t = st[top--];\n      if ((ch == ')' && t != '(') || (ch == ']' && t != '[') || (ch == '}' && t != '{')) {\n        printf(\"false\\n\");\n        return 0;\n      }\n    }\n  }\n\n  printf(top == -1 ? \"true\\n\" : \"false\\n\");\n  return 0;\n}\n",
    },
    editorial: {
      content:
        "Maintain a stack of opening brackets. When a closing bracket appears, check if it matches the most recent opening bracket. If mismatch or stack underflow happens, answer is false.",
      codeExamples: {
        javascript:
          "const stack = [];\nfor (const ch of s) {\n  if ('([{'.includes(ch)) stack.push(ch);\n  else if (pairs[ch] !== stack.pop()) return false;\n}\nreturn stack.length === 0;",
      },
    },
  },
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    tags: ["Sliding Window", "String", "Hash Table"],
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    inputFormat: "Line 1: string s",
    outputFormat: "Print one integer (maximum length)",
    constraints: ["0 <= s.length <= 200000"],
    sampleTestCases: [
      {
        input: "abcabcbb",
        expectedOutput: "3",
      },
    ],
    publicTestCases: [
      {
        input: "abcabcbb",
        expectedOutput: "3",
      },
      {
        input: "bbbbb",
        expectedOutput: "1",
      },
    ],
    hiddenTestCases: [
      {
        input: "pwwkew",
        expectedOutput: "3",
      },
      {
        input: "",
        expectedOutput: "0",
      },
      {
        input: "abba",
        expectedOutput: "2",
      },
    ],
    starterCode: {
      javascript:
        "const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\n\nlet left = 0;\nlet best = 0;\nconst last = new Map();\n\nfor (let right = 0; right < s.length; right++) {\n  const ch = s[right];\n  if (last.has(ch) && last.get(ch) >= left) left = last.get(ch) + 1;\n  last.set(ch, right);\n  best = Math.max(best, right - left + 1);\n}\n\nconsole.log(best);\n",
      python:
        "import sys\n\ns = sys.stdin.read().strip()\nleft = 0\nbest = 0\nlast = {}\n\nfor right, ch in enumerate(s):\n    if ch in last and last[ch] >= left:\n        left = last[ch] + 1\n    last[ch] = right\n    best = max(best, right - left + 1)\n\nprint(best)\n",
      java:
        "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.hasNextLine() ? sc.nextLine() : \"\";\n\n    int left = 0, best = 0;\n    Map<Character, Integer> last = new HashMap<>();\n\n    for (int right = 0; right < s.length(); right++) {\n      char ch = s.charAt(right);\n      if (last.containsKey(ch) && last.get(ch) >= left) left = last.get(ch) + 1;\n      last.put(ch, right);\n      best = Math.max(best, right - left + 1);\n    }\n\n    System.out.println(best);\n  }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  string s;\n  getline(cin, s);\n  vector<int> last(256, -1);\n  int left = 0, best = 0;\n\n  for (int right = 0; right < (int)s.size(); right++) {\n    unsigned char ch = (unsigned char)s[right];\n    if (last[ch] >= left) left = last[ch] + 1;\n    last[ch] = right;\n    best = max(best, right - left + 1);\n  }\n\n  cout << best << \"\\n\";\n  return 0;\n}\n",
      c:
        "#include <stdio.h>\n#include <string.h>\n\nint main() {\n  char s[300000];\n  if (!fgets(s, sizeof(s), stdin)) {\n    printf(\"0\\n\");\n    return 0;\n  }\n  int n = strlen(s);\n  if (n > 0 && s[n - 1] == '\\n') s[--n] = '\\0';\n\n  int last[256];\n  for (int i = 0; i < 256; i++) last[i] = -1;\n\n  int left = 0, best = 0;\n  for (int right = 0; right < n; right++) {\n    unsigned char ch = (unsigned char)s[right];\n    if (last[ch] >= left) left = last[ch] + 1;\n    last[ch] = right;\n    int len = right - left + 1;\n    if (len > best) best = len;\n  }\n\n  printf(\"%d\\n\", best);\n  return 0;\n}\n",
    },
    editorial: {
      content:
        "Use a sliding window with the left pointer indicating the beginning of a unique-character window. Track the most recent index of each character and jump left when a duplicate enters the window.",
      codeExamples: {
        javascript:
          "let left = 0, best = 0;\nconst last = new Map();\nfor (let right = 0; right < s.length; right++) {\n  if (last.has(s[right]) && last.get(s[right]) >= left) left = last.get(s[right]) + 1;\n  last.set(s[right], right);\n  best = Math.max(best, right - left + 1);\n}",
      },
    },
  },
  {
    title: "Median of Two Sorted Arrays",
    slug: "median-of-two-sorted-arrays",
    difficulty: "Hard",
    tags: ["Binary Search", "Array"],
    description:
      "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays.\n\nThis stdin version expects both arrays as separate lines.",
    inputFormat:
      "Line 1: m followed by m sorted integers\nLine 2: n followed by n sorted integers",
    outputFormat: "Print median as decimal (use .5 when needed)",
    constraints: [
      "0 <= m, n <= 200000",
      "1 <= m + n <= 200000",
      "Both arrays are individually sorted in non-decreasing order",
    ],
    sampleTestCases: [
      {
        input: "2 1 3\n1 2",
        expectedOutput: "2",
      },
    ],
    publicTestCases: [
      {
        input: "2 1 3\n1 2",
        expectedOutput: "2",
      },
      {
        input: "2 1 2\n2 3 4",
        expectedOutput: "2.5",
      },
    ],
    hiddenTestCases: [
      {
        input: "1 100\n1 101",
        expectedOutput: "100.5",
      },
      {
        input: "0\n5 1 2 3 4 5",
        expectedOutput: "3",
      },
      {
        input: "3 1 2 3\n3 4 5 6",
        expectedOutput: "3.5",
      },
    ],
    starterCode: {
      javascript:
        "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf8').trim().split('\\n');\nconst parse = (line) => {\n  const arr = line.trim().split(/\\s+/).map(Number);\n  const n = arr[0] || 0;\n  return arr.slice(1, n + 1);\n};\n\nconst a = parse(lines[0] || '0');\nconst b = parse(lines[1] || '0');\n\nconst merged = [];\nlet i = 0, j = 0;\nwhile (i < a.length || j < b.length) {\n  if (j >= b.length || (i < a.length && a[i] <= b[j])) merged.push(a[i++]);\n  else merged.push(b[j++]);\n}\n\nconst n = merged.length;\nif (n % 2 === 1) console.log(merged[Math.floor(n / 2)]);\nelse console.log(((merged[n / 2 - 1] + merged[n / 2]) / 2).toString());\n",
      python:
        "import sys\n\nlines = [line.strip() for line in sys.stdin.read().splitlines()]\n\ndef parse(line):\n    if not line:\n        return []\n    arr = list(map(int, line.split()))\n    n = arr[0] if arr else 0\n    return arr[1:n+1]\n\na = parse(lines[0] if len(lines) > 0 else '0')\nb = parse(lines[1] if len(lines) > 1 else '0')\n\nmerged = sorted(a + b)\nn = len(merged)\nif n % 2:\n    print(merged[n // 2])\nelse:\n    print((merged[n // 2 - 1] + merged[n // 2]) / 2)\n",
      java:
        "import java.util.*;\n\npublic class Main {\n  static int[] parse(String line) {\n    if (line == null || line.trim().isEmpty()) return new int[0];\n    String[] parts = line.trim().split(\"\\\\s+\");\n    int n = Integer.parseInt(parts[0]);\n    int[] arr = new int[n];\n    for (int i = 0; i < n; i++) arr[i] = Integer.parseInt(parts[i + 1]);\n    return arr;\n  }\n\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String l1 = sc.hasNextLine() ? sc.nextLine() : \"0\";\n    String l2 = sc.hasNextLine() ? sc.nextLine() : \"0\";\n\n    int[] a = parse(l1);\n    int[] b = parse(l2);\n    int[] merged = new int[a.length + b.length];\n\n    int i = 0, j = 0, k = 0;\n    while (i < a.length || j < b.length) {\n      if (j >= b.length || (i < a.length && a[i] <= b[j])) merged[k++] = a[i++];\n      else merged[k++] = b[j++];\n    }\n\n    int n = merged.length;\n    if (n % 2 == 1) System.out.println(merged[n / 2]);\n    else System.out.println((merged[n / 2 - 1] + merged[n / 2]) / 2.0);\n  }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nvector<long long> parseLine(const string& line) {\n  stringstream ss(line);\n  int n = 0;\n  ss >> n;\n  vector<long long> arr(n);\n  for (int i = 0; i < n; i++) ss >> arr[i];\n  return arr;\n}\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  string l1, l2;\n  getline(cin, l1);\n  getline(cin, l2);\n\n  vector<long long> a = parseLine(l1);\n  vector<long long> b = parseLine(l2);\n  vector<long long> merged;\n  merged.reserve(a.size() + b.size());\n\n  size_t i = 0, j = 0;\n  while (i < a.size() || j < b.size()) {\n    if (j >= b.size() || (i < a.size() && a[i] <= b[j])) merged.push_back(a[i++]);\n    else merged.push_back(b[j++]);\n  }\n\n  int n = (int)merged.size();\n  if (n % 2 == 1) cout << merged[n / 2] << \"\\n\";\n  else cout << (merged[n / 2 - 1] + merged[n / 2]) / 2.0 << \"\\n\";\n\n  return 0;\n}\n",
      c:
        "#include <stdio.h>\n\nint main() {\n  int m = 0, n = 0;\n  if (scanf(\"%d\", &m) != 1) return 0;\n  long long a[200000], b[200000];\n  for (int i = 0; i < m; i++) scanf(\"%lld\", &a[i]);\n\n  if (scanf(\"%d\", &n) != 1) n = 0;\n  for (int i = 0; i < n; i++) scanf(\"%lld\", &b[i]);\n\n  long long merged[400000];\n  int i = 0, j = 0, k = 0;\n  while (i < m || j < n) {\n    if (j >= n || (i < m && a[i] <= b[j])) merged[k++] = a[i++];\n    else merged[k++] = b[j++];\n  }\n\n  if (k % 2 == 1) printf(\"%lld\\n\", merged[k / 2]);\n  else printf(\"%.1f\\n\", (merged[k / 2 - 1] + merged[k / 2]) / 2.0);\n\n  return 0;\n}\n",
    },
    editorial: {
      content:
        "The optimal solution uses binary search partition in O(log(min(m,n))). A simpler merge-based solution is O(m+n) and works for practice and correctness.",
      codeExamples: {
        javascript:
          "const merged = [...nums1, ...nums2].sort((a, b) => a - b);\nconst n = merged.length;\nreturn n % 2 ? merged[Math.floor(n / 2)] : (merged[n / 2 - 1] + merged[n / 2]) / 2;",
      },
    },
  },
];

let defaultProblemsSeeded = false;

const ensureDefaultProblems = async () => {
  if (defaultProblemsSeeded) {
    return;
  }

  const operations = DEFAULT_PROBLEMS.map((problem) => {
    const slug = slugify(problem.slug || problem.title);

    return {
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            ...problem,
            slug,
            isPublished: true,
            approvalStatus: "approved",
            approvalNotes: "Seeded default problem",
          },
          $setOnInsert: {
            submittedAt: new Date(),
            approvedAt: new Date(),
          },
        },
        upsert: true,
      },
    };
  });

  try {
    if (operations.length > 0) {
      await CodingProblem.bulkWrite(operations, { ordered: false });
    }
  } catch (error) {
    // Ignore duplicate key races if multiple instances seed in parallel.
    if (error?.code !== 11000 && !error?.writeErrors?.every((item) => item.code === 11000)) {
      throw error;
    }
  }

  defaultProblemsSeeded = true;
};

const formatProblemSummary = (problem, userStatus = "Unseen") => ({
  id: String(problem._id),
  title: problem.title,
  slug: problem.slug,
  difficulty: problem.difficulty,
  tags: Array.isArray(problem.tags) ? problem.tags : [],
  acceptanceRate: computeAcceptanceRate(problem.acceptance),
  status: userStatus,
  totalSubmissions: Number(problem.acceptance?.totalSubmissions || 0),
  totalAccepted: Number(problem.acceptance?.totalAccepted || 0),
  updatedAt: problem.updatedAt,
});

const formatProblemDetail = (problem, userStatus = "Unseen") => ({
  ...formatProblemSummary(problem, userStatus),
  description: problem.description,
  inputFormat: problem.inputFormat,
  outputFormat: problem.outputFormat,
  constraints: Array.isArray(problem.constraints) ? problem.constraints : [],
  sampleTestCases: Array.isArray(problem.sampleTestCases)
    ? problem.sampleTestCases
    : [],
  publicTestCases: Array.isArray(problem.publicTestCases)
    ? problem.publicTestCases
    : [],
  hiddenTestCasesCount: Array.isArray(problem.hiddenTestCases)
    ? problem.hiddenTestCases.length
    : 0,
  starterCode: toPlainMap(problem.starterCode),
  editorial: {
    content: problem.editorial?.content || "",
    codeExamples: toPlainMap(problem.editorial?.codeExamples),
  },
});

const formatProposalSummary = (problem) => ({
  id: String(problem._id),
  title: problem.title,
  slug: problem.slug,
  difficulty: problem.difficulty,
  tags: Array.isArray(problem.tags) ? problem.tags : [],
  approvalStatus: problem.approvalStatus || "pending",
  approvalNotes: problem.approvalNotes || "",
  isPublished: Boolean(problem.isPublished),
  submittedAt: problem.submittedAt || problem.createdAt,
  updatedAt: problem.updatedAt,
  createdBy: problem.createdBy
    ? {
        id: String(problem.createdBy._id || problem.createdBy),
        name: problem.createdBy.name,
        username: problem.createdBy.username,
      }
    : null,
});

const buildUniqueProblemSlug = async (value) => {
  const base = slugify(value || "problem");
  if (!base) {
    return `problem-${Date.now()}`;
  }

  let candidate = base;
  let counter = 1;

  while (await CodingProblem.exists({ slug: candidate })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
};

const normalizeApprovalStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["pending", "approved", "rejected"].includes(normalized)) {
    return normalized;
  }

  return null;
};

const getPublicProblemFilter = () => ({
  isPublished: true,
  $or: [
    { approvalStatus: "approved" },
    { approvalStatus: { $exists: false } },
    { approvalStatus: null },
  ],
});

const resolveProblemByParam = async (problemParam) => {
  const where = getPublicProblemFilter();

  if (mongoose.Types.ObjectId.isValid(problemParam)) {
    return CodingProblem.findOne({ ...where, _id: problemParam });
  }

  return CodingProblem.findOne({ ...where, slug: String(problemParam || "") });
};

const statusRank = {
  Accepted: 3,
  "Wrong Answer": 2,
  "Time Limit Exceeded": 2,
  "Runtime Error": 2,
  "Compilation Error": 2,
  "Internal Error": 1,
};

const getUserProblemStatusMap = async (userId, problemIds) => {
  if (!userId || !Array.isArray(problemIds) || problemIds.length === 0) {
    return new Map();
  }

  const submissions = await CodingSubmission.find({
    user: userId,
    problem: { $in: problemIds },
  })
    .select("problem status")
    .lean();

  const map = new Map();

  submissions.forEach((entry) => {
    const key = String(entry.problem);
    const prev = map.get(key) || "Unseen";

    if (entry.status === "Accepted") {
      map.set(key, "Solved");
      return;
    }

    if (prev !== "Solved") {
      map.set(key, "Attempted");
    }
  });

  return map;
};

const formatSubmission = (submission, includeCode = false) => ({
  id: String(submission._id),
  problemId: String(submission.problem?._id || submission.problem),
  problemTitle: submission.problem?.title,
  status: submission.status,
  mode: submission.mode,
  language: submission.language,
  runtimeMs: submission.runtimeMs,
  memoryKb: submission.memoryKb,
  passedTestCases: submission.passedTestCases,
  totalTestCases: submission.totalTestCases,
  createdAt: submission.createdAt,
  updatedAt: submission.updatedAt,
  code: includeCode ? submission.code : undefined,
  testResults: Array.isArray(submission.testResults)
    ? submission.testResults.map((result) => ({
        input: result.input,
        expectedOutput: result.isHidden ? "***" : result.expectedOutput,
        actualOutput: result.actualOutput,
        passed: result.passed,
        status: result.status,
        isHidden: result.isHidden,
        runtimeMs: result.runtimeMs,
        memoryKb: result.memoryKb,
      }))
    : [],
});

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const computeStreak = (acceptedSubmissions) => {
  const daySet = new Set(
    acceptedSubmissions
      .map((submission) => toDateKey(submission.createdAt))
      .filter(Boolean)
  );

  if (daySet.size === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let cursor = new Date(today);
  const todayKey = toDateKey(cursor);
  const yesterdayKey = toDateKey(yesterday);

  if (!daySet.has(todayKey) && daySet.has(yesterdayKey)) {
    cursor = yesterday;
  }

  let streak = 0;
  while (true) {
    const key = toDateKey(cursor);
    if (!daySet.has(key)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

router.use(authenticateToken);

router.get(
  "/languages",
  asyncHandler(async (req, res) => {
    const languages = SUPPORTED_LANGUAGE_KEYS.map((key) => ({
      id: key,
      label: languageLabelByKey[key] || key,
    }));

    res.json({
      success: true,
      data: { languages },
    });
  })
);

router.get(
  "/problems",
  asyncHandler(async (req, res) => {
    await ensureDefaultProblems();

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const search = String(req.query.search || "").trim();
    const difficulty = normalizeDifficulty(req.query.difficulty);
    const tags = String(req.query.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const where = getPublicProblemFilter();
    if (difficulty) {
      where.difficulty = difficulty;
    }
    if (tags.length > 0) {
      where.tags = { $all: tags };
    }
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      where.$or = [
        { title: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    const [total, problems] = await Promise.all([
      CodingProblem.countDocuments(where),
      CodingProblem.find(where)
        .sort({ difficulty: 1, title: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const statusMap = await getUserProblemStatusMap(
      req.user._id,
      problems.map((problem) => problem._id)
    );

    const items = problems.map((problem) =>
      formatProblemSummary(
        problem,
        statusMap.get(String(problem._id)) || "Unseen"
      )
    );

    res.json({
      success: true,
      data: {
        problems: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  })
);

router.post(
  "/problems/proposals",
  asyncHandler(async (req, res) => {
    const title = String(req.body.title || "").trim();
    const difficulty = normalizeDifficulty(req.body.difficulty);
    const description = String(req.body.description || "").trim();
    const inputFormat = String(req.body.inputFormat || "").trim();
    const outputFormat = String(req.body.outputFormat || "").trim();
    const tags = normalizeTags(req.body.tags);
    const constraints = normalizeStringList(req.body.constraints);
    const sampleTestCases = normalizeTestCases(req.body.sampleTestCases);
    const publicTestCases = normalizeTestCases(req.body.publicTestCases);
    const hiddenTestCases = normalizeTestCases(req.body.hiddenTestCases);
    const starterCode = normalizeStarterCode(req.body.starterCode);
    const editorialContent = String(
      req.body.editorial?.content || req.body.editorialContent || ""
    ).trim();
    const editorialCodeExamples = normalizeEditorialCodeExamples(
      req.body.editorial?.codeExamples || req.body.editorialCodeExamples
    );

    if (!title || !difficulty || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, difficulty, and description are required",
      });
    }

    if (sampleTestCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one sample test case is required",
      });
    }

    if (hiddenTestCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one hidden test case is required",
      });
    }

    if (Object.keys(starterCode).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide starter code for at least one supported language",
      });
    }

    const slug = await buildUniqueProblemSlug(req.body.slug || title);
    const adminSubmission = isAdminRole(req.user);
    const now = new Date();

    const problem = await CodingProblem.create({
      title,
      slug,
      difficulty,
      tags,
      description,
      inputFormat,
      outputFormat,
      constraints,
      sampleTestCases,
      publicTestCases: publicTestCases.length > 0 ? publicTestCases : sampleTestCases,
      hiddenTestCases,
      starterCode,
      editorial: {
        content: editorialContent,
        codeExamples: editorialCodeExamples,
      },
      acceptance: {
        totalSubmissions: 0,
        totalAccepted: 0,
      },
      createdBy: req.user._id,
      approvalStatus: adminSubmission ? "approved" : "pending",
      submittedAt: now,
      approvedBy: adminSubmission ? req.user._id : undefined,
      approvedAt: adminSubmission ? now : undefined,
      approvalNotes: adminSubmission
        ? "Created by admin and auto-approved"
        : "Awaiting admin review",
      isPublished: adminSubmission,
    });

    const populated = await CodingProblem.findById(problem._id)
      .populate("createdBy", "name username")
      .lean();

    res.status(201).json({
      success: true,
      message: adminSubmission
        ? "Problem created and published"
        : "Problem submitted for admin approval",
      data: {
        proposal: formatProposalSummary(populated),
      },
    });
  })
);

router.get(
  "/problems/proposals/me",
  asyncHandler(async (req, res) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

    const proposals = await CodingProblem.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("createdBy", "name username")
      .lean();

    res.json({
      success: true,
      data: {
        proposals: proposals.map(formatProposalSummary),
      },
    });
  })
);

router.get(
  "/admin/problem-submissions",
  asyncHandler(async (req, res) => {
    if (!isAdminRole(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const search = String(req.query.search || "").trim();
    const status = normalizeApprovalStatus(req.query.status);

    const where = {
      createdBy: { $exists: true, $ne: null },
    };

    if (status) {
      where.approvalStatus = status;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      where.$or = [
        { title: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    const [total, proposals] = await Promise.all([
      CodingProblem.countDocuments(where),
      CodingProblem.find(where)
        .sort({ submittedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("createdBy", "name username")
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        proposals: proposals.map(formatProposalSummary),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  })
);

router.patch(
  "/admin/problem-submissions/:problemId/approve",
  asyncHandler(async (req, res) => {
    if (!isAdminRole(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.problemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid problem id",
      });
    }

    const proposal = await CodingProblem.findById(req.params.problemId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Problem submission not found",
      });
    }

    const notes = String(req.body.notes || "").trim();

    proposal.approvalStatus = "approved";
    proposal.isPublished = true;
    proposal.approvedBy = req.user._id;
    proposal.approvedAt = new Date();
    proposal.rejectedBy = undefined;
    proposal.rejectedAt = undefined;
    proposal.approvalNotes = notes || "Approved by admin";

    await proposal.save();

    const updated = await CodingProblem.findById(proposal._id)
      .populate("createdBy", "name username")
      .lean();

    res.json({
      success: true,
      data: {
        proposal: formatProposalSummary(updated),
      },
    });
  })
);

router.patch(
  "/admin/problem-submissions/:problemId/reject",
  asyncHandler(async (req, res) => {
    if (!isAdminRole(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.problemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid problem id",
      });
    }

    const proposal = await CodingProblem.findById(req.params.problemId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Problem submission not found",
      });
    }

    const reason = String(req.body.reason || "").trim();

    proposal.approvalStatus = "rejected";
    proposal.isPublished = false;
    proposal.rejectedBy = req.user._id;
    proposal.rejectedAt = new Date();
    proposal.approvedBy = undefined;
    proposal.approvedAt = undefined;
    proposal.approvalNotes = reason || "Rejected by admin";

    await proposal.save();

    const updated = await CodingProblem.findById(proposal._id)
      .populate("createdBy", "name username")
      .lean();

    res.json({
      success: true,
      data: {
        proposal: formatProposalSummary(updated),
      },
    });
  })
);

router.get(
  "/problems/:problemId",
  asyncHandler(async (req, res) => {
    await ensureDefaultProblems();

    const problem = await resolveProblemByParam(req.params.problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const statusMap = await getUserProblemStatusMap(req.user._id, [problem._id]);
    const userStatus = statusMap.get(String(problem._id)) || "Unseen";

    res.json({
      success: true,
      data: {
        problem: formatProblemDetail(problem.toObject(), userStatus),
      },
    });
  })
);

router.get(
  "/problems/:problemId/submissions",
  asyncHandler(async (req, res) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
    const includeCode = String(req.query.includeCode || "false") === "true";

    const problem = await resolveProblemByParam(req.params.problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const submissions = await CodingSubmission.find({
      user: req.user._id,
      problem: problem._id,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("problem", "title slug")
      .lean();

    res.json({
      success: true,
      data: {
        submissions: submissions.map((submission) =>
          formatSubmission(submission, includeCode)
        ),
      },
    });
  })
);

router.post(
  "/problems/:problemId/run",
  asyncHandler(async (req, res) => {
    const problem = await resolveProblemByParam(req.params.problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const code = String(req.body.code || "");
    const language = normalizeLanguage(req.body.language || "javascript");
    const customInput = String(req.body.customInput || "");

    if (!code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code is required",
      });
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`,
      });
    }

    const execution = await executeCode({
      sourceCode: code,
      language,
      stdin: customInput,
      cpuTimeLimit: 2,
      wallTimeLimit: 5,
      memoryLimitKb: 262144,
    });

    res.json({
      success: true,
      data: {
        result: {
          status: execution.status,
          stdout: execution.stdout,
          stderr: execution.stderr,
          compileOutput: execution.compileOutput,
          runtimeMs: execution.runtimeMs,
          memoryKb: execution.memoryKb,
        },
      },
    });
  })
);

router.post(
  "/problems/:problemId/submit",
  asyncHandler(async (req, res) => {
    const problem = await resolveProblemByParam(req.params.problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const code = String(req.body.code || "");
    const language = normalizeLanguage(req.body.language || "javascript");

    if (!code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code is required",
      });
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`,
      });
    }

    const publicCases = Array.isArray(problem.publicTestCases)
      ? problem.publicTestCases
      : [];
    const hiddenCases = Array.isArray(problem.hiddenTestCases)
      ? problem.hiddenTestCases
      : [];

    const allCases = [
      ...publicCases.map((testCase) => ({ ...testCase.toObject?.() || testCase, isHidden: false })),
      ...hiddenCases.map((testCase) => ({ ...testCase.toObject?.() || testCase, isHidden: true })),
    ];

    if (allCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No judge test cases configured for this problem",
      });
    }

    let runtimeMs = 0;
    let memoryKb = 0;
    let passedTestCases = 0;
    let finalStatus = "Accepted";
    const testResults = [];

    for (const testCase of allCases) {
      const execution = await executeCode({
        sourceCode: code,
        language,
        stdin: testCase.input,
        expectedOutput: testCase.expectedOutput,
        cpuTimeLimit: 2,
        wallTimeLimit: 5,
        memoryLimitKb: 262144,
      });

      const passed = execution.status === "Accepted";
      if (passed) {
        passedTestCases += 1;
      }

      testResults.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: execution.stdout || execution.stderr || execution.compileOutput,
        passed,
        status: execution.status,
        isHidden: Boolean(testCase.isHidden),
        runtimeMs: execution.runtimeMs,
        memoryKb: execution.memoryKb,
      });

      runtimeMs += execution.runtimeMs;
      memoryKb = Math.max(memoryKb, execution.memoryKb);

      if (!passed) {
        finalStatus = execution.status;
        break;
      }
    }

    if (passedTestCases === allCases.length) {
      finalStatus = "Accepted";
    } else if (!statusRank[finalStatus]) {
      finalStatus = "Wrong Answer";
    }

    const submission = await CodingSubmission.create({
      user: req.user._id,
      problem: problem._id,
      mode: "submit",
      language,
      code,
      status: finalStatus,
      runtimeMs,
      memoryKb,
      passedTestCases,
      totalTestCases: allCases.length,
      testResults,
    });

    const acceptanceInc = {
      "acceptance.totalSubmissions": 1,
    };

    if (finalStatus === "Accepted") {
      acceptanceInc["acceptance.totalAccepted"] = 1;
    }

    await CodingProblem.updateOne({ _id: problem._id }, { $inc: acceptanceInc });

    const populatedSubmission = await CodingSubmission.findById(submission._id)
      .populate("problem", "title slug")
      .lean();

    res.json({
      success: true,
      data: {
        submission: formatSubmission(populatedSubmission, true),
      },
    });
  })
);

router.get(
  "/submissions/me",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

    const [total, submissions] = await Promise.all([
      CodingSubmission.countDocuments({ user: req.user._id }),
      CodingSubmission.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("problem", "title slug difficulty tags")
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        submissions: submissions.map((submission) => formatSubmission(submission)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  })
);

router.get(
  "/problems/:problemId/discussions",
  asyncHandler(async (req, res) => {
    const problem = await resolveProblemByParam(req.params.problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const discussions = await CodingDiscussion.find({ problem: problem._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "name username profilePicture")
      .populate("replies.user", "name username profilePicture")
      .lean();

    const items = discussions.map((discussion) => ({
      id: String(discussion._id),
      content: discussion.content,
      user: discussion.user,
      likes: Array.isArray(discussion.likes) ? discussion.likes.map(String) : [],
      likeCount: Array.isArray(discussion.likes) ? discussion.likes.length : 0,
      replies: Array.isArray(discussion.replies)
        ? discussion.replies.map((reply) => ({
            id: String(reply._id),
            user: reply.user,
            content: reply.content,
            createdAt: reply.createdAt,
          }))
        : [],
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        discussions: items,
      },
    });
  })
);

router.post(
  "/problems/:problemId/discussions",
  asyncHandler(async (req, res) => {
    const problem = await resolveProblemByParam(req.params.problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const content = String(req.body.content || "").trim();
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Discussion content is required",
      });
    }

    const discussion = await CodingDiscussion.create({
      problem: problem._id,
      user: req.user._id,
      content,
    });

    const populated = await CodingDiscussion.findById(discussion._id)
      .populate("user", "name username profilePicture")
      .lean();

    res.status(201).json({
      success: true,
      data: {
        discussion: {
          id: String(populated._id),
          content: populated.content,
          user: populated.user,
          likes: [],
          likeCount: 0,
          replies: [],
          createdAt: populated.createdAt,
          updatedAt: populated.updatedAt,
        },
      },
    });
  })
);

router.post(
  "/discussions/:discussionId/like",
  asyncHandler(async (req, res) => {
    const discussion = await CodingDiscussion.findById(req.params.discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const userId = String(req.user._id);
    const alreadyLiked = discussion.likes.some((entry) => String(entry) === userId);

    if (alreadyLiked) {
      discussion.likes = discussion.likes.filter((entry) => String(entry) !== userId);
    } else {
      discussion.likes.push(req.user._id);
    }

    await discussion.save();

    res.json({
      success: true,
      data: {
        isLiked: !alreadyLiked,
        likeCount: discussion.likes.length,
      },
    });
  })
);

router.post(
  "/discussions/:discussionId/replies",
  asyncHandler(async (req, res) => {
    const discussion = await CodingDiscussion.findById(req.params.discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const content = String(req.body.content || "").trim();
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    discussion.replies.push({
      user: req.user._id,
      content,
    });

    await discussion.save();

    const updated = await CodingDiscussion.findById(discussion._id)
      .populate("replies.user", "name username profilePicture")
      .lean();

    const latestReply = updated.replies[updated.replies.length - 1];

    res.status(201).json({
      success: true,
      data: {
        reply: {
          id: String(latestReply._id),
          user: latestReply.user,
          content: latestReply.content,
          createdAt: latestReply.createdAt,
        },
      },
    });
  })
);

router.get(
  "/problems/:problemId/editorial",
  asyncHandler(async (req, res) => {
    const problem = await resolveProblemByParam(req.params.problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    res.json({
      success: true,
      data: {
        editorial: {
          content: problem.editorial?.content || "",
          codeExamples: toPlainMap(problem.editorial?.codeExamples),
        },
      },
    });
  })
);

router.get(
  "/progress/me",
  asyncHandler(async (req, res) => {
    const [allSubmissions, acceptedSubmissions] = await Promise.all([
      CodingSubmission.find({ user: req.user._id })
        .select("problem status createdAt")
        .lean(),
      CodingSubmission.find({ user: req.user._id, status: "Accepted" })
        .select("problem createdAt")
        .lean(),
    ]);

    const totalSubmissions = allSubmissions.length;
    const acceptedCount = acceptedSubmissions.length;
    const attemptedProblemIds = Array.from(
      new Set(allSubmissions.map((submission) => String(submission.problem)))
    );
    const solvedProblemIds = Array.from(
      new Set(acceptedSubmissions.map((submission) => String(submission.problem)))
    );

    const solvedProblems = await CodingProblem.find({
      _id: { $in: solvedProblemIds },
    })
      .select("difficulty")
      .lean();

    const difficultyBreakdown = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };

    solvedProblems.forEach((problem) => {
      if (difficultyBreakdown[problem.difficulty] !== undefined) {
        difficultyBreakdown[problem.difficulty] += 1;
      }
    });

    const streak = computeStreak(acceptedSubmissions);
    const accuracy =
      totalSubmissions > 0
        ? Number(((acceptedCount / totalSubmissions) * 100).toFixed(2))
        : 0;

    const heatmapLookup = acceptedSubmissions.reduce((acc, submission) => {
      const key = toDateKey(submission.createdAt);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const heatmap = [];
    const days = 84;
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = toDateKey(date);
      heatmap.push({
        date: key,
        count: Number(heatmapLookup[key] || 0),
      });
    }

    res.json({
      success: true,
      data: {
        progress: {
          solvedProblems: solvedProblemIds.length,
          attemptedProblems: attemptedProblemIds.length,
          totalSubmissions,
          acceptedSubmissions: acceptedCount,
          accuracy,
          streak,
          difficultyBreakdown,
          heatmap,
        },
      },
    });
  })
);

router.get(
  "/contests",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        contests: [],
      },
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    await ensureDefaultProblems();

    res.json({
      success: true,
      data: {
        message: "Coding platform API is ready",
      },
    });
  })
);

module.exports = router;

