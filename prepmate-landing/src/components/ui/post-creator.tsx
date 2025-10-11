import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image, Video, Music, File, Code, Upload, X } from "lucide-react";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { useToast } from "./toast";
import { useAuth } from "../../contexts/AuthContext";

interface MediaItem {
  type: "image" | "video" | "audio" | "file";
  url: string;
  file: File;
  filename?: string;
  size?: string;
}

interface PostCreatorProps {
  onPostCreated?: (post: any) => void;
  placeholder?: string;
  className?: string;
}

const PostCreator: React.FC<PostCreatorProps> = ({
  onPostCreated,
  placeholder = "What's on your mind?",
  className = "",
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [postType, setPostType] = useState<
    "text" | "code" | "media" | "achievement" | "question" | "resource"
  >("text");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor content changes to detect if JSX code is being set programmatically
  useEffect(() => {
    if (content && content.length > 100 && postType !== "code") {
      const jsxPattern =
        /<[A-Z][a-zA-Z]*\s|className=|onClick=|onChange=|useState|useEffect|import\s|export\s|function\s|const\s|let\s|var\s/;
      if (jsxPattern.test(content)) {
        console.log("=== WARNING: JSX CODE DETECTED IN CONTENT ===");
        console.log("Content length:", content.length);
        console.log("Content preview:", content.substring(0, 200) + "...");
        console.log(
          "This might indicate content is being set programmatically"
        );

        // Clear the content and show a helpful message
        setContent("");
        error(
          "Code detected",
          "I detected code in your post. I've cleared it for you. Please write your thoughts in plain text instead."
        );
      }
    }
  }, [content, postType]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const type = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
          ? "audio"
          : "file";

        const mediaItem: MediaItem = {
          type,
          url,
          file,
          filename: file.name,
          size: formatFileSize(file.size),
        };

        setMedia((prev) => [...prev, mediaItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async () => {
    console.log("=== HANDLE SUBMIT CALLED ===");
    console.log("Content:", content);
    console.log("Content length:", content.length);
    console.log("Content trimmed:", content.trim());
    console.log("Content trimmed length:", content.trim().length);
    console.log("Media length:", media.length);
    console.log("Post type:", postType);

    if (!content.trim() && media.length === 0) {
      console.log("Validation failed: Empty post");
      error("Empty post", "Please add some content to your post.");
      return;
    }

    // Validate content to prevent JSX/HTML code from being submitted
    const jsxPattern =
      /<[A-Z][a-zA-Z]*\s|className=|onClick=|onChange=|useState|useEffect|import\s|export\s|function\s|const\s|let\s|var\s/;
    if (postType !== "code" && jsxPattern.test(content)) {
      console.log("Validation failed: JSX/HTML code detected");
      console.log("Content that triggered validation:", content);
      console.log("JSX pattern matched:", jsxPattern.test(content));
      error(
        "Invalid content",
        "Please don't paste code or JSX. Write your thoughts in plain text."
      );
      return;
    }

    console.log("Validation passed, proceeding with submission");

    setIsSubmitting(true);
    try {
      console.log("=== FRONTEND: CREATING POST ===");
      console.log("Content:", content);
      console.log("Type:", postType);
      console.log("Tags:", tags);
      console.log("Media count:", media.length);

      // Handle code snippets properly
      let finalContent = content;
      if (postType === "code" && content.trim()) {
        // Create a structured code snippet
        const codeSnippet = {
          language: "javascript", // Default, can be enhanced with language detection
          code: content,
          filename: "code.js",
        };
        finalContent = JSON.stringify([codeSnippet]);
      }

      const formData = new FormData();
      formData.append("content", finalContent);
      formData.append("type", postType);

      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
      }

      media.forEach((item) => {
        formData.append(`media`, item.file);
      });

      const response = await fetch("http://localhost:5000/api/social/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        success("Post created!", "Your post has been published.");

        // Reset form
        setContent("");
        setMedia([]);
        setTags([]);
        setPostType("text");

        onPostCreated?.(data.post || data);
      } else {
        const errorData = await response.json();
        error(
          "Failed to create post",
          errorData.message || "Please try again."
        );
      }
    } catch (error: any) {
      error("Failed to create post", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      case "file":
        return <File className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-2xl ${className}`}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {user?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a new post
            </p>
          </div>
        </div>

        {/* Post Type Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: "text", label: "Text", icon: "📝" },
            { id: "code", label: "Code", icon: "💻" },
            { id: "media", label: "Media", icon: "📷" },
            { id: "achievement", label: "Achievement", icon: "🏆" },
            { id: "question", label: "Question", icon: "❓" },
            { id: "resource", label: "Resource", icon: "📚" },
          ].map((type) => (
            <Button
              key={type.id}
              variant={postType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setPostType(type.id as any)}
              className="text-xs"
            >
              <span className="mr-1">{type.icon}</span>
              {type.label}
            </Button>
          ))}
        </div>

        {/* Content Input */}
        <div className="mb-4">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              rows={4}
            />
            {content && (
              <button
                onClick={() => setContent("")}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Clear content"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            💡 Tip: Write your thoughts in plain text. Don't paste code or JSX
            here.
          </p>
        </div>

        {/* Media Upload */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Add Media</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Code className="h-4 w-4" />
              <span>Add Code</span>
            </Button>
          </div>
        </div>

        {/* Media Preview */}
        <AnimatePresence>
          {media.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 space-y-2"
            >
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Media ({media.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {media.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        {getMediaIcon(item.type)}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {item.filename}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20"
                onClick={() => removeTag(tag)}
              >
                #{tag} <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add tags (press Enter)"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                const tag = e.currentTarget.value.trim();
                if (tag) {
                  addTag(tag);
                  e.currentTarget.value = "";
                }
              }
            }}
            className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && media.length === 0)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            title={`Submit button - Content: "${content}", Media: ${
              media.length
            }, Disabled: ${
              isSubmitting || (!content.trim() && media.length === 0)
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Posting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Post</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCreator;
