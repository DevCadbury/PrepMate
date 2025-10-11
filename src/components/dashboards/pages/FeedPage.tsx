import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Image,
  Video,
  FileText,
  Code,
  Smile,
  Send,
  Award,
} from "lucide-react";

const FeedPage: React.FC<{ user: any }> = ({ user }) => {
  const [posts, setPosts] = useState([
    {
      id: "1",
      author: {
        name: "Sarah Johnson",
        username: "sarah_dev",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        role: "Senior Frontend Developer",
        company: "TechCorp",
        verified: true,
      },
      content:
        "Just completed my first React project! 🎉\n\nAfter months of learning, I finally built a full-stack application using React, Node.js, and MongoDB. The journey has been incredible!\n\nKey features:\n✅ User authentication\n✅ Real-time chat\n✅ File uploads\n✅ Responsive design\n\n#React #JavaScript #WebDevelopment",
      media: {
        type: "image",
        url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop",
        caption: "My project dashboard",
      },
      tags: ["react", "javascript", "frontend"],
      category: "achievement",
      likes: 24,
      comments: 8,
      shares: 3,
      isLiked: false,
      isSaved: false,
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      author: {
        name: "Alex Chen",
        username: "alex_chen",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        role: "Full Stack Engineer",
        company: "StartupXYZ",
        verified: false,
      },
      content:
        "Question for the community: What's your preferred state management solution for large React applications?\n\nI've been using Redux Toolkit for a while, but I'm curious about alternatives like Zustand, Jotai, or even the new React Server Components approach.\n\nWhat are your experiences? Pros and cons?",
      tags: ["react", "state-management", "redux"],
      category: "question",
      likes: 15,
      comments: 23,
      shares: 5,
      isLiked: true,
      isSaved: false,
      createdAt: "2024-01-15T09:15:00Z",
    },
  ]);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({ content: "", category: "general" });

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleSave = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, isSaved: !post.isSaved } : post
      )
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Feed</h1>

      {/* Create Post Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground"
                  >
                    What's on your mind?
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create a Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>
                          {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user?.name}</p>
                        <Select
                          value={newPost.category}
                          onValueChange={(value) =>
                            setNewPost({ ...newPost, category: value })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">📝 General</SelectItem>
                            <SelectItem value="achievement">
                              🏆 Achievement
                            </SelectItem>
                            <SelectItem value="question">
                              ❓ Question
                            </SelectItem>
                            <SelectItem value="resource">
                              📚 Resource
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Textarea
                      placeholder="Share your thoughts, achievements, or questions..."
                      value={newPost.content}
                      onChange={(e) =>
                        setNewPost({ ...newPost, content: e.target.value })
                      }
                      className="min-h-[120px]"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Image className="h-4 w-4 mr-2" />
                          Photo
                        </Button>
                        <Button variant="outline" size="sm">
                          <Video className="h-4 w-4 mr-2" />
                          Video
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          File
                        </Button>
                        <Button variant="outline" size="sm">
                          <Code className="h-4 w-4 mr-2" />
                          Code
                        </Button>
                        <Button variant="outline" size="sm">
                          <Smile className="h-4 w-4 mr-2" />
                          Sticker
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreatePost(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCreatePost(false);
                          setNewPost({ content: "", category: "general" });
                        }}
                      >
                        Post
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>
                      {post.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-base">
                        {post.author.name}
                      </h3>
                      {post.author.verified && (
                        <Badge variant="secondary" className="text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{post.author.username}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{post.author.role}</span>
                      {post.author.company && (
                        <span>• {post.author.company}</span>
                      )}
                      <span>• {formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Report</DropdownMenuItem>
                    <DropdownMenuItem>Copy link</DropdownMenuItem>
                    <DropdownMenuItem>
                      Follow {post.author.name}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Post content */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {post.content}
                </div>

                {/* Media */}
                {post.media && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={post.media.url}
                      alt={post.media.caption || "Post image"}
                      className="w-full h-64 object-cover"
                    />
                    {post.media.caption && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {post.media.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Engagement stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <span>{post.likes} likes</span>
                    <span>{post.comments} comments</span>
                    <span>{post.shares} shares</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {post.category === "achievement" && (
                      <Award className="h-4 w-4 text-yellow-500" />
                    )}
                    {post.category === "question" && (
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                    )}
                    {post.category === "resource" && (
                      <FileText className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(post.id)}
                            className={post.isLiked ? "text-red-500" : ""}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                post.isLiked ? "fill-current" : ""
                              }`}
                            />
                            <span className="ml-1">{post.likes}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{post.isLiked ? "Unlike" : "Like"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowComments(
                                showComments === post.id ? null : post.id
                              )
                            }
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="ml-1">{post.comments}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Comment</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                            <span className="ml-1">{post.shares}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Share</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSave(post.id)}
                          className={post.isSaved ? "text-blue-500" : ""}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${
                              post.isSaved ? "fill-current" : ""
                            }`}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{post.isSaved ? "Saved" : "Save"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Comments section */}
                {showComments === post.id && (
                  <div className="pt-4 border-t">
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback>
                            {user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input
                            placeholder="Write a comment..."
                            className="text-sm"
                          />
                        </div>
                        <Button size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Sample comments */}
                      <div className="space-y-2">
                        <div className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" />
                            <AvatarFallback>J</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm">
                                  John Doe
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  2h ago
                                </span>
                              </div>
                              <p className="text-sm">
                                Great work! What tech stack did you use?
                              </p>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <button className="hover:text-foreground">
                                Like
                              </button>
                              <button className="hover:text-foreground">
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">Load More Posts</Button>
      </div>
    </div>
  );
};

export default FeedPage;
