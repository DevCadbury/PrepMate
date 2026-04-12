// ─── Support Ticket Data Layer ───────────────────────────────────────────────
// Models, enums, mock data, and helpers for the support ticket system.

export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MessageSenderRole = 'user' | 'admin';
export type MessageType = 'reply' | 'internal_note' | 'system';
export type TicketTag =
  | 'bug'
  | 'payment'
  | 'abuse'
  | 'feature_request'
  | 'account'
  | 'billing'
  | 'technical'
  | 'escalated';

export interface TicketMessage {
  id: string;
  type: MessageType;
  senderName: string;
  senderEmail: string;
  senderRole: MessageSenderRole;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface TimelineEvent {
  id: string;
  type:
    | 'created'
    | 'message_sent'
    | 'note_added'
    | 'status_changed'
    | 'assigned'
    | 'reassigned'
    | 'tag_added'
    | 'escalated';
  description: string;
  actor: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string; // TCK-XXXXX
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  assignedToId?: string;
  tags: TicketTag[];
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  messages: TicketMessage[];
  timeline: TimelineEvent[];
  slaFirstResponse: string | null;
  slaResolution: string | null;
  slaDue: string;
  slaBreached: boolean;
  linkedTickets: string[];
}

export interface SupportAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  ticketCount: number;
  initials: string;
}

export const supportAdmins: SupportAdmin[] = [
  { id: 'adm-1', name: 'Sarah Chen', email: 'sarah.chen@prepmate.io', role: 'Support Admin', isActive: true, ticketCount: 8, initials: 'SC' },
  { id: 'adm-2', name: 'James Miller', email: 'james.miller@prepmate.io', role: 'Support Admin', isActive: true, ticketCount: 5, initials: 'JM' },
  { id: 'adm-3', name: 'Maria Rodriguez', email: 'maria.r@prepmate.io', role: 'Moderator', isActive: false, ticketCount: 3, initials: 'MR' },
  { id: 'adm-4', name: 'Alex Thompson', email: 'alex.t@prepmate.io', role: 'Super Admin', isActive: true, ticketCount: 2, initials: 'AT' },
];

export const cannedResponses: { id: string; label: string; content: string; category: string }[] = [
  { id: 'cr-1', label: 'Greeting', category: 'General', content: "Hello! Thank you for reaching out to PrepMate Support. I'm here to help you today. Could you provide more details about the issue you're experiencing?" },
  { id: 'cr-2', label: 'Escalating', category: 'General', content: "I'm escalating your ticket to our technical team who specializes in this area. You can expect a response within 24 hours. I apologize for any inconvenience." },
  { id: 'cr-3', label: 'Need more info', category: 'General', content: "To better assist you, could you please provide more details? Specifically, what steps led to the problem and any error messages you've seen would be very helpful." },
  { id: 'cr-4', label: 'Bug acknowledged', category: 'Technical', content: "Thank you for reporting this bug. I've logged it with our engineering team with high priority and will notify you once it's been resolved. We appreciate your patience." },
  { id: 'cr-5', label: 'Issue resolved', category: 'General', content: "I'm glad we could resolve your issue! I'll be marking this ticket as resolved. If you have any further questions, please don't hesitate to open a new ticket. Have a great day!" },
  { id: 'cr-6', label: 'Payment issue', category: 'Billing', content: "I understand your concern about the billing issue. I'm looking into your account now. Could you please confirm the last 4 digits of the card used and the approximate transaction date?" },
  { id: 'cr-7', label: 'Refund initiated', category: 'Billing', content: "I've confirmed the error and have initiated a refund for the amount in question. You should see it reflected in your account within 3–5 business days. I've also added a note on your account to prevent recurrence." },
  { id: 'cr-8', label: 'Waiting for response', category: 'General', content: "I'm marking this ticket as 'Waiting for User' as we await your response. The ticket will remain open for 72 hours. Please reply at your earliest convenience so we can continue assisting you." },
];

export const availableTags: { value: TicketTag; label: string; className: string }[] = [
  { value: 'bug', label: 'Bug', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
  { value: 'payment', label: 'Payment', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' },
  { value: 'abuse', label: 'Abuse', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' },
  { value: 'feature_request', label: 'Feature Request', className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800' },
  { value: 'account', label: 'Account', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
  { value: 'billing', label: 'Billing', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' },
  { value: 'technical', label: 'Technical', className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800' },
  { value: 'escalated', label: 'Escalated', className: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800' },
];

// ── Mock Tickets ────────────────────────────────────────────────────────────

export const mockTickets: SupportTicket[] = [
  {
    id: 'TCK-10235',
    userId: '4',
    userName: 'Alice Brown',
    userEmail: 'alice.brown@email.com',
    subject: 'Cannot reset 2FA — phone number changed',
    status: 'open',
    priority: 'high',
    tags: ['account', 'technical'],
    createdAt: 'Apr 11, 2026 10:00',
    updatedAt: 'Apr 11, 2026 10:00',
    lastActivity: '30 min ago',
    assignedTo: undefined,
    assignedToId: undefined,
    slaFirstResponse: null,
    slaResolution: null,
    slaDue: 'Apr 12, 2026 10:00',
    slaBreached: false,
    linkedTickets: [],
    messages: [
      {
        id: 'msg-1',
        type: 'reply',
        senderName: 'Alice Brown',
        senderEmail: 'alice.brown@email.com',
        senderRole: 'user',
        content: "I changed my phone number and now I can't log into my account because 2FA is sending codes to my old number. I've tried the backup codes but none of them work. Please help — I have coding interviews scheduled for tomorrow and need access urgently!",
        timestamp: 'Apr 11, 2026 10:00',
        isRead: false,
      },
    ],
    timeline: [
      { id: 'tl-1', type: 'created', description: 'Ticket opened by Alice Brown', actor: 'Alice Brown', timestamp: 'Apr 11, 2026 10:00' },
    ],
  },
  {
    id: 'TCK-10234',
    userId: '1',
    userName: 'John Doe',
    userEmail: 'john.doe@email.com',
    subject: 'AI Interview feature returns "Service Unavailable"',
    status: 'open',
    priority: 'high',
    tags: ['bug', 'technical'],
    createdAt: 'Apr 9, 2026 14:23',
    updatedAt: 'Apr 9, 2026 16:45',
    lastActivity: '2 hours ago',
    assignedTo: undefined,
    assignedToId: undefined,
    slaFirstResponse: null,
    slaResolution: null,
    slaDue: 'Apr 10, 2026 14:23',
    slaBreached: true,
    linkedTickets: [],
    messages: [
      {
        id: 'msg-1',
        type: 'reply',
        senderName: 'John Doe',
        senderEmail: 'john.doe@email.com',
        senderRole: 'user',
        content: "Hi, I've been trying to access the AI Interview feature for the past 2 hours but I keep getting a \"Service Unavailable\" error. I'm on the Premium plan and this is completely blocking my interview prep. Error code: AI_GW_503. Please look into this.",
        timestamp: 'Apr 9, 2026 14:23',
        isRead: true,
      },
      {
        id: 'msg-2',
        type: 'internal_note',
        senderName: 'Sarah Chen',
        senderEmail: 'sarah.chen@prepmate.io',
        senderRole: 'admin',
        content: '@james — AI_GW_503 is the gateway timeout from the AI service. This might be related to the upstream outage reported 3 hours ago. Can you check the service status dashboard and see if this user was affected?',
        timestamp: 'Apr 9, 2026 15:10',
        isRead: true,
      },
    ],
    timeline: [
      { id: 'tl-1', type: 'created', description: 'Ticket opened by John Doe', actor: 'John Doe', timestamp: 'Apr 9, 2026 14:23' },
      { id: 'tl-2', type: 'note_added', description: 'Internal note added by Sarah Chen', actor: 'Sarah Chen', timestamp: 'Apr 9, 2026 15:10' },
    ],
  },
  {
    id: 'TCK-10233',
    userId: '2',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@email.com',
    subject: 'Question about Premium subscription mentorship sessions',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'Sarah Chen',
    assignedToId: 'adm-1',
    tags: ['billing', 'account'],
    createdAt: 'Apr 9, 2026 09:15',
    updatedAt: 'Apr 9, 2026 11:30',
    lastActivity: '5 hours ago',
    slaFirstResponse: '45 min',
    slaResolution: null,
    slaDue: 'Apr 11, 2026 09:15',
    slaBreached: false,
    linkedTickets: [],
    messages: [
      {
        id: 'msg-1',
        type: 'reply',
        senderName: 'Jane Smith',
        senderEmail: 'jane.smith@email.com',
        senderRole: 'user',
        content: "Hello! I recently upgraded to the Premium plan and I'm not sure what additional features I now have access to. Can you walk me through the Premium benefits, especially the mentorship sessions? I can't find a way to schedule them.",
        timestamp: 'Apr 9, 2026 09:15',
        isRead: true,
      },
      {
        id: 'msg-2',
        type: 'reply',
        senderName: 'Sarah Chen',
        senderEmail: 'sarah.chen@prepmate.io',
        senderRole: 'admin',
        content: "Hi Jane! Welcome to PrepMate Premium! 🎉 Here's what you now have access to:\n\n• **Unlimited AI Interview sessions** — available in the Practice tab\n• **500+ premium coding problems** — filter by difficulty in the Problems section\n• **Personalized learning roadmap** — check your Dashboard\n• **Monthly 1:1 mentorship session** — this is what you're asking about!\n• **Priority support** — that's me! 😊\n\nTo schedule your mentorship session, go to **My Account → Mentorship → Schedule Session**. You'll see available time slots for our verified mentors.\n\nIs there a specific area you'd like to focus on in your mentorship session?",
        timestamp: 'Apr 9, 2026 10:00',
        isRead: true,
      },
      {
        id: 'msg-3',
        type: 'reply',
        senderName: 'Jane Smith',
        senderEmail: 'jane.smith@email.com',
        senderRole: 'user',
        content: "That's fantastic! I went to My Account → Mentorship but I don't see a \"Schedule Session\" option. Is there a minimum account age or something? I upgraded just yesterday.",
        timestamp: 'Apr 9, 2026 11:30',
        isRead: true,
      },
    ],
    timeline: [
      { id: 'tl-1', type: 'created', description: 'Ticket opened by Jane Smith', actor: 'Jane Smith', timestamp: 'Apr 9, 2026 09:15' },
      { id: 'tl-2', type: 'assigned', description: 'Auto-assigned to Sarah Chen', actor: 'System', timestamp: 'Apr 9, 2026 09:20' },
      { id: 'tl-3', type: 'status_changed', description: 'Status: Open → In Progress', actor: 'Sarah Chen', timestamp: 'Apr 9, 2026 10:00' },
      { id: 'tl-4', type: 'message_sent', description: 'Reply sent to user', actor: 'Sarah Chen', timestamp: 'Apr 9, 2026 10:00' },
    ],
  },
  {
    id: 'TCK-10231',
    userId: '4',
    userName: 'Alice Brown',
    userEmail: 'alice.brown@email.com',
    subject: 'Double charge on Premium subscription — April 7th',
    status: 'in_progress',
    priority: 'urgent',
    assignedTo: 'Alex Thompson',
    assignedToId: 'adm-4',
    tags: ['payment', 'billing', 'escalated'],
    createdAt: 'Apr 9, 2026 08:00',
    updatedAt: 'Apr 9, 2026 09:45',
    lastActivity: '3 hours ago',
    slaFirstResponse: '15 min',
    slaResolution: null,
    slaDue: 'Apr 9, 2026 12:00',
    slaBreached: true,
    linkedTickets: [],
    messages: [
      {
        id: 'msg-1',
        type: 'reply',
        senderName: 'Alice Brown',
        senderEmail: 'alice.brown@email.com',
        senderRole: 'user',
        content: "I was charged TWICE for my Premium subscription this month. I can see two separate charges of $19.99 on my bank statement from April 7th (charge IDs: ch_38fn... and ch_39as...). This is completely unacceptable. I need a refund immediately.",
        timestamp: 'Apr 9, 2026 08:00',
        isRead: true,
      },
      {
        id: 'msg-2',
        type: 'internal_note',
        senderName: 'Sarah Chen',
        senderEmail: 'sarah.chen@prepmate.io',
        senderRole: 'admin',
        content: '@alex — urgent billing escalation. Confirmed two Stripe charges for this user on April 7th (both successful). User ID: alice.brown, email: alice.brown@email.com. Please handle refund and investigate the duplicate charge cause. Looks like a Stripe webhook retry issue.',
        timestamp: 'Apr 9, 2026 08:15',
        isRead: true,
      },
      {
        id: 'msg-3',
        type: 'reply',
        senderName: 'Alex Thompson',
        senderEmail: 'alex.t@prepmate.io',
        senderRole: 'admin',
        content: "Hi Alice — I sincerely apologize for this billing error. I've verified the duplicate charge in Stripe and have immediately initiated a refund for $19.99. You'll see it reflected in your account within **3–5 business days** depending on your bank.\n\nI've also flagged this to our payments engineering team — it appears to be caused by a Stripe webhook retry issue during a brief outage on April 7th. We're implementing a fix to prevent recurrence.\n\nI've added a $5 service credit to your account as an apology. Is there anything else I can help with?",
        timestamp: 'Apr 9, 2026 08:45',
        isRead: true,
      },
      {
        id: 'msg-4',
        type: 'reply',
        senderName: 'Alice Brown',
        senderEmail: 'alice.brown@email.com',
        senderRole: 'user',
        content: "Thank you for the quick response, Alex. I'll wait for the refund. Can you send me a refund confirmation to my email for my records?",
        timestamp: 'Apr 9, 2026 09:45',
        isRead: false,
      },
    ],
    timeline: [
      { id: 'tl-1', type: 'created', description: 'Ticket opened by Alice Brown', actor: 'Alice Brown', timestamp: 'Apr 9, 2026 08:00' },
      { id: 'tl-2', type: 'assigned', description: 'Auto-assigned to Sarah Chen', actor: 'System', timestamp: 'Apr 9, 2026 08:02' },
      { id: 'tl-3', type: 'note_added', description: 'Internal escalation note added', actor: 'Sarah Chen', timestamp: 'Apr 9, 2026 08:15' },
      { id: 'tl-4', type: 'escalated', description: 'Ticket escalated to Super Admin', actor: 'Sarah Chen', timestamp: 'Apr 9, 2026 08:16' },
      { id: 'tl-5', type: 'reassigned', description: 'Reassigned to Alex Thompson', actor: 'Sarah Chen', timestamp: 'Apr 9, 2026 08:16' },
      { id: 'tl-6', type: 'message_sent', description: 'Reply sent to user', actor: 'Alex Thompson', timestamp: 'Apr 9, 2026 08:45' },
    ],
  },
  {
    id: 'TCK-10230',
    userId: '5',
    userName: 'Mike Johnson',
    userEmail: 'mike.johnson@email.com',
    subject: 'Account posting restriction applied without warning',
    status: 'waiting_for_user',
    priority: 'medium',
    assignedTo: 'Maria Rodriguez',
    assignedToId: 'adm-3',
    tags: ['account', 'abuse'],
    createdAt: 'Apr 8, 2026 16:00',
    updatedAt: 'Apr 9, 2026 10:00',
    lastActivity: '4 hours ago',
    slaFirstResponse: '2h 10min',
    slaResolution: null,
    slaDue: 'Apr 10, 2026 16:00',
    slaBreached: false,
    linkedTickets: [],
    messages: [
      {
        id: 'msg-1',
        type: 'reply',
        senderName: 'Mike Johnson',
        senderEmail: 'mike.johnson@email.com',
        senderRole: 'user',
        content: "My posting ability has been restricted. I didn't receive any warning or explanation. This is very frustrating. Can you tell me why this happened and when it'll be lifted?",
        timestamp: 'Apr 8, 2026 16:00',
        isRead: true,
      },
      {
        id: 'msg-2',
        type: 'internal_note',
        senderName: 'Maria Rodriguez',
        senderEmail: 'maria.r@prepmate.io',
        senderRole: 'admin',
        content: 'Restriction was applied by auto-moderation: 3 spam reports in 24 hours. Checked the content — posts were solution code being posted repeatedly across multiple problem threads. Auto-mod flagged it as spam but it looks like legitimate behavior. Will explain and offer to review.',
        timestamp: 'Apr 8, 2026 18:10',
        isRead: true,
      },
      {
        id: 'msg-3',
        type: 'reply',
        senderName: 'Maria Rodriguez',
        senderEmail: 'maria.r@prepmate.io',
        senderRole: 'admin',
        content: "Hi Mike — your account received a temporary 18-hour posting restriction from our automated moderation system. It detected your posts as potential spam due to the high volume of similar posts in a short time window.\n\nI've reviewed your posts and they appear to be legitimate solution code. I've removed the restriction manually. You should now be able to post normally.\n\nCould you confirm that the restriction has been lifted on your end?",
        timestamp: 'Apr 8, 2026 18:10',
        isRead: true,
      },
      {
        id: 'msg-4',
        type: 'reply',
        senderName: 'Mike Johnson',
        senderEmail: 'mike.johnson@email.com',
        senderRole: 'user',
        content: "I wasn't spamming — I was posting solutions to different problems. I can post now, but I'm still frustrated this happened without any warning. Can you make sure it doesn't happen again?",
        timestamp: 'Apr 9, 2026 09:30',
        isRead: true,
      },
      {
        id: 'msg-5',
        type: 'reply',
        senderName: 'Maria Rodriguez',
        senderEmail: 'maria.r@prepmate.io',
        senderRole: 'admin',
        content: "Totally understood, Mike — and you're right, the system should have sent you an email notification. That's a bug we're aware of and fixing.\n\nI've flagged this as a false positive and adjusted your account's spam threshold. I've also submitted a feature request to improve the notification system so users are always informed before restrictions are applied.\n\nI'm marking this as 'Waiting for User' — please let me know if there's anything else I can help with!",
        timestamp: 'Apr 9, 2026 10:00',
        isRead: true,
      },
    ],
    timeline: [
      { id: 'tl-1', type: 'created', description: 'Ticket opened by Mike Johnson', actor: 'Mike Johnson', timestamp: 'Apr 8, 2026 16:00' },
      { id: 'tl-2', type: 'assigned', description: 'Auto-assigned to Maria Rodriguez', actor: 'System', timestamp: 'Apr 8, 2026 16:05' },
      { id: 'tl-3', type: 'note_added', description: 'Internal note added', actor: 'Maria Rodriguez', timestamp: 'Apr 8, 2026 18:10' },
      { id: 'tl-4', type: 'message_sent', description: 'Reply sent to user', actor: 'Maria Rodriguez', timestamp: 'Apr 8, 2026 18:10' },
      { id: 'tl-5', type: 'status_changed', description: 'Status: In Progress → Waiting for User', actor: 'Maria Rodriguez', timestamp: 'Apr 9, 2026 10:00' },
    ],
  },
  {
    id: 'TCK-10232',
    userId: '3',
    userName: 'Bob Wilson',
    userEmail: 'bob.wilson@email.com',
    subject: 'Two Sum submission fails judge — passes locally',
    status: 'resolved',
    priority: 'low',
    assignedTo: 'James Miller',
    assignedToId: 'adm-2',
    tags: ['technical', 'bug'],
    createdAt: 'Apr 8, 2026 10:00',
    updatedAt: 'Apr 8, 2026 14:22',
    lastActivity: '1 day ago',
    slaFirstResponse: '32 min',
    slaResolution: '4h 22min',
    slaDue: 'Apr 9, 2026 10:00',
    slaBreached: false,
    linkedTickets: ['TCK-10228'],
    messages: [
      {
        id: 'msg-1',
        type: 'reply',
        senderName: 'Bob Wilson',
        senderEmail: 'bob.wilson@email.com',
        senderRole: 'user',
        content: "My solution to \"Two Sum\" (#1) passes all edge cases locally including overflow inputs, but the judge keeps returning \"Wrong Answer\". I'm using O(n) hash map approach. Can someone check if the test cases are correct?",
        timestamp: 'Apr 8, 2026 10:00',
        isRead: true,
      },
      {
        id: 'msg-2',
        type: 'reply',
        senderName: 'James Miller',
        senderEmail: 'james.miller@prepmate.io',
        senderRole: 'admin',
        content: "Hi Bob! I checked your submission against our test suite. The issue was on our end — we had a stale test case in the judge that was incorrectly expecting a different output format for edge cases involving negative numbers. We've updated the test suite.\n\nCould you please try resubmitting? Your solution should pass now.",
        timestamp: 'Apr 8, 2026 10:32',
        isRead: true,
      },
      {
        id: 'msg-3',
        type: 'reply',
        senderName: 'Bob Wilson',
        senderEmail: 'bob.wilson@email.com',
        senderRole: 'user',
        content: 'It worked! Accepted. Thank you so much for the quick fix!',
        timestamp: 'Apr 8, 2026 14:15',
        isRead: true,
      },
      {
        id: 'msg-4',
        type: 'reply',
        senderName: 'James Miller',
        senderEmail: 'james.miller@prepmate.io',
        senderRole: 'admin',
        content: "Great to hear, Bob! I've also run a sweep to check for similar test case issues across other problems — found 2 more that we've now fixed. Thanks for the report! I'm marking this as resolved. Happy coding! 🎉",
        timestamp: 'Apr 8, 2026 14:22',
        isRead: true,
      },
    ],
    timeline: [
      { id: 'tl-1', type: 'created', description: 'Ticket opened by Bob Wilson', actor: 'Bob Wilson', timestamp: 'Apr 8, 2026 10:00' },
      { id: 'tl-2', type: 'assigned', description: 'Auto-assigned to James Miller', actor: 'System', timestamp: 'Apr 8, 2026 10:05' },
      { id: 'tl-3', type: 'message_sent', description: 'Reply sent to user', actor: 'James Miller', timestamp: 'Apr 8, 2026 10:32' },
      { id: 'tl-4', type: 'status_changed', description: 'Status: In Progress → Resolved', actor: 'James Miller', timestamp: 'Apr 8, 2026 14:22' },
    ],
  },
  {
    id: 'TCK-10229',
    userId: '6',
    userName: 'Sara Lee',
    userEmail: 'sara.lee@email.com',
    subject: 'Feature request: Dark mode for code editor',
    status: 'open',
    priority: 'low',
    tags: ['feature_request'],
    createdAt: 'Apr 7, 2026 11:00',
    updatedAt: 'Apr 7, 2026 11:00',
    lastActivity: '2 days ago',
    assignedTo: undefined,
    assignedToId: undefined,
    slaFirstResponse: null,
    slaResolution: null,
    slaDue: 'Apr 9, 2026 11:00',
    slaBreached: true,
    linkedTickets: [],
    messages: [
      {
        id: 'msg-1',
        type: 'reply',
        senderName: 'Sara Lee',
        senderEmail: 'sara.lee@email.com',
        senderRole: 'user',
        content: "Would love to have a dark mode option in the code editor! The current light theme is straining my eyes during long late-night sessions. Even a simple Monaco editor theme switch would be amazing. Is this on the roadmap? Many competitive programmers prefer darker themes.",
        timestamp: 'Apr 7, 2026 11:00',
        isRead: false,
      },
    ],
    timeline: [
      { id: 'tl-1', type: 'created', description: 'Ticket opened by Sara Lee', actor: 'Sara Lee', timestamp: 'Apr 7, 2026 11:00' },
    ],
  },
  {
    id: 'TCK-10228',
    userId: '3',
    userName: 'Bob Wilson',
    userEmail: 'bob.wilson@email.com',
    subject: 'Leaderboard score not updating after accepted submissions',
    status: 'closed',
    priority: 'medium',
    assignedTo: 'James Miller',
    assignedToId: 'adm-2',
    tags: ['bug'],
    createdAt: 'Apr 5, 2026 09:00',
    updatedAt: 'Apr 6, 2026 14:00',
    lastActivity: '3 days ago',
    slaFirstResponse: '1h 5min',
    slaResolution: '29h',
    slaDue: 'Apr 7, 2026 09:00',
    slaBreached: false,
    linkedTickets: ['TCK-10232'],
    messages: [
      {
        id: 'msg-1',
        type: 'reply',
        senderName: 'Bob Wilson',
        senderEmail: 'bob.wilson@email.com',
        senderRole: 'user',
        content: "I've solved 5 problems today (all accepted) but my global leaderboard rank hasn't changed. It's been 6 hours. Is there a sync delay or is this a bug?",
        timestamp: 'Apr 5, 2026 09:00',
        isRead: true,
      },
      {
        id: 'msg-2',
        type: 'reply',
        senderName: 'James Miller',
        senderEmail: 'james.miller@prepmate.io',
        senderRole: 'admin',
        content: "Hi Bob! We are aware of a leaderboard sync delay affecting some users — our ranking service had a queue backup. The scores will be recalculated and updated within the next few hours. Thanks for your patience!",
        timestamp: 'Apr 5, 2026 10:05',
        isRead: true,
      },
      {
        id: 'msg-3',
        type: 'reply',
        senderName: 'Bob Wilson',
        senderEmail: 'bob.wilson@email.com',
        senderRole: 'user',
        content: "Thanks for the update! I'll wait.",
        timestamp: 'Apr 5, 2026 10:30',
        isRead: true,
      },
      {
        id: 'msg-4',
        type: 'reply',
        senderName: 'James Miller',
        senderEmail: 'james.miller@prepmate.io',
        senderRole: 'admin',
        content: "Update: the fix has been deployed and the leaderboard sync is back to real-time. Your rank should now reflect all your recent submissions. Sorry for the delay! Marking this resolved.",
        timestamp: 'Apr 6, 2026 14:00',
        isRead: true,
      },
    ],
    timeline: [
      { id: 'tl-1', type: 'created', description: 'Ticket opened by Bob Wilson', actor: 'Bob Wilson', timestamp: 'Apr 5, 2026 09:00' },
      { id: 'tl-2', type: 'assigned', description: 'Auto-assigned to James Miller', actor: 'System', timestamp: 'Apr 5, 2026 09:10' },
      { id: 'tl-3', type: 'status_changed', description: 'Status: Open → In Progress', actor: 'James Miller', timestamp: 'Apr 5, 2026 10:05' },
      { id: 'tl-4', type: 'status_changed', description: 'Status: In Progress → Resolved', actor: 'James Miller', timestamp: 'Apr 6, 2026 14:00' },
      { id: 'tl-5', type: 'status_changed', description: 'Status: Resolved → Closed (auto)', actor: 'System', timestamp: 'Apr 7, 2026 14:00' },
    ],
  },
];

// ── Config Maps ────────────────────────────────────────────────────────────

export const ticketStatusConfig: Record<
  TicketStatus,
  { label: string; textClass: string; bgClass: string; borderClass: string; dotClass: string }
> = {
  open: {
    label: 'Open',
    textClass: 'text-blue-700 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    borderClass: 'border-blue-200 dark:border-blue-800',
    dotClass: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    textClass: 'text-amber-700 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  waiting_for_user: {
    label: 'Waiting',
    textClass: 'text-violet-700 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-900/20',
    borderClass: 'border-violet-200 dark:border-violet-800',
    dotClass: 'bg-violet-500',
  },
  resolved: {
    label: 'Resolved',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  closed: {
    label: 'Closed',
    textClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    borderClass: 'border-border',
    dotClass: 'bg-muted-foreground',
  },
};

export const ticketPriorityConfig: Record<
  TicketPriority,
  { label: string; textClass: string; bgClass: string; borderClass: string; dotClass: string }
> = {
  low: {
    label: 'Low',
    textClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    borderClass: 'border-border',
    dotClass: 'bg-muted-foreground',
  },
  medium: {
    label: 'Medium',
    textClass: 'text-sky-700 dark:text-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-900/20',
    borderClass: 'border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-500',
  },
  high: {
    label: 'High',
    textClass: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-900/20',
    borderClass: 'border-orange-200 dark:border-orange-800',
    dotClass: 'bg-orange-500',
  },
  urgent: {
    label: 'Urgent',
    textClass: 'text-red-700 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    borderClass: 'border-red-200 dark:border-red-800',
    dotClass: 'bg-red-500',
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getTicketById(id: string): SupportTicket | undefined {
  return mockTickets.find((t) => t.id === id);
}

export function getTicketsByUser(userId: string): SupportTicket[] {
  return mockTickets.filter((t) => t.userId === userId);
}

export function getUnreadCount(ticket: SupportTicket): number {
  return ticket.messages.filter((m) => !m.isRead && m.senderRole === 'user').length;
}

export function getTicketStats() {
  const open = mockTickets.filter((t) => t.status === 'open').length;
  const inProgress = mockTickets.filter((t) => t.status === 'in_progress').length;
  const waitingForUser = mockTickets.filter((t) => t.status === 'waiting_for_user').length;
  const resolved = mockTickets.filter((t) => t.status === 'resolved').length;
  const slaBreached = mockTickets.filter((t) => t.slaBreached).length;
  const unassigned = mockTickets.filter((t) => !t.assignedTo && t.status !== 'resolved' && t.status !== 'closed').length;
  return { open, inProgress, waitingForUser, resolved, slaBreached, unassigned };
}
