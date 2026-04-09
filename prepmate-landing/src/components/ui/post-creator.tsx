import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Image,
  Music,
  File,
  Code,
  Upload,
  X,
  MessageSquare,
  Hash,
  Trophy,
  FileText,
  Loader2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { useToast } from "./toast";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";
import { apiClient } from "../../lib/apiClient";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MediaItem {
  type: "image" | "video" | "audio" | "document";
  url: string;
  file: File;
  filename?: string;
  size?: string;
}

interface MentionUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface ActiveMention {
  query: string;
  start: number;
  end: number;
}

interface PostCreatedMeta {
  optimistic?: boolean;
  replaceId?: string;
  removeId?: string;
}

type PostType = "text" | "code" | "media" | "achievement" | "question" | "resource";

interface PostCreatorProps {
  onPostCreated?: (post: any, meta?: PostCreatedMeta) => void;
  placeholder?: string;
  className?: string;
}

interface CategoryOption {
  id: string;
  label: string;
  backendCategory:
    | "general"
    | "tech"
    | "education"
    | "career"
    | "interview"
    | "coding"
    | "roadmap"
    | "achievement";
  tag: string;
}

const SUPPORTED_CODE_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "go",
  "rust",
  "sql",
  "bash",
];

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: "dsa", label: "DSA", backendCategory: "coding", tag: "dsa" },
  { id: "web-dev", label: "Web Dev", backendCategory: "tech", tag: "webdev" },
  { id: "ai-ml", label: "AI/ML", backendCategory: "tech", tag: "aiml" },
  { id: "projects", label: "Projects", backendCategory: "roadmap", tag: "projects" },
  {
    id: "interview-prep",
    label: "Interview Prep",
    backendCategory: "interview",
    tag: "interviewprep",
  },
];

const FORMAT_ACTIONS = [
  { id: "bold", label: "Bold", icon: <Bold className="h-3.5 w-3.5" /> },
  { id: "italic", label: "Italic", icon: <Italic className="h-3.5 w-3.5" /> },
  { id: "underline", label: "Underline", icon: <Underline className="h-3.5 w-3.5" /> },
  { id: "bullet", label: "Bullets", icon: <List className="h-3.5 w-3.5" /> },
  {
    id: "numbered",
    label: "Numbered list",
    icon: <ListOrdered className="h-3.5 w-3.5" />,
  },
  { id: "quote", label: "Quote", icon: <Quote className="h-3.5 w-3.5" /> },
  { id: "inlineCode", label: "Inline code", icon: <Code className="h-3.5 w-3.5" /> },
  {
    id: "codeBlock",
    label: "Code block",
    icon: <FileText className="h-3.5 w-3.5" />,
  },
] as const;

type FormatActionId = (typeof FORMAT_ACTIONS)[number]["id"];

const getMediaType = (file: File): MediaItem["type"] => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

const extractMentions = (value: string) => {
  const usernames = value.match(/@([a-zA-Z0-9_]{2,30})/g) || [];
  return Array.from(new Set(usernames.map((match) => match.replace("@", ""))));
};

const extractHashtags = (value: string) => {
  const hashtags = value.match(/#([a-zA-Z0-9_]{1,50})/g) || [];
  return Array.from(new Set(hashtags.map((match) => match.replace("#", "").toLowerCase())));
};

const PostCreator: React.FC<PostCreatorProps> = ({
  onPostCreated,
  placeholder = "Share something valuable... (idea, project, code, or learning)",
  className,
}) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [content, setContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const [codeFilename, setCodeFilename] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostType>("text");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [copiedSnippetPreview, setCopiedSnippetPreview] = useState(false);

  const [mentionSuggestions, setMentionSuggestions] = useState<MentionUser[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [activeMention, setActiveMention] = useState<ActiveMention | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const codeRef = useRef<HTMLTextAreaElement | null>(null);
  const mentionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousMediaRef = useRef<MediaItem[]>([]);

  const categoryTags = useMemo(() => {
    return selectedCategories
      .map((categoryId) => CATEGORY_OPTIONS.find((option) => option.id === categoryId)?.tag)
      .filter((value): value is string => Boolean(value));
  }, [selectedCategories]);

  const detectedHashtags = useMemo(() => extractHashtags(content), [content]);
  const mergedTags = useMemo(
    () => Array.from(new Set([...manualTags, ...detectedHashtags, ...categoryTags])),
    [categoryTags, detectedHashtags, manualTags]
  );

  const selectedCategoryDetails = useMemo(() => {
    return selectedCategories
      .map((categoryId) => CATEGORY_OPTIONS.find((option) => option.id === categoryId))
      .filter((value): value is CategoryOption => Boolean(value));
  }, [selectedCategories]);

  const resolvePostCategory = useCallback(() => {
    const firstSelected = selectedCategoryDetails[0];
    if (firstSelected) {
      return firstSelected.backendCategory;
    }

    if (postType === "code") return "coding";
    if (postType === "question") return "interview";
    if (postType === "achievement") return "achievement";
    if (postType === "resource") return "education";
    return "general";
  }, [postType, selectedCategoryDetails]);

  const resizeTextarea = (textarea: HTMLTextAreaElement | null, maxHeight = 280) => {
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  useEffect(() => {
    resizeTextarea(contentRef.current, 260);
  }, [content, isFocused]);

  useEffect(() => {
    resizeTextarea(codeRef.current, 360);
  }, [codeSnippet, postType]);

  useEffect(() => {
    const previousMedia = previousMediaRef.current;
    previousMedia.forEach((item) => {
      if (!media.some((current) => current.url === item.url)) {
        URL.revokeObjectURL(item.url);
      }
    });
    previousMediaRef.current = media;
  }, [media]);

  useEffect(() => {
    return () => {
      previousMediaRef.current.forEach((item) => URL.revokeObjectURL(item.url));
      if (mentionDebounceRef.current) {
        clearTimeout(mentionDebounceRef.current);
      }
    };
  }, []);

  const loadMentionSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setMentionSuggestions([]);
      return;
    }

    setMentionLoading(true);
    try {
      const response = await apiClient.fetch(
        `/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const payload = await response.json();
      setMentionSuggestions(Array.isArray(payload?.data?.users) ? payload.data.users : []);
    } catch {
      setMentionSuggestions([]);
    } finally {
      setMentionLoading(false);
    }
  }, []);

  const detectActiveMention = (value: string, selectionStart: number) => {
    const textBeforeCursor = value.slice(0, selectionStart);
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]{1,30})$/);

    if (!match) {
      setActiveMention(null);
      setMentionSuggestions([]);
      return;
    }

    const query = match[1];
    const mentionStart = selectionStart - query.length - 1;
    const mentionEnd = selectionStart;
    setActiveMention({ query, start: mentionStart, end: mentionEnd });

    if (mentionDebounceRef.current) {
      clearTimeout(mentionDebounceRef.current);
    }
    mentionDebounceRef.current = setTimeout(() => {
      void loadMentionSuggestions(query);
    }, 180);
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setContent(value);
    detectActiveMention(value, event.target.selectionStart || value.length);
  };

  const applyMentionSuggestion = (selectedUser: MentionUser) => {
    if (!activeMention) return;

    const replacement = `@${selectedUser.username} `;
    const updated =
      content.slice(0, activeMention.start) + replacement + content.slice(activeMention.end);
    const nextCursor = activeMention.start + replacement.length;

    setContent(updated);
    setMentionSuggestions([]);
    setActiveMention(null);

    requestAnimationFrame(() => {
      contentRef.current?.focus();
      contentRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const attachFiles = (files: File[]) => {
    if (!files || files.length === 0) return;

    const rejected = files.filter((file) => file.size > 25 * 1024 * 1024);
    if (rejected.length > 0) {
      showError("Some files were skipped", "Each file must be 25 MB or less.");
    }

    const acceptedFiles = files.filter((file) => file.size <= 25 * 1024 * 1024);
    if (acceptedFiles.length === 0) {
      return;
    }

    const uploaded = acceptedFiles.map((file) => ({
      type: getMediaType(file),
      url: URL.createObjectURL(file),
      file,
      filename: file.name,
      size: formatFileSize(file.size),
    }));

    setMedia((prev) => [...prev, ...uploaded]);
    setIsFocused(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    attachFiles(files);
    event.target.value = "";
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDraggingFiles) {
      setIsDraggingFiles(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDraggingFiles(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFiles(false);
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    attachFiles(droppedFiles);
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, mediaIndex) => mediaIndex !== index));
  };

  const addManualTag = (rawTag: string) => {
    const sanitized = rawTag.trim().replace(/^#/, "").toLowerCase();
    if (!sanitized || manualTags.includes(sanitized)) return;
    setManualTags((prev) => [...prev, sanitized]);
  };

  const removeTag = (tag: string) => {
    setManualTags((prev) => prev.filter((current) => current !== tag));
  };

  const resetComposer = () => {
    setContent("");
    setCodeSnippet("");
    setCodeFilename("");
    setCodeLanguage("typescript");
    setMedia([]);
    setManualTags([]);
    setSelectedCategories([]);
    setTagDraft("");
    setMentionSuggestions([]);
    setActiveMention(null);
    setPostType("text");
    setIsFocused(false);
  };

  const canSubmit =
    postType === "code"
      ? Boolean(codeSnippet.trim())
      : Boolean(content.trim() || media.length > 0);

  const applyTextFormatting = (action: FormatActionId) => {
    const textarea = contentRef.current;
    const selectionStart = textarea?.selectionStart ?? content.length;
    const selectionEnd = textarea?.selectionEnd ?? content.length;
    const selectedText = content.slice(selectionStart, selectionEnd);

    const singleLineFallback = selectedText || "text";
    const multilineFallback = selectedText || "List item";
    let replacement = selectedText;

    switch (action) {
      case "bold":
        replacement = `**${singleLineFallback}**`;
        break;
      case "italic":
        replacement = `*${singleLineFallback}*`;
        break;
      case "underline":
        replacement = `__${singleLineFallback}__`;
        break;
      case "bullet": {
        const lines = multilineFallback.split("\n");
        replacement = lines
          .map((line) => `- ${line.replace(/^[-*]\s+/, "")}`)
          .join("\n");
        break;
      }
      case "numbered": {
        const lines = multilineFallback.split("\n");
        replacement = lines
          .map((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s+/, "")}`)
          .join("\n");
        break;
      }
      case "quote": {
        const lines = multilineFallback.split("\n");
        replacement = lines.map((line) => `> ${line.replace(/^>\s?/, "")}`).join("\n");
        break;
      }
      case "inlineCode":
        replacement = `\`${singleLineFallback}\``;
        break;
      case "codeBlock":
        replacement = `\`\`\`\n${selectedText || "code"}\n\`\`\``;
        break;
      default:
        break;
    }

    const nextContent =
      content.slice(0, selectionStart) + replacement + content.slice(selectionEnd);
    const nextCursor = selectionStart + replacement.length;

    setContent(nextContent);
    setIsFocused(true);

    requestAnimationFrame(() => {
      contentRef.current?.focus();
      contentRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      showError("Nothing to post", "Add text, code, or media before publishing.");
      return;
    }

    const nonCodeContentPattern =
      /<[A-Z][a-zA-Z]*\s|className=|onClick=|onChange=|useState|useEffect|import\s|export\s|function\s|const\s|let\s|var\s/;
    if (postType !== "code" && nonCodeContentPattern.test(content)) {
      showError("Invalid content", "Plain-text posts cannot contain JSX or code blocks.");
      return;
    }

    setIsSubmitting(true);
    const optimisticPostId = `temp-${Date.now()}`;

    const optimisticPost = {
      _id: optimisticPostId,
      content:
        postType === "code"
          ? content.trim() || `Shared a ${codeLanguage} snippet`
          : content.trim(),
      type: postType,
      media: media.map((item) => ({
        type: item.type,
        url: item.url,
        filename: item.filename,
        size: item.file.size,
      })),
      codeSnippets:
        postType === "code"
          ? [
              {
                language: codeLanguage,
                code: codeSnippet,
                filename: codeFilename.trim() || undefined,
              },
            ]
          : [],
      user: {
        _id: user?.id,
        name: user?.name,
        username: user?.username || "you",
        profilePicture: user?.profilePicture,
      },
      likes: [],
      comments: [],
      shares: [],
      bookmarks: [],
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      bookmarkCount: 0,
      tags: mergedTags,
      createdAt: new Date().toISOString(),
    };

    onPostCreated?.(optimisticPost, { optimistic: true });

    try {
      const formData = new FormData();
      const mentions = extractMentions(content);
      const hashtags = mergedTags;
      const category = resolvePostCategory();

      if (postType === "code") {
        const codePayload = [
          {
            language: codeLanguage,
            code: codeSnippet,
            filename: codeFilename.trim() || undefined,
            description: content.trim() || undefined,
          },
        ];
        formData.append("content", JSON.stringify(codePayload));
      } else {
        formData.append("content", content);
      }

      formData.append("type", postType);
      formData.append("category", category);

      if (hashtags.length > 0) {
        formData.append("tags", JSON.stringify(hashtags));
        formData.append("hashtags", JSON.stringify(hashtags));
      }
      if (mentions.length > 0) {
        formData.append("mentions", JSON.stringify(mentions));
      }

      media.forEach((item) => {
        formData.append("media", item.file);
      });

      const response = await apiClient.fetch("/social/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to create post");
      }

      success("Post published", "Your post is live in the feed.");
      resetComposer();
      onPostCreated?.(payload?.post || payload?.data?.post || payload, {
        replaceId: optimisticPostId,
      });
    } catch (err: any) {
      onPostCreated?.(null, { removeId: optimisticPostId });
      showError("Publish failed", err?.message || "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const typeOptions: Array<{ id: PostType; label: string; icon: React.ReactNode }> = [
    { id: "text", label: "Update", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: "question", label: "Question", icon: <Hash className="h-3.5 w-3.5" /> },
    { id: "code", label: "Snippet", icon: <Code className="h-3.5 w-3.5" /> },
    { id: "achievement", label: "Win", icon: <Trophy className="h-3.5 w-3.5" /> },
    { id: "resource", label: "Resource", icon: <FileText className="h-3.5 w-3.5" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card to-muted/15 shadow-[0_24px_42px_-30px_rgba(15,23,42,0.65)] transition-all duration-300",
        isFocused && "shadow-[0_28px_48px_-30px_rgba(37,99,235,0.4)] ring-1 ring-social-200",
        isDraggingFiles && "border-social-400 bg-social-50/40",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="h-1 w-full bg-gradient-to-r from-social-500 via-navy-500 to-coding-500" />

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-social-200 bg-social-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-social-700">
            <Sparkles className="h-3.5 w-3.5" />
            Create Post
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Share updates, snippets, resources, and media
          </p>
        </div>

        <div className="flex gap-3.5">
          <Avatar className="mt-1 h-10 w-10 shrink-0 ring-1 ring-border">
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback className="bg-navy-100 font-semibold text-navy-700 text-sm">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="mb-2.5">
              <p className="text-sm font-semibold text-foreground">{user?.name || "You"}</p>
              <p className="text-xs text-muted-foreground">
                Posting as {user?.name || "PrepMate user"}
              </p>
            </div>

            <AnimatePresence initial={false}>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-3 flex flex-wrap gap-1.5"
                >
                  {typeOptions.map((option) => (
                    <Button
                      key={option.id}
                      size="sm"
                      variant={postType === option.id ? "default" : "outline"}
                      className={cn(
                        "h-7 rounded-full px-3 text-xs shadow-sm",
                        postType === option.id && "bg-navy-600 text-white hover:bg-navy-700"
                      )}
                      onClick={() => setPostType(option.id)}
                    >
                      <span className="mr-1.5">{option.icon}</span>
                      {option.label}
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {(isFocused || selectedCategories.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mb-3 flex flex-wrap gap-1.5"
                >
                  {CATEGORY_OPTIONS.map((category) => {
                    const selected = selectedCategories.includes(category.id);
                    return (
                      <Button
                        key={category.id}
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        className={cn(
                          "h-7 rounded-full px-3 text-xs shadow-sm",
                          selected && "bg-social-600 text-white hover:bg-social-700"
                        )}
                        onClick={() => {
                          setSelectedCategories((prev) =>
                            prev.includes(category.id)
                              ? prev.filter((value) => value !== category.id)
                              : [...prev, category.id]
                          );
                          setIsFocused(true);
                        }}
                      >
                        {category.label}
                      </Button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mb-2.5 flex flex-wrap gap-1.5"
                >
                  {FORMAT_ACTIONS.map((action) => (
                    <Button
                      key={action.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-full border-border/70 bg-background px-2 text-xs shadow-sm"
                      onClick={() => applyTextFormatting(action.id)}
                      title={action.label}
                    >
                      {action.icon}
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={cn(
                "relative rounded-2xl border bg-background/85 transition-all duration-200",
                isFocused
                  ? "border-social-400 shadow-[0_18px_36px_-26px_rgba(37,99,235,0.45)]"
                  : "border-border/70 hover:border-border"
              )}
            >
              <textarea
                ref={contentRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleComposerKeyDown}
                onFocus={() => setIsFocused(true)}
                placeholder={postType === "code" ? "Add context for this snippet (optional)" : placeholder}
                className="max-h-[280px] min-h-[96px] w-full resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/80"
              />
              {content.length > 0 && (
                <button
                  type="button"
                  onClick={() => setContent("")}
                  className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <AnimatePresence>
                {activeMention && (mentionLoading || mentionSuggestions.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute left-3 right-3 top-full z-40 mt-2 max-h-52 overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
                  >
                    {mentionLoading ? (
                      <div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Searching users...
                      </div>
                    ) : (
                      mentionSuggestions.map((suggestion) => (
                        <button
                          key={suggestion._id}
                          type="button"
                          onClick={() => applyMentionSuggestion(suggestion)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={suggestion.profilePicture} />
                            <AvatarFallback>
                              {suggestion.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-foreground">
                              {suggestion.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              @{suggestion.username}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {postType === "code" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-muted/30 to-background p-3"
                >
                  <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                    <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CODE_LANGUAGES.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={codeFilename}
                      onChange={(event) => setCodeFilename(event.target.value)}
                      placeholder="Filename (optional)"
                      className="h-9"
                    />
                  </div>

                  <textarea
                    ref={codeRef}
                    value={codeSnippet}
                    onChange={(event) => setCodeSnippet(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Paste or write your code snippet here..."
                    className="max-h-[360px] min-h-[160px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />

                  {codeSnippet.trim() && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-border">
                      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-coding-600" />
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Snippet Preview ({codeLanguage})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(codeSnippet);
                              setCopiedSnippetPreview(true);
                              window.setTimeout(() => setCopiedSnippetPreview(false), 1200);
                              success("Code copied", "Snippet copied to clipboard.");
                            } catch {
                              showError("Copy failed", "Could not copy code snippet.");
                            }
                          }}
                        >
                          {copiedSnippetPreview ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <SyntaxHighlighter
                        language={codeLanguage}
                        style={atomDark}
                        customStyle={{ margin: 0, borderRadius: 0, fontSize: "12px" }}
                      >
                        {codeSnippet}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {(isFocused || mergedTags.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-3"
                >
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {selectedCategoryDetails.map((category) => (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="cursor-pointer border border-social-100 bg-social-50 text-social-700 hover:bg-social-100"
                        onClick={() =>
                          setSelectedCategories((prev) =>
                            prev.filter((current) => current !== category.id)
                          )
                        }
                      >
                        {category.label}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}

                    {mergedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer border border-social-100 bg-social-50 text-social-700 hover:bg-social-100"
                        onClick={() => removeTag(tag)}
                      >
                        #{tag}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                  <Input
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addManualTag(tagDraft);
                        setTagDraft("");
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className="h-9"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {media.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3"
                >
                  {media.map((item, index) => (
                    <div
                      key={`${item.url}-${index}`}
                      className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted/30"
                    >
                      {item.type === "image" ? (
                        <img src={item.url} alt={item.filename} className="h-full w-full object-cover" />
                      ) : item.type === "video" ? (
                        <video src={item.url} className="h-full w-full object-cover" />
                      ) : item.type === "audio" ? (
                        <div className="flex h-full flex-col items-center justify-center p-3 text-center">
                          <Music className="h-5 w-5 text-muted-foreground" />
                          <p className="mt-2 truncate text-[10px] text-muted-foreground">
                            {item.filename}
                          </p>
                          <p className="text-[10px] text-muted-foreground/80">{item.size}</p>
                        </div>
                      ) : item.type === "document" ? (
                        <div className="flex h-full flex-col items-center justify-center p-3 text-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <p className="mt-2 truncate text-[10px] text-muted-foreground">
                            {item.filename}
                          </p>
                          <p className="text-[10px] text-muted-foreground/80">{item.size}</p>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center p-3 text-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <p className="mt-2 truncate text-[10px] text-muted-foreground">
                            {item.filename}
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <p className="absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                        {item.size}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/80 bg-gradient-to-r from-muted/35 via-background to-muted/20 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.zip"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-social-100 text-social-600 hover:bg-social-50"
            onClick={() => fileInputRef.current?.click()}
            title="Add images or videos"
          >
            <Image className="h-4.5 w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full border border-coding-100 text-coding-600 hover:bg-coding-50",
              postType === "code" && "bg-coding-50"
            )}
            onClick={() => {
              setPostType("code");
              setIsFocused(true);
            }}
            title="Code mode"
          >
            <Code className="h-4.5 w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-amber-100 text-amber-600 hover:bg-amber-50"
            onClick={() => fileInputRef.current?.click()}
            title="Attach documents"
          >
            <Upload className="h-4.5 w-4.5" />
          </Button>
          {isDraggingFiles && (
            <span className="ml-2 text-[11px] font-medium text-social-700">
              Drop files to attach
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            Press Ctrl/Cmd + Enter to post
          </p>
          {isFocused && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-full text-xs"
              onClick={resetComposer}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="navy"
            size="sm"
            className="h-9 rounded-full px-5 shadow-md"
            disabled={isSubmitting || !canSubmit}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="mr-1.5 h-4 w-4" />
                Post
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCreator;
