import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    userRegistration: true,
    emailVerification: true,
    contentModeration: true,
    aiInterviews: true,
    codingPlatform: true,
    maintenanceMode: false,
    apiRateLimit: '1000',
    sessionTimeout: '30',
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Configure platform settings and features
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
          <CardDescription>Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="user-registration">User Registration</Label>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Allow new users to create accounts
              </p>
            </div>
            <Switch
              id="user-registration"
              checked={settings.userRegistration}
              onCheckedChange={() => handleToggle('userRegistration')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-verification">Email Verification</Label>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Require email verification for new accounts
              </p>
            </div>
            <Switch
              id="email-verification"
              checked={settings.emailVerification}
              onCheckedChange={() => handleToggle('emailVerification')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="content-moderation">Content Moderation</Label>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Enable automated content moderation
              </p>
            </div>
            <Switch
              id="content-moderation"
              checked={settings.contentModeration}
              onCheckedChange={() => handleToggle('contentModeration')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-interviews">AI Interviews</Label>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Enable AI-powered interview practice
              </p>
            </div>
            <Switch
              id="ai-interviews"
              checked={settings.aiInterviews}
              onCheckedChange={() => handleToggle('aiInterviews')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="coding-platform">Coding Platform</Label>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Enable coding practice platform
              </p>
            </div>
            <Switch
              id="coding-platform"
              checked={settings.codingPlatform}
              onCheckedChange={() => handleToggle('codingPlatform')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Put the platform in maintenance mode
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={settings.maintenanceMode}
              onCheckedChange={() => handleToggle('maintenanceMode')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Configuration</CardTitle>
          <CardDescription>Configure platform parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="api-rate-limit">API Rate Limit (requests/hour)</Label>
            <Input
              id="api-rate-limit"
              type="number"
              value={settings.apiRateLimit}
              onChange={(e) => setSettings({ ...settings, apiRateLimit: e.target.value })}
            />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Maximum API requests per user per hour
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
            />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              User session timeout duration
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Roles & Permissions</CardTitle>
          <CardDescription>Manage admin user roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
              <div>
                <div className="text-sm">Super Admin</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  Full platform access
                </div>
              </div>
              <Badge>3 users</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
              <div>
                <div className="text-sm">Moderator</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  Content and user management
                </div>
              </div>
              <Badge>7 users</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
              <div>
                <div className="text-sm">Support Admin</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  Help center access only
                </div>
              </div>
              <Badge>5 users</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
              <div>
                <div className="text-sm">Analytics Admin</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  Read-only analytics
                </div>
              </div>
              <Badge>2 users</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}
