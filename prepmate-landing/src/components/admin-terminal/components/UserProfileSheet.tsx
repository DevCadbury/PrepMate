import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../ui/sheet';
import { AdminUser, UserProfileCard } from '../types';
import { fetchUserProfile } from '../services/adminApi';

interface UserProfileSheetProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileSheet: React.FC<UserProfileSheetProps> = ({ userId, isOpen, onClose }) => {
  const [profile, setProfile] = React.useState<UserProfileCard | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (userId && isOpen) {
      setLoading(true);
      fetchUserProfile(userId)
        .then(setProfile)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
    }
  }, [userId, isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-[var(--admin-surface)] border-l-[var(--admin-outline)] text-[var(--admin-on-surface)] overflow-y-auto admin-terminal">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl text-[var(--admin-on-surface)]">User Profile</SheetTitle>
          <SheetDescription className="text-[var(--admin-on-surface-variant)]">
            Detailed view and administrative controls for this user.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--admin-primary)]"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-[var(--admin-surface-container-high)] border-2 border-[var(--admin-outline)] overflow-hidden flex-shrink-0">
                {profile.user.profilePicture ? (
                  <img src={profile.user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--admin-on-surface-muted)] text-xl font-bold">
                    {profile.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{profile.user.name}</h3>
                <p className="text-[var(--admin-on-surface-variant)] text-sm">@{profile.user.username}</p>
                <div className="flex items-center mt-1 space-x-2">
                  <span className={`admin-badge ${
                    profile.user.status === 'active' ? 'admin-badge-success' :
                    profile.user.status === 'suspended' ? 'admin-badge-error' : 'admin-badge-warning'
                  }`}>
                    {profile.user.status}
                  </span>
                  <span className="admin-badge admin-badge-neutral capitalize">{profile.user.role}</span>
                </div>
              </div>
            </div>

            <div className="admin-card p-4 text-sm">
              <h4 className="font-semibold text-[var(--admin-on-surface-variant)] mb-3 text-xs uppercase tracking-wider">Account Details</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <p className="text-[var(--admin-on-surface-muted)] text-xs mb-1">Email</p>
                  <p className="font-medium truncate" title={profile.user.email}>{profile.user.email}</p>
                </div>
                <div>
                  <p className="text-[var(--admin-on-surface-muted)] text-xs mb-1">Joined</p>
                  <p className="font-medium">{new Date(profile.user.joinDate || Date.now()).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[var(--admin-on-surface-muted)] text-xs mb-1">Last Login</p>
                  <p className="font-medium">{new Date(profile.user.lastLogin || Date.now()).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[var(--admin-on-surface-muted)] text-xs mb-1">Subscription</p>
                  <p className="font-medium capitalize">{profile.user.subscription || 'Free'}</p>
                </div>
              </div>
            </div>
            
            <div className="admin-card p-4">
               <h4 className="font-semibold text-[var(--admin-on-surface-variant)] mb-3 text-xs uppercase tracking-wider">Actions</h4>
               <p className="text-sm text-[var(--admin-on-surface-muted)]">Moderation actions coming in full implementation.</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-[var(--admin-on-surface-muted)]">Failed to load user profile</div>
        )}
      </SheetContent>
    </Sheet>
  );
};
