import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Skeleton } from "../../ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  MapPin,
  Building,
  Briefcase,
  Linkedin,
  Github,
  Globe,
  Loader2,
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
  AlertCircle,
} from "lucide-react";
import { useToast } from "../../ui/toast";

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
  posts: any[];
}

const ProfileSearchPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [storedSearchResults, setStoredSearchResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSelectedProfile(null); // Clear selected profile when starting new search
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/search?q=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Search results:", data.data.users); // Debug log
        setSearchResults(data.data.users || []);
      } else {
        console.error("Search failed:", response.status);
      }
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleProfileClick = async (userId: string) => {
    setLoading(true);
    setStoredSearchResults(searchResults); // Store current search results
    setSearchResults([]); // Clear search results to prevent overlay
    setSelectedProfile(null); // Clear any existing profile first
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Profile data received:", data.data); // Debug log
        setSelectedProfile(data.data);
      } else {
        const errorData = await response.json();
        error(
          "Failed to load profile",
          errorData.message || "Profile not found"
        );
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      error("Failed to load profile", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!selectedProfile) return;

    setFollowLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/follow/${selectedProfile.user._id}`,
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

        // Refresh profile data to update the UI state
        await handleProfileClick(selectedProfile.user._id);
      } else {
        const errorData = await response.json();
        error("Follow failed", errorData.message || "Please try again.");
      }
    } catch (err: any) {
      console.error("Error following user:", err);
      error("Failed to follow user", "Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!selectedProfile) return;

    setFollowLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/unfollow/${selectedProfile.user._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        success("Unfollowed!", "You are no longer following this user.");
        await handleProfileClick(selectedProfile.user._id);
      } else {
        const errorData = await response.json();
        error("Unfollow failed", errorData.message || "Please try again.");
      }
    } catch (err: any) {
      console.error("Error unfollowing user:", err);
      error("Failed to unfollow user", "Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-6 w-6" />
                Search Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Search by username or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
                {(searchResults.length > 0 || selectedProfile) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setSelectedProfile(null);
                      setStoredSearchResults([]); // Clear stored results too
                    }}
                  >
                    New Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Search Results ({searchResults.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((user) => (
                    <motion.div
                      key={user._id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleProfileClick(user._id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profilePicture} />
                          <AvatarFallback>
                            {user.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                          {user.profile?.location && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.profile.location}
                            </p>
                          )}
                        </div>
                        {user.preferences?.privacy?.profileVisibility ===
                          "private" && (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Selected Profile */}
        <AnimatePresence>
          {selectedProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  {/* Back to Search Button */}
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProfile(null);
                        setSearchResults(storedSearchResults); // Restore stored search results
                      }}
                      className="flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Back to Search
                    </Button>
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-24 rounded-full" />
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Profile Picture */}
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                          <AvatarImage
                            src={selectedProfile.user.profilePicture}
                          />
                          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {selectedProfile.user.name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Profile Info */}
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div>
                              <h1 className="text-3xl font-bold text-gray-900">
                                {selectedProfile.user.name}
                              </h1>
                              <div className="flex items-center gap-2 text-gray-600 mt-1">
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-700"
                                >
                                  {selectedProfile.user.role}
                                </Badge>
                                {selectedProfile.user.profile?.location && (
                                  <>
                                    <MapPin className="h-4 w-4" />
                                    <span>
                                      {selectedProfile.user.profile.location}
                                    </span>
                                  </>
                                )}
                                {selectedProfile.isPrivate && (
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
                              {!selectedProfile.isProfileOwner && (
                                <Button
                                  onClick={
                                    selectedProfile.isFollowing
                                      ? handleUnfollow
                                      : handleFollow
                                  }
                                  disabled={
                                    followLoading || !selectedProfile.canFollow
                                  }
                                  className={`${
                                    selectedProfile.isFollowing
                                      ? "bg-gray-600 hover:bg-gray-700"
                                      : selectedProfile.hasFollowRequest
                                      ? "bg-yellow-600 hover:bg-yellow-700"
                                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                  } text-white shadow-lg`}
                                >
                                  {followLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : selectedProfile.isFollowing ? (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Following
                                    </>
                                  ) : selectedProfile.hasFollowRequest ? (
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
                              )}
                            </div>
                          </div>

                          {selectedProfile.user.profile?.bio && (
                            <p className="text-gray-700 leading-relaxed">
                              {selectedProfile.user.profile.bio}
                            </p>
                          )}

                          {/* Social Links */}
                          {(selectedProfile.user.profile?.socialLinks
                            ?.linkedin ||
                            selectedProfile.user.profile?.socialLinks?.github ||
                            selectedProfile.user.profile?.socialLinks
                              ?.portfolio) && (
                            <div className="flex gap-3">
                              {selectedProfile.user.profile.socialLinks
                                ?.linkedin && (
                                <motion.a
                                  href={
                                    selectedProfile.user.profile.socialLinks
                                      .linkedin
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  whileHover={{ scale: 1.1 }}
                                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <Linkedin className="h-5 w-5" />
                                </motion.a>
                              )}
                              {selectedProfile.user.profile.socialLinks
                                ?.github && (
                                <motion.a
                                  href={
                                    selectedProfile.user.profile.socialLinks
                                      .github
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  whileHover={{ scale: 1.1 }}
                                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  <Github className="h-5 w-5" />
                                </motion.a>
                              )}
                              {selectedProfile.user.profile.socialLinks
                                ?.portfolio && (
                                <motion.a
                                  href={
                                    selectedProfile.user.profile.socialLinks
                                      .portfolio
                                  }
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
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {selectedProfile.followers?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Followers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {selectedProfile.following?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Following</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {selectedProfile.posts?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Posts</div>
                        </div>
                      </motion.div>

                      {/* Posts Section */}
                      {selectedProfile.isPrivate &&
                      !selectedProfile.canViewPosts ? (
                        <div className="text-center py-12 mt-8">
                          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            This account is private
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Follow this account to see their posts and activity.
                          </p>
                          {!selectedProfile.isProfileOwner && (
                            <Button
                              onClick={handleFollow}
                              disabled={
                                followLoading || !selectedProfile.canFollow
                              }
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            >
                              {followLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : selectedProfile.hasFollowRequest ? (
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
                      ) : selectedProfile.posts &&
                        selectedProfile.posts.length > 0 ? (
                        <div className="mt-8">
                          <h3 className="text-xl font-semibold mb-4">Posts</h3>
                          <div className="space-y-4">
                            {selectedProfile.posts.map((post, index) => (
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
                                      src={selectedProfile.user.profilePicture}
                                    />
                                    <AvatarFallback>
                                      {selectedProfile.user.name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">
                                        {selectedProfile.user.name}
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {post.type}
                                      </Badge>
                                      <span className="text-sm text-gray-500">
                                        {new Date(
                                          post.createdAt
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-gray-700">
                                      {post.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <div className="flex items-center gap-1">
                                        <Heart className="h-4 w-4" />
                                        {post.likes}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MessageCircle className="h-4 w-4" />
                                        {post.comments}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 mt-8">
                          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No posts yet</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileSearchPage;
