import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Textarea } from "../../ui/textarea";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Separator } from "../../ui/separator";
import { ScrollArea } from "../../ui/scroll-area";
import { Skeleton } from "../../ui/skeleton";
import cloudinaryService from "../../../services/cloudinaryService";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  Building,
  Briefcase,
  Linkedin,
  Github,
  Globe,
  Camera,
  Loader2,
  Edit,
  Save,
  X,
  Heart,
  MessageCircle,
  Eye,
  Trophy,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
  Plus,
  Users,
  UserPlus,
  UserCheck,
  Settings,
  MoreHorizontal,
  Bookmark,
  Lock,
  Unlock,
  CheckCircle,
  Clock,
  UserX,
} from "lucide-react";
import { useToast } from "../../ui/toast";

interface Post {
  id: string;
  content: string;
  type: "question" | "achievement" | "resource" | "interview" | "roadmap";
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

interface ProfileData {
  user: any;
  isProfileOwner: boolean;
  isFollowing: boolean;
  hasFollowRequest: boolean;
  canFollow: boolean;
  isPrivate: boolean;
  canViewPosts: boolean;
  followers: any[];
  following: any[];
  posts: Post[];
}

const ProfilePageEnhanced: React.FC = () => {
  const { user: currentUser, updateProfile } = useAuth();
  const { success, error } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editProfile, setEditProfile] = useState({
    name: currentUser?.name || "",
    location: currentUser?.profile?.location || "",
    bio: currentUser?.profile?.bio || "",
    company: currentUser?.profile?.company || "",
    position: currentUser?.profile?.position || "",
    linkedin: currentUser?.profile?.socialLinks?.linkedin || "",
    github: currentUser?.profile?.socialLinks?.github || "",
    portfolio: currentUser?.profile?.socialLinks?.portfolio || "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [showFollowRequestsDialog, setShowFollowRequestsDialog] =
    useState(false);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchProfileData();
    }
  }, [currentUser]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.data); // The new API returns data in data.data
      } else {
        console.error(
          "Error fetching profile:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/users/follow-requests",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFollowRequests(data.data.followRequests || []);
      }
    } catch (error) {
      console.error("Error fetching follow requests:", error);
    }
  };

  const handleFollow = async () => {
    if (!profileData) return;

    setFollowLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/follow/${profileData.user._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.isFollowRequest) {
          success(
            "Follow request sent!",
            "The user will be notified of your request."
          );
        } else {
          success("Following!", "You are now following this user.");
        }

        // Refresh profile data
        await fetchProfileData();
      } else {
        const errorData = await response.json();
        error("Follow failed", errorData.message || "Please try again.");
      }
    } catch (error: any) {
      console.error("Error following user:", error);
      error("Failed to follow user", "Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAcceptFollowRequest = async (requesterId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/accept-follow-request/${requesterId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        success("Follow request accepted!", "The user is now following you.");
        await fetchFollowRequests();
        await fetchProfileData();
      }
    } catch (error: any) {
      console.error("Error accepting follow request:", error);
      error("Failed to accept request", "Please try again.");
    }
  };

  const handleRejectFollowRequest = async (requesterId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/reject-follow-request/${requesterId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        success("Follow request rejected", "The request has been declined.");
        await fetchFollowRequests();
        await fetchProfileData();
      }
    } catch (error: any) {
      console.error("Error rejecting follow request:", error);
      error("Failed to reject request", "Please try again.");
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const imageUrl = await cloudinaryService.uploadProfilePicture(file);
      await updateProfile({ profilePicture: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: editProfile.name,
          profile: {
            location: editProfile.location,
            bio: editProfile.bio,
            company: editProfile.company,
            position: editProfile.position,
            socialLinks: {
              linkedin: editProfile.linkedin,
              github: editProfile.github,
              portfolio: editProfile.portfolio,
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await updateProfile(data.data.user);
        setShowEditDialog(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                posts: prev.posts.map((post) =>
                  post.id === postId
                    ? {
                        ...post,
                        likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                        isLiked: !post.isLiked,
                      }
                    : post
                ),
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postId}/save`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                posts: prev.posts.map((post) =>
                  post.id === postId
                    ? { ...post, isSaved: !post.isSaved }
                    : post
                ),
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
            <CardContent className="relative p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Profile Picture */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={currentUser?.profilePicture} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {currentUser?.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </motion.div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {profileData?.user?.name || currentUser?.name}
                      </h1>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700"
                        >
                          {profileData?.user?.role || currentUser?.role}
                        </Badge>
                        {profileData?.user?.profile?.location && (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span>{profileData.user.profile.location}</span>
                          </>
                        )}
                        {profileData?.isPrivate && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Lock className="h-3 w-3" />
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!profileData?.isProfileOwner && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={handleFollow}
                            disabled={followLoading || !profileData?.canFollow}
                            className={`${
                              profileData?.isFollowing
                                ? "bg-gray-600 hover:bg-gray-700"
                                : profileData?.hasFollowRequest
                                ? "bg-yellow-600 hover:bg-yellow-700"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            } text-white shadow-lg`}
                          >
                            {followLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : profileData?.isFollowing ? (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Following
                              </>
                            ) : profileData?.hasFollowRequest ? (
                              <>
                                <Clock className="h-4 w-4 mr-2" />
                                Requested
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Follow
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                      {profileData?.isProfileOwner && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => setShowEditDialog(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {currentUser?.profile?.bio && (
                    <p className="text-gray-700 leading-relaxed">
                      {currentUser.profile.bio}
                    </p>
                  )}

                  {/* Social Links */}
                  {(currentUser?.profile?.socialLinks?.linkedin ||
                    currentUser?.profile?.socialLinks?.github ||
                    currentUser?.profile?.socialLinks?.portfolio) && (
                    <div className="flex gap-3">
                      {currentUser.profile.socialLinks?.linkedin && (
                        <motion.a
                          href={currentUser.profile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Linkedin className="h-5 w-5" />
                        </motion.a>
                      )}
                      {currentUser.profile.socialLinks?.github && (
                        <motion.a
                          href={currentUser.profile.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Github className="h-5 w-5" />
                        </motion.a>
                      )}
                      {currentUser.profile.socialLinks?.portfolio && (
                        <motion.a
                          href={currentUser.profile.socialLinks.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          <Globe className="h-5 w-5" />
                        </motion.a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-200"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center cursor-pointer"
                  onClick={() => setShowFollowersDialog(true)}
                >
                  <div className="text-2xl font-bold text-gray-900">
                    {profileData?.followers?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center cursor-pointer"
                  onClick={() => setShowFollowingDialog(true)}
                >
                  <div className="text-2xl font-bold text-gray-900">
                    {profileData?.following?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </motion.div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {profileData?.posts?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                {profileData?.isProfileOwner && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center cursor-pointer"
                    onClick={() => {
                      setShowFollowRequestsDialog(true);
                      fetchFollowRequests();
                    }}
                  >
                    <div className="text-2xl font-bold text-gray-900">
                      {followRequests.length}
                    </div>
                    <div className="text-sm text-gray-600">Requests</div>
                  </motion.div>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 p-1 rounded-lg m-6">
                  <TabsTrigger
                    value="posts"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Posts
                  </TabsTrigger>
                  <TabsTrigger
                    value="achievements"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Achievements
                  </TabsTrigger>
                  <TabsTrigger
                    value="saved"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Saved
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Activity
                  </TabsTrigger>
                </TabsList>

                <div className="px-6 pb-6">
                  <TabsContent value="posts" className="space-y-4">
                    {profileData?.isPrivate && !profileData?.canViewPosts ? (
                      <div className="text-center py-12">
                        <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                          This account is private
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Follow this account to see their posts and activity.
                        </p>
                        {!profileData?.isProfileOwner && (
                          <Button
                            onClick={handleFollow}
                            disabled={followLoading || !profileData?.canFollow}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          >
                            {followLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : profileData?.hasFollowRequest ? (
                              <>
                                <Clock className="h-4 w-4 mr-2" />
                                Request Sent
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Follow
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : profileData?.posts && profileData.posts.length > 0 ? (
                      profileData.posts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={
                                  profileData?.user?.profilePicture ||
                                  currentUser?.profilePicture
                                }
                              />
                              <AvatarFallback>
                                {profileData?.user?.name?.charAt(0) ||
                                  currentUser?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {profileData?.user?.name || currentUser?.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {post.type}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    post.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700">{post.content}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <button
                                  onClick={() => handleLike(post.id)}
                                  className="flex items-center gap-1 hover:text-red-500 transition-colors"
                                >
                                  <Heart
                                    className={`h-4 w-4 ${
                                      post.isLiked
                                        ? "fill-red-500 text-red-500"
                                        : ""
                                    }`}
                                  />
                                  {post.likes}
                                </button>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-4 w-4" />
                                  {post.comments}
                                </div>
                                <button
                                  onClick={() => handleSave(post.id)}
                                  className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                >
                                  <Bookmark
                                    className={`h-4 w-4 ${
                                      post.isSaved
                                        ? "fill-blue-500 text-blue-500"
                                        : ""
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No posts yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="achievements" className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No achievements yet
                      </h3>
                      <p className="text-gray-500">
                        Complete challenges and earn badges!
                      </p>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="saved" className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No saved items
                      </h3>
                      <p className="text-gray-500">
                        Save posts you want to revisit later!
                      </p>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No recent activity
                      </h3>
                      <p className="text-gray-500">
                        Your activity will appear here!
                      </p>
                    </motion.div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Profile Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Profile
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editProfile.name}
                    onChange={(e) =>
                      setEditProfile({ ...editProfile, name: e.target.value })
                    }
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={editProfile.location}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        location: e.target.value,
                      })
                    }
                    placeholder="Your location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editProfile.bio}
                  onChange={(e) =>
                    setEditProfile({ ...editProfile, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={editProfile.company}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        company: e.target.value,
                      })
                    }
                    placeholder="Your company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={editProfile.position}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        position: e.target.value,
                      })
                    }
                    placeholder="Your position"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Social Links</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={editProfile.linkedin}
                      onChange={(e) =>
                        setEditProfile({
                          ...editProfile,
                          linkedin: e.target.value,
                        })
                      }
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={editProfile.github}
                      onChange={(e) =>
                        setEditProfile({
                          ...editProfile,
                          github: e.target.value,
                        })
                      }
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio</Label>
                    <Input
                      id="portfolio"
                      value={editProfile.portfolio}
                      onChange={(e) =>
                        setEditProfile({
                          ...editProfile,
                          portfolio: e.target.value,
                        })
                      }
                      placeholder="https://your-portfolio.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Followers Dialog */}
        <Dialog
          open={showFollowersDialog}
          onOpenChange={setShowFollowersDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Followers ({profileData?.followers?.length || 0})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              {profileData?.followers && profileData.followers.length > 0 ? (
                <div className="space-y-3">
                  {profileData.followers.map((follower) => (
                    <motion.div
                      key={follower._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={follower.profilePicture} />
                          <AvatarFallback>
                            {follower.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{follower.name}</div>
                          <div className="text-sm text-gray-500">
                            {follower.role}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No followers yet</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Following Dialog */}
        <Dialog
          open={showFollowingDialog}
          onOpenChange={setShowFollowingDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Following ({profileData?.following?.length || 0})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              {profileData?.following && profileData.following.length > 0 ? (
                <div className="space-y-3">
                  {profileData.following.map((followed) => (
                    <motion.div
                      key={followed._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={followed.profilePicture} />
                          <AvatarFallback>
                            {followed.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{followed.name}</div>
                          <div className="text-sm text-gray-500">
                            {followed.role}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Not following anyone yet</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Follow Requests Dialog */}
        <Dialog
          open={showFollowRequestsDialog}
          onOpenChange={setShowFollowRequestsDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Follow Requests ({followRequests.length})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              {followRequests.length > 0 ? (
                <div className="space-y-3">
                  {followRequests.map((request) => (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.profilePicture} />
                          <AvatarFallback>
                            {request.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{request.name}</div>
                          <div className="text-sm text-gray-500">
                            {request.role}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcceptFollowRequest(request._id)}
                          disabled={followLoading}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectFollowRequest(request._id)}
                          disabled={followLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No follow requests yet</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfilePageEnhanced;
