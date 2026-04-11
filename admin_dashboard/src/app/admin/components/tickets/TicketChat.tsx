import { useState, useRef, useEffect } from 'react';
import { Send, Lock, ChevronDown, Paperclip, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { TicketMessage, cannedResponses } from '../../data/ticketData';
import { MessageBubble } from './MessageBubble';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';

interface TicketChatProps {
  messages: TicketMessage[];
  onSendMessage: (content: string, type: 'reply' | 'internal_note') => void;
  isResolved: boolean;
  isClosed: boolean;
  isSimulatingReply?: boolean;
}

export function TicketChat({
  messages,
  onSendMessage,
  isResolved,
  isClosed,
  isSimulatingReply = false,
}: TicketChatProps) {
  const [replyContent, setReplyContent] = useState('');
  const [messageType, setMessageType] = useState<'reply' | 'internal_note'>('reply');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSimulatingReply]);

  const handleSend = async () => {
    if (!replyContent.trim() || isSending || isResolved || isClosed) return;
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 400));
    onSendMessage(replyContent.trim(), messageType);
    setReplyContent('');
    setIsSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCannedResponse = (content: string) => {
    setReplyContent((prev) => (prev ? prev + '\n\n' + content : content));
    textareaRef.current?.focus();
  };

  const isLocked = isResolved || isClosed;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Typing indicator */}
            {isSimulatingReply && (
              <div className="flex gap-2.5 flex-row-reverse">
                <div className="flex size-7 shrink-0 mt-0.5 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-[11px] text-primary">SC</span>
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tr-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Reply area */}
      <div className="px-4 py-3 shrink-0">
        {isLocked ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 py-3 border border-border">
            <Lock className="size-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              This ticket is {isResolved ? 'resolved' : 'closed'} — reopen to reply
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Mode tabs */}
            <div className="flex items-center justify-between">
              <Tabs
                value={messageType}
                onValueChange={(v) => setMessageType(v as 'reply' | 'internal_note')}
              >
                <TabsList className="h-7 p-0.5">
                  <TabsTrigger value="reply" className="h-6 px-3 text-xs">
                    Reply to User
                  </TabsTrigger>
                  <TabsTrigger value="internal_note" className="h-6 px-3 text-xs gap-1">
                    <Lock className="size-2.5" />
                    Internal Note
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Canned responses */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
                    Canned responses
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Replies</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {cannedResponses.map((cr) => (
                    <DropdownMenuItem
                      key={cr.id}
                      onClick={() => handleCannedResponse(cr.content)}
                      className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                    >
                      <span className="text-sm">{cr.label}</span>
                      <span className="text-[11px] text-muted-foreground line-clamp-1">{cr.content}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Input + send row */}
            <div
              className={cn(
                'rounded-lg border transition-colors',
                messageType === 'internal_note'
                  ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10'
                  : 'border-border bg-card focus-within:border-primary/40'
              )}
            >
              <Textarea
                ref={textareaRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  messageType === 'internal_note'
                    ? 'Add an internal note (not visible to user)... @mention admins'
                    : 'Write your reply... (Cmd+Enter to send)'
                }
                className={cn(
                  'min-h-[90px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm',
                  messageType === 'internal_note' && 'placeholder:text-amber-600/50'
                )}
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-inherit">
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                  <Paperclip className="size-3.5" />
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground/60">⌘↵ to send</span>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!replyContent.trim() || isSending}
                    className={cn(
                      'h-7 gap-1.5 text-xs',
                      messageType === 'internal_note' &&
                        'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                    )}
                  >
                    {isSending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    {messageType === 'internal_note' ? 'Add Note' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}