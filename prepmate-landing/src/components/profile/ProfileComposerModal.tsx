import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Image as ImageIcon, Code, Hash, Send, Loader2, Trash2 } from "lucide-react";
import { apiClient } from "../../lib/apiClient";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/toast";
import { cn } from "../../lib/utils";

interface ProfileComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

const LANGUAGES = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust",
  "ruby", "php", "swift", "kotlin", "html", "css", "sql", "bash",
];

const ProfileComposerModal: React.FC<ProfileComposerModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Auto-grow textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 300) + "px";
  };

  // Ctrl/Cmd + Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Image handling
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError("File too large", "Maximum file size is 5MB.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Tag handling
  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // Auto-detect hashtags from content
  useEffect(() => {
    const matches = content.match(/#(\w+)/g);
    if (matches) {
      const newTags = matches.map((m) => m.replace("#", "")).filter((t) => !tags.includes(t));
      if (newTags.length > 0) {
        setTags((prev) => [...new Set([...prev, ...newTags])].slice(0, 5));
      }
    }
  }, [content]);

  // Submit
  const handleSubmit = async () => {
    if (!content.trim() && !imagePreview && !codeSnippet.trim()) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("type", codeSnippet ? "code" : imageFile ? "media" : "text");
      if (tags.length) formData.append("tags", JSON.stringify(tags));
      if (codeSnippet.trim()) formData.append("codeSnippet", codeSnippet);
      if (codeSnippet.trim()) formData.append("codeLanguage", codeLanguage);
      if (imageFile) formData.append("media", imageFile);

      const res = await apiClient.fetch("/social/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onPostCreated(data.data?.post || data.post || data);
        success("Post published!", "Your post is now live.");
        resetForm();
        onClose();
      } else {
        const err = await res.json().catch(() => ({ message: "Something went wrong." }));
        showError("Post failed", err.message);
      }
    } catch {
      showError("Network error", "Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent("");
    setImagePreview(null);
    setImageFile(null);
    setCodeSnippet("");
    setShowCodeInput(false);
    setTags([]);
    setTagInput("");
    setShowTagInput(false);
  };

  const hasContent = content.trim() || imagePreview || codeSnippet.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          >
            <div
              className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-0">
                <h2 className="text-lg font-bold text-foreground">Create Post</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground transition-colors active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User info */}
              <div className="flex items-center gap-3 px-5 pt-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-accent border border-border/50 flex-shrink-0">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">{user?.name}</p>
                  <p className="text-[12px] text-muted-foreground">Visible to everyone</p>
                </div>
              </div>

              {/* Content Area */}
              <div className="px-5 pt-4 pb-2">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="What's on your mind? Share knowledge, code, or insights..."
                  className="w-full bg-transparent border-0 text-[15px] text-foreground placeholder:text-muted-foreground leading-relaxed resize-none focus:outline-none min-h-[120px]"
                  rows={4}
                />

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative rounded-xl overflow-hidden border border-border/50 mb-3">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-[240px] object-cover" />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Code Snippet Input */}
                <AnimatePresence>
                  {showCodeInput && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-3"
                    >
                      <div className="bg-[#0d1117] rounded-xl border border-gray-800 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
                          <select
                            value={codeLanguage}
                            onChange={(e) => setCodeLanguage(e.target.value)}
                            className="bg-transparent text-gray-400 text-[12px] border-0 focus:outline-none cursor-pointer"
                          >
                            {LANGUAGES.map((lang) => (
                              <option key={lang} value={lang}>{lang}</option>
                            ))}
                          </select>
                          <button onClick={() => { setShowCodeInput(false); setCodeSnippet(""); }} className="text-gray-500 hover:text-gray-300 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          value={codeSnippet}
                          onChange={(e) => setCodeSnippet(e.target.value)}
                          placeholder="Paste your code here..."
                          className="w-full bg-transparent text-gray-300 text-[13px] font-mono p-3 resize-none focus:outline-none min-h-[100px]"
                          rows={5}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tags */}
                {(tags.length > 0 || showTagInput) && (
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[12px] font-semibold">
                        #{tag}
                        <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {showTagInput && (
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={addTag}
                        placeholder="Add tag..."
                        className="bg-transparent text-[12px] text-foreground w-20 focus:outline-none placeholder:text-muted-foreground"
                        autoFocus
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Footer Toolbar */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-border/40">
                <div className="flex gap-1">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-blue-500 transition-colors text-[13px] font-semibold"
                  >
                    <ImageIcon className="w-4 h-4" /> Media
                  </button>
                  <button
                    onClick={() => setShowCodeInput(!showCodeInput)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-[13px] font-semibold ${showCodeInput ? "text-indigo-500 bg-indigo-500/10" : "text-muted-foreground hover:text-indigo-500"}`}
                  >
                    <Code className="w-4 h-4" /> Code
                  </button>
                  <button
                    onClick={() => setShowTagInput(!showTagInput)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-[13px] font-semibold ${showTagInput ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground hover:text-blue-500"}`}
                  >
                    <Hash className="w-4 h-4" /> Tags
                  </button>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!hasContent || isSubmitting}
                  className="font-bold text-[13px] rounded-xl h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </div>

              {/* Keyboard hint */}
              <div className="px-5 pb-3">
                <p className="text-[11px] text-muted-foreground/60 text-right">Ctrl + Enter to post</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileComposerModal;
