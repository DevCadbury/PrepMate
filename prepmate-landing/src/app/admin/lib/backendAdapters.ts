import { apiClient } from '../../../lib/apiClient';
import type { LogActionType, LogCategory, LogEntry } from '../data/logsData';
import type { Coupon, CouponUsage } from '../data/couponData';
import type {
  SupportTicket,
  TicketMessage,
  TimelineEvent,
  TicketTag,
  TicketPriority,
  TicketStatus,
} from '../data/ticketData';

export type BackendUserRecord = {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: string;
  adminRole?: string | null;
  status: 'active' | 'suspended' | 'pending' | string;
  joinDate?: string;
  lastLogin?: string;
  restrictions?: {
    canPost?: boolean;
    canComment?: boolean;
    canFollow?: boolean;
    canLink?: boolean;
  };
};

export type BackendPostRecord = {
  id: string;
  type?: string;
  status?: string;
  contentPreview?: string;
  tags?: string[];
  reportsCount?: number;
  pendingReportsCount?: number;
  latestReportReason?: string;
  createdAt?: string;
  user?: {
    id: string;
    name?: string;
    username?: string;
    profilePicture?: string;
  } | null;
};

export type BackendChatReportRecord = {
  messageId: string;
  roomId?: string | null;
  messagePreview?: string;
  sender?: {
    id: string;
    name?: string;
    username?: string;
  } | null;
  receiver?: {
    id: string;
    name?: string;
    username?: string;
  } | null;
  reportCount?: number;
  lastReason?: string;
  lastReportedAt?: string;
  status?: 'open' | 'resolved' | 'dismissed' | 'blocked' | string;
  reviewedAt?: string;
};

export type BackendSupportTicketRecord = {
  id: string;
  subject: string;
  description: string;
  category: 'help' | 'bug' | 'billing' | 'abuse' | 'other' | string;
  priority: TicketPriority;
  status: TicketStatus;
  adminNotes?: string;
  user?: {
    id: string;
    name?: string;
    username?: string;
    email?: string;
  } | null;
  assignedTo?: {
    id: string;
    name?: string;
    username?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AssigneeOption = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  ticketCount: number;
  initials: string;
};

const HOUR_MS = 60 * 60 * 1000;

export const toInitials = (value: string) => {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

export const formatDisplayDate = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDisplayDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'just now';

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hr ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} day${Math.floor(diff / day) > 1 ? 's' : ''} ago`;

  return formatDisplayDate(date);
};

export const deriveRestriction = (
  restrictions?: BackendUserRecord['restrictions']
): { type: string; remaining: string; reason: string } | undefined => {
  if (!restrictions) return undefined;

  const disabled = Object.entries(restrictions)
    .filter(([, allowed]) => allowed === false)
    .map(([key]) => key);

  if (disabled.length === 0) return undefined;

  const labelMap: Record<string, string> = {
    canPost: 'posting',
    canComment: 'commenting',
    canFollow: 'following',
    canLink: 'linking',
  };

  return {
    type: labelMap[disabled[0]] || 'restricted',
    remaining: 'until updated',
    reason: `Restricted: ${disabled.map((key) => labelMap[key] || key).join(', ')}`,
  };
};

export const mapBackendUserToUsersRow = (user: BackendUserRecord) => {
  const roleLabel = user.adminRole ? user.adminRole.replace(/_/g, ' ') : user.role;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: roleLabel || user.role,
    status: user.status === 'pending' ? 'suspended' : user.status,
    joinedAt: formatDisplayDate(user.joinDate),
    lastActive: formatRelativeTime(user.lastLogin),
    posts: 0,
    followers: 0,
    following: 0,
    reports: 0,
    codingSolved: 0,
    restriction: deriveRestriction(user.restrictions),
  };
};

export const mapBackendPostToContentRow = (post: BackendPostRecord) => {
  const pending = Number(post.pendingReportsCount || 0);
  const backendStatus = String(post.status || '').toLowerCase();

  const status: 'published' | 'flagged' | 'removed' =
    pending > 0
      ? 'flagged'
      : backendStatus === 'active'
      ? 'published'
      : 'removed';

  const preview = String(post.contentPreview || '').trim();
  const title = preview.length > 70 ? `${preview.slice(0, 70)}...` : preview || 'Untitled post';

  return {
    id: post.id,
    title,
    author: post.user?.name || post.user?.username || 'Unknown user',
    content: preview || 'No preview available',
    createdAt: formatRelativeTime(post.createdAt),
    status,
    flags: pending,
    views: 0,
  };
};

export const mapBackendChatReportToReportsRow = (report: BackendChatReportRecord) => {
  const count = Number(report.reportCount || 0);
  const backendStatus = String(report.status || 'open').toLowerCase();

  const severity: 'low' | 'medium' | 'high' =
    count >= 4 ? 'high' : count >= 2 ? 'medium' : 'low';

  const status: 'pending' | 'approved' | 'rejected' =
    backendStatus === 'open'
      ? 'pending'
      : backendStatus === 'dismissed'
      ? 'rejected'
      : 'approved';

  return {
    id: report.messageId,
    reporter: report.receiver?.name || 'Community user',
    reporterEmail: report.receiver?.username || 'unknown',
    target: report.sender?.name || 'Unknown sender',
    targetType: 'user' as const,
    reason: report.lastReason || 'Policy violation',
    description: report.messagePreview || 'No message preview',
    status,
    createdAt: formatRelativeTime(report.lastReportedAt),
    severity,
    _backendStatus: backendStatus,
  };
};

const categoryToTag = (category: string): TicketTag => {
  const normalized = String(category || '').toLowerCase();
  if (normalized === 'bug') return 'bug';
  if (normalized === 'billing') return 'billing';
  if (normalized === 'abuse') return 'abuse';
  if (normalized === 'help') return 'account';
  return 'technical';
};

const priorityToSlaHours = (priority: TicketPriority) => {
  if (priority === 'urgent') return 4;
  if (priority === 'high') return 12;
  if (priority === 'medium') return 24;
  return 48;
};

const buildTicketMessages = (ticket: BackendSupportTicketRecord): TicketMessage[] => {
  const messages: TicketMessage[] = [
    {
      id: `${ticket.id}-user-1`,
      type: 'reply',
      senderName: ticket.user?.name || 'User',
      senderEmail: ticket.user?.email || 'unknown',
      senderRole: 'user',
      content: ticket.description,
      timestamp: formatDisplayDateTime(ticket.createdAt),
      isRead: ticket.status !== 'open',
    },
  ];

  const note = String(ticket.adminNotes || '').trim();
  if (note) {
    messages.push({
      id: `${ticket.id}-admin-note`,
      type: 'internal_note',
      senderName: ticket.assignedTo?.name || 'Support Admin',
      senderEmail: ticket.assignedTo?.username || 'support',
      senderRole: 'admin',
      content: note,
      timestamp: formatDisplayDateTime(ticket.updatedAt),
      isRead: true,
    });
  }

  return messages;
};

const buildTicketTimeline = (ticket: BackendSupportTicketRecord): TimelineEvent[] => {
  const timeline: TimelineEvent[] = [
    {
      id: `${ticket.id}-timeline-created`,
      type: 'created',
      description: 'Ticket created',
      actor: ticket.user?.name || 'User',
      timestamp: formatDisplayDateTime(ticket.createdAt),
    },
  ];

  if (ticket.assignedTo?.name) {
    timeline.push({
      id: `${ticket.id}-timeline-assigned`,
      type: 'assigned',
      description: `Assigned to ${ticket.assignedTo.name}`,
      actor: 'System',
      timestamp: formatDisplayDateTime(ticket.updatedAt),
    });
  }

  if (ticket.status !== 'open') {
    timeline.push({
      id: `${ticket.id}-timeline-status`,
      type: 'status_changed',
      description: `Status changed to ${ticket.status.replace(/_/g, ' ')}`,
      actor: ticket.assignedTo?.name || 'Support Team',
      timestamp: formatDisplayDateTime(ticket.updatedAt),
    });
  }

  if (String(ticket.adminNotes || '').trim()) {
    timeline.push({
      id: `${ticket.id}-timeline-note`,
      type: 'note_added',
      description: 'Admin note updated',
      actor: ticket.assignedTo?.name || 'Support Team',
      timestamp: formatDisplayDateTime(ticket.updatedAt),
    });
  }

  return timeline;
};

export const mapBackendSupportTicketToUi = (
  ticket: BackendSupportTicketRecord
): SupportTicket => {
  const createdAtMs = new Date(ticket.createdAt || Date.now()).getTime();
  const slaHours = priorityToSlaHours(ticket.priority || 'medium');
  const dueDate = new Date(createdAtMs + slaHours * HOUR_MS);
  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  return {
    id: ticket.id,
    userId: ticket.user?.id || '',
    userName: ticket.user?.name || 'Unknown user',
    userEmail: ticket.user?.email || 'unknown',
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    assignedTo: ticket.assignedTo?.name || undefined,
    assignedToId: ticket.assignedTo?.id || undefined,
    tags: [categoryToTag(ticket.category)],
    createdAt: formatDisplayDateTime(ticket.createdAt),
    updatedAt: formatDisplayDateTime(ticket.updatedAt),
    lastActivity: formatRelativeTime(ticket.updatedAt),
    messages: buildTicketMessages(ticket),
    timeline: buildTicketTimeline(ticket),
    slaFirstResponse: null,
    slaResolution: isClosed ? formatRelativeTime(ticket.updatedAt) : null,
    slaDue: formatDisplayDateTime(dueDate),
    slaBreached: !isClosed && Date.now() > dueDate.getTime(),
    linkedTickets: [],
  };
};

const inferCategory = (line: string): LogCategory => {
  const lower = line.toLowerCase();
  if (lower.includes('/api/auth')) return 'auth';
  if (lower.includes('/api/admin/users')) return 'user';
  if (lower.includes('/api/admin/social')) return 'content';
  if (lower.includes('/api/admin/chat/reports') || lower.includes('/api/support')) return 'report';
  if (lower.includes('/api/admin/coding') || lower.includes('/api/coding')) return 'coding';
  if (lower.includes('/api/admin/settings')) return 'settings';
  if (lower.includes('/api/admin')) return 'admin';
  return 'system';
};

const inferActionType = (line: string): LogActionType => {
  const lower = line.toLowerCase();
  if (lower.includes(' error') || lower.includes(' failed') || lower.includes('exception')) return 'destructive';
  if (lower.includes('warn') || lower.includes('suspend') || lower.includes('ban')) return 'warning';
  if (lower.includes('success') || lower.includes('resolved') || lower.includes('approved')) return 'success';
  if (lower.includes('debug')) return 'muted';
  return 'info';
};

const parseTimestamp = (line: string): Date => {
  const match = line.match(/^\[([^\]]+)\]/);
  if (!match) return new Date();
  const parsed = new Date(match[1]);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

const parseTarget = (line: string) => {
  const match = line.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)/i);
  if (!match) {
    return {
      action: 'System event',
      target: 'Server',
    };
  }

  const method = String(match[1] || '').toUpperCase();
  const route = String(match[2] || '/');

  return {
    action: `${method} request`,
    target: route,
  };
};

const mapLineToLogEntry = (line: string, index: number): LogEntry => {
  const timestamp = parseTimestamp(line);
  const parsed = parseTarget(line);

  return {
    id: `api-log-${index}`,
    actor: {
      name: 'System',
      email: 'system@prepmate.io',
      type: 'system',
      initials: 'SY',
      color: 'bg-slate-500',
    },
    action: parsed.action,
    actionType: inferActionType(line),
    target: {
      label: parsed.target,
      type: 'system',
    },
    timestamp,
    relativeTime: formatRelativeTime(timestamp),
    category: inferCategory(line),
    details: line,
  };
};

export const fetchRecentLogEntries = async (lines = 200): Promise<LogEntry[]> => {
  const response = await apiClient.get<{
    success?: boolean;
    data?: { lines?: string[] };
  }>(`/admin/logs/recent?lines=${lines}`);

  const linePayload = response?.data?.lines;
  const rawLines = Array.isArray(linePayload) ? linePayload : [];

  const entries = rawLines
    .map((line, index) => mapLineToLogEntry(line, index))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return entries;
};

const mapBackendCoupon = (record: any): Coupon => ({
  id: record?._id || record?.id || '',
  code: record?.code || '',
  description: record?.description || '',
  status: record?.status || 'inactive',
  discountType: record?.discountType || 'percentage',
  value: Number(record?.value || 0),
  maxDiscountCap: record?.maxDiscountCap ?? 0,
  usageLimit: Number(record?.usageLimit || 0),
  perUserLimit: Number(record?.perUserLimit || 0),
  oneTimeUse: Boolean(record?.oneTimeUse),
  usedCount: Number(record?.usedCount || 0),
  uniqueUsers: Number(record?.uniqueUsers || 0),
  startDate: record?.startDate ? String(record.startDate) : undefined,
  endDate: record?.endDate ? String(record.endDate) : undefined,
  scheduledActivation: record?.scheduledActivation ? String(record.scheduledActivation) : undefined,
  eligibility: record?.eligibility || { targetAudience: 'all' },
  restrictions: record?.restrictions || { stackable: false },
  variant: record?.variant || 'standard',
  referralUserId: record?.referralUserId || undefined,
  tier: record?.tier || undefined,
  prefix: record?.prefix || undefined,
  createdAt: record?.createdAt || new Date().toISOString(),
  createdBy: record?.createdBy || 'system',
  tags: record?.tags || [],
});

const mapBackendCouponUsage = (record: any): CouponUsage => ({
  id: record?._id || record?.id || '',
  couponId: record?.couponId?._id || record?.couponId || '',
  couponCode: record?.couponCode || undefined,
  userId: record?.userId || '',
  userName: record?.userName || '',
  userEmail: record?.userEmail || '',
  userRole: record?.userRole || '',
  timestamp: record?.timestamp || record?.createdAt || new Date().toISOString(),
  discountApplied: Number(record?.discountApplied || 0),
  context: record?.context || '',
  orderId: record?.orderId || undefined,
  suspicious: Boolean(record?.suspicious),
  flagReason: record?.flagReason || undefined,
  device: record?.device || '',
  country: record?.country || '',
  ipAddress: record?.ipAddress || '',
});

export const fetchAdminCoupons = async (params?: {
  search?: string;
  status?: string;
  variant?: string;
  page?: number;
  limit?: number;
}): Promise<{ coupons: Coupon[]; total: number }> => {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.variant) query.set('variant', params.variant);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const response = await apiClient.get<{
    data?: { coupons?: any[]; total?: number };
  }>(`/admin/coupons?${query.toString()}`);

  const rawCoupons = response?.data?.coupons || [];
  return {
    coupons: rawCoupons.map(mapBackendCoupon),
    total: Number(response?.data?.total || rawCoupons.length),
  };
};

export const fetchAdminCouponById = async (id: string): Promise<Coupon | null> => {
  const response = await apiClient.get<{ data?: any }>(`/admin/coupons/${id}`);
  if (!response?.data) return null;
  return mapBackendCoupon(response.data);
};

export const fetchAdminCouponUsage = async (params?: {
  couponId?: string;
  couponCode?: string;
  limit?: number;
}): Promise<CouponUsage[]> => {
  const query = new URLSearchParams();
  if (params?.couponId) query.set('couponId', params.couponId);
  if (params?.couponCode) query.set('couponCode', params.couponCode);
  if (params?.limit) query.set('limit', String(params.limit));

  const response = await apiClient.get<{
    data?: { usage?: any[] };
  }>(`/admin/coupons/usage?${query.toString()}`);

  const rawUsage = response?.data?.usage || [];
  return rawUsage.map(mapBackendCouponUsage);
};

export const updateAdminCouponStatus = async (id: string, status: string): Promise<Coupon | null> => {
  const response = await apiClient.patch<{ data?: any }>(`/admin/coupons/${id}/status`, { status });
  if (!response?.data) return null;
  return mapBackendCoupon(response.data);
};

export const updateAdminCoupon = async (id: string, updates: Partial<Coupon>): Promise<Coupon | null> => {
  const response = await apiClient.patch<{ data?: any }>(`/admin/coupons/${id}`, updates);
  if (!response?.data) return null;
  return mapBackendCoupon(response.data);
};

export const deleteAdminCoupon = async (id: string): Promise<boolean> => {
  await apiClient.delete(`/admin/coupons/${id}`);
  return true;
};

export const createAdminCoupon = async (payload: Partial<Coupon>): Promise<Coupon | null> => {
  const response = await apiClient.post<{ data?: any }>(`/admin/coupons`, payload);
  if (!response?.data) return null;
  return mapBackendCoupon(response.data);
};

export const createAdminCouponBulk = async (payload: {
  count: number;
  prefix?: string;
  template?: Partial<Coupon>;
}): Promise<Coupon[]> => {
  const response = await apiClient.post<{ data?: { coupons?: any[] } }>(`/admin/coupons/bulk`, payload);
  const rawCoupons = response?.data?.coupons || [];
  return rawCoupons.map(mapBackendCoupon);
};

export const fetchAssigneeOptions = async (): Promise<AssigneeOption[]> => {
  const [supportResponse, adminResponse] = await Promise.all([
    apiClient.get<{ data?: { users?: BackendUserRecord[] } }>(
      '/admin/users?role=support&limit=100'
    ),
    apiClient.get<{ data?: { users?: BackendUserRecord[] } }>(
      '/admin/users?role=admin&limit=100'
    ),
  ]);

  const users = [
    ...(supportResponse?.data?.users || []),
    ...(adminResponse?.data?.users || []),
  ];

  const seen = new Set<string>();
  const options: AssigneeOption[] = [];

  users.forEach((user) => {
    if (!user?.id || seen.has(user.id)) return;
    seen.add(user.id);

    options.push({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.adminRole || user.role,
      isActive: user.status === 'active',
      ticketCount: 0,
      initials: toInitials(user.name),
    });
  });

  return options.sort((a, b) => a.name.localeCompare(b.name));
};

export const normalizeSubmissionStatus = (value?: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'accepted') return 'accepted';
  if (normalized === 'time limit exceeded' || normalized === 'time_limit_exceeded') return 'time_limit_exceeded';
  if (normalized === 'runtime error' || normalized === 'runtime_error') return 'runtime_error';
  if (normalized === 'compilation error' || normalized === 'compile_error') return 'compile_error';
  return 'wrong_answer';
};
