import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import MediaAttachment, { AttachedFile } from './MediaAttachment';
import { Shield, Clock, MessageSquare, Eye, Ban, AlertTriangle } from 'lucide-react';

export interface Restriction {
  type: 'posting' | 'commenting' | 'view_only' | 'ban_cooldown';
  duration: string;
  customDuration?: string;
  reason: string;
  attachments: AttachedFile[];
}

interface CooldownSelectorProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  onApply: (restriction: Restriction) => void;
}

const restrictionTypes = [
  { value: 'posting', label: 'Content posting restriction', description: 'User cannot create posts or articles', icon: MessageSquare, color: 'text-amber-600 dark:text-amber-400' },
  { value: 'commenting', label: 'Comment restriction', description: 'User cannot comment on posts', icon: MessageSquare, color: 'text-amber-600 dark:text-amber-400' },
  { value: 'view_only', label: 'View-only mode', description: 'User can only browse, no interactions', icon: Eye, color: 'text-violet-600 dark:text-violet-400' },
  { value: 'ban_cooldown', label: 'Temporary ban', description: 'Full access revoked for set duration', icon: Ban, color: 'text-red-600 dark:text-red-400' },
];

const durationOptions = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: '14d', label: '14 days' },
  { value: '30d', label: '30 days' },
  { value: 'custom', label: 'Custom' },
];

export default function CooldownSelector({ open, onClose, userName, onApply }: CooldownSelectorProps) {
  const [selectedType, setSelectedType] = useState<string>('posting');
  const [duration, setDuration] = useState('24h');
  const [customDuration, setCustomDuration] = useState('');
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);

  const handleApply = () => {
    if (!reason.trim()) return;
    onApply({
      type: selectedType as Restriction['type'],
      duration,
      customDuration: duration === 'custom' ? customDuration : undefined,
      reason,
      attachments,
    });
    // Reset
    setSelectedType('posting');
    setDuration('24h');
    setCustomDuration('');
    setReason('');
    setAttachments([]);
  };

  const selectedConfig = restrictionTypes.find(t => t.value === selectedType);
  const isBan = selectedType === 'ban_cooldown';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" />
            Apply Restriction
          </DialogTitle>
          <DialogDescription>
            Set a temporary restriction on {userName}'s account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Restriction type */}
          <div className="space-y-2">
            <Label className="text-xs">Restriction Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {restrictionTypes.map(type => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 mt-0.5 ${isSelected ? type.color : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-xs">{type.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label className="text-xs">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <Clock className="size-3.5 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {duration === 'custom' && (
              <Input
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="e.g. 48 hours, 5 days"
                className="mt-1.5"
              />
            )}
          </div>

          {/* What this does */}
          {selectedConfig && (
            <div className={`rounded-lg border p-3 space-y-1 ${
              isBan
                ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30'
                : 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30'
            }`}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className={`size-3 ${isBan ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                <p className={`text-xs ${isBan ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
                  This will:
                </p>
              </div>
              <ul className={`text-xs space-y-0.5 list-disc list-inside ${isBan ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {selectedType === 'posting' && (
                  <>
                    <li>Prevent creating new posts or articles</li>
                    <li>Existing content remains visible</li>
                  </>
                )}
                {selectedType === 'commenting' && (
                  <>
                    <li>Prevent commenting on any content</li>
                    <li>Existing comments remain visible</li>
                  </>
                )}
                {selectedType === 'view_only' && (
                  <>
                    <li>Disable all interactions (posts, comments, likes)</li>
                    <li>Allow read-only browsing</li>
                  </>
                )}
                {selectedType === 'ban_cooldown' && (
                  <>
                    <li>Completely revoke platform access</li>
                    <li>Auto-expire after the set duration</li>
                  </>
                )}
                <li>Automatically lift after {duration === 'custom' ? (customDuration || '...') : durationOptions.find(d => d.value === duration)?.label}</li>
              </ul>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for this restriction..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Attach evidence (optional)</Label>
            <MediaAttachment
              files={attachments}
              onChange={setAttachments}
              maxFiles={3}
              label="Attach screenshots of violations"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleApply}
            disabled={!reason.trim()}
            className={isBan ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            Apply Restriction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
