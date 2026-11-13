'use client';


import { asApiError } from '@/lib/api-error';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  User,
  Mail,
  Phone,
  Filter,
  RefreshCw,
  CheckCheck,
  ShieldCheck,
  Sparkles,
  Archive,
  Circle,
  Loader2,
  ChevronRight,
  HelpCircle,
  ShoppingBag,
  Paperclip,
  X,
  FileText,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAdmin } from '@/contexts/AdminContext';
import { getAuthToken, getAuthUser } from '@/services/auth';
import {
  chatService,
  Conversation,
  ChatMessage,
  CHAT_FILE_ACCEPT,
  CHAT_MAX_ATTACHMENTS,
  validateChatAttachment,
  isChatImageUrl,
} from '@/services/chat-service';
import { ChatMessageAttachments } from '@/components/store/chat/ChatMessageAttachments';
import { ChatMessageText } from '@/components/store/chat/ChatMessageText';
import { usePendingCloudUploads } from '@/hooks/usePendingCloudUploads';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, timeAgo } from '@/utils/format';

const quickReplies = [
  'Hello! How can I assist you today?',
  'Thank you for reaching out! Let me check that for you right away.',
  'Your order is currently being processed and will ship soon.',
  'Is there anything else I can help you with?',
];

export default function AdminMessagesPage() {
  const { user } = useAdmin();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCustomerOnline, setIsCustomerOnline] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [onlineConvIds, setOnlineConvIds] = useState<Set<string>>(new Set());

  const pendingUploads = usePendingCloudUploads({
    max: CHAT_MAX_ATTACHMENTS,
    discardRemote: async (item) => {
      await chatService.discardAttachment(
        item.publicId || item.url,
        'owner',
        item.resourceType,
      );
    },
  });

  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedConvIdRef = useRef<string | null>(null);
  selectedConvIdRef.current = selectedConvId;
  const prevConvIdRef = useRef<string | null>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedConvId) || null;

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isCustomerTyping]);

  // 1. Fetch Conversations List
  const fetchConversations = useCallback(
    async (selectFirst = false) => {
      try {
        setIsLoadingList(true);
        const res = await chatService.getOwnerConversations({
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search.trim() || undefined,
        });

        const items = res.items || [];
        setConversations(items);
        setTotalUnread(res.meta?.totalUnread || 0);

        if (selectFirst && items.length > 0 && !selectedConvId) {
          setSelectedConvId(items[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setIsLoadingList(false);
      }
    },
    [statusFilter, search, selectedConvId]
  );

  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  // 2. Fetch Messages for Selected Conversation
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await chatService.getOwnerMessages(convId);
      if (res?.messages) {
        setMessages(res.messages);
      }

      // Optimistically clear unread count for this conversation in list
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadByOwner: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId, fetchMessages]);

  // 3. Socket.IO Connection & Real-Time Sync (Maintained continuously)
  useEffect(() => {
    const token = getAuthToken();
    const storedUser = getAuthUser();
    const tenantId = storedUser?.tenantId;

    if (!token) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
      'http://localhost:5000';

    const socket: Socket = io(`${socketUrl}/chat`, {
      auth: {
        token,
        tenantId,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      const currentConvId = selectedConvIdRef.current;
      if (currentConvId) {
        socket.emit('join_conversation', { conversationId: currentConvId }, (res: { isOtherPartyOnline?: boolean }) => {
          if (res?.isOtherPartyOnline !== undefined) setIsCustomerOnline(res.isOtherPartyOnline);
        });
        socket.emit('check_presence', { conversationId: currentConvId }, (res: { isOnline?: boolean }) => {
          if (res?.isOnline !== undefined) {
            setIsCustomerOnline(res.isOnline);
            if (res.isOnline) setOnlineConvIds((prev) => new Set(prev).add(currentConvId));
          }
        });
      }
    });

    // Handle incoming messages
    const handleIncomingMessage = (newMsg: ChatMessage) => {
      const currentConvId = selectedConvIdRef.current;
      if (newMsg.conversationId === currentConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setIsCustomerTyping(false);
      }

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === newMsg.conversationId);
        if (!exists) {
          fetchConversations();
          return prev;
        }
        return prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            const isCurrent = c.id === currentConvId;
            return {
              ...c,
              lastMessagePreview: newMsg.text,
              lastMessageAt: newMsg.createdAt,
              unreadByOwner: isCurrent ? 0 : c.unreadByOwner + 1,
            };
          }
          return c;
        });
      });
    };

    socket.on('new_message', handleIncomingMessage);
    socket.on('receive_message', handleIncomingMessage);

    // Typing indicators
    socket.on('user_typing', (data: { role: string; isTyping: boolean }) => {
      if (data.role === 'CUSTOMER') {
        setIsCustomerTyping(data.isTyping);
      }
    });

    // Presence updates
    socket.on('presence_status', (data: { conversationId?: string; isOnline: boolean; role: string }) => {
      if (data.role === 'CUSTOMER') {
        if (data.conversationId) {
          setOnlineConvIds((prev) => {
            const next = new Set(prev);
            if (data.isOnline) next.add(data.conversationId!);
            else next.delete(data.conversationId!);
            return next;
          });
          if (data.conversationId === selectedConvIdRef.current) {
            setIsCustomerOnline(data.isOnline);
          }
        } else {
          setIsCustomerOnline(data.isOnline);
        }
      }
    });

    return () => {
      if (selectedConvIdRef.current) {
        socket.emit('leave_conversation', { conversationId: selectedConvIdRef.current });
      }
      socket.disconnect();
    };
  }, [fetchConversations]);

  // Switch conversation room when selected
  useEffect(() => {
    if (!socketRef.current?.connected) return;

    if (prevConvIdRef.current && prevConvIdRef.current !== selectedConvId) {
      socketRef.current.emit('leave_conversation', { conversationId: prevConvIdRef.current });
    }

    if (selectedConvId) {
      prevConvIdRef.current = selectedConvId;
      socketRef.current.emit('join_conversation', { conversationId: selectedConvId }, (res: { isOtherPartyOnline?: boolean }) => {
        if (res?.isOtherPartyOnline !== undefined) setIsCustomerOnline(res.isOtherPartyOnline);
      });
      socketRef.current.emit('check_presence', { conversationId: selectedConvId }, (res: { isOnline?: boolean }) => {
        if (res?.isOnline !== undefined) {
          setIsCustomerOnline(res.isOnline);
          if (res.isOnline) {
            setOnlineConvIds((prev) => new Set(prev).add(selectedConvId));
          } else {
            setOnlineConvIds((prev) => {
              const next = new Set(prev);
              next.delete(selectedConvId);
              return next;
            });
          }
        }
      });
    }
  }, [selectedConvId]);

  // Discard unsent Cloudinary uploads when switching conversations
  useEffect(() => {
    return () => {
      void pendingUploads.discardAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on conversation change
  }, [selectedConvId]);

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (pendingUploads.atLimit) {
      toast.error(`Maximum ${CHAT_MAX_ATTACHMENTS} attachments per message`);
      return;
    }
    const invalid = validateChatAttachment(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }

    setUploadingFile(true);
    try {
      const uploaded = await chatService.uploadAttachment(file, 'owner');
      if (uploaded?.url) {
        pendingUploads.add({
          url: uploaded.url,
          publicId: uploaded.publicId || uploaded.url,
          mimeType: uploaded.mimeType || file.type,
          name: uploaded.name || file.name,
          resourceType:
            uploaded.resourceType ||
            (file.type === 'application/pdf' ? 'raw' : 'image'),
          size: uploaded.size ?? file.size,
        });
      } else {
        toast.error('Upload failed');
      }
    } catch (err: unknown) {
      toast.error(asApiError(err).message || 'Could not upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  // 4. Send Reply Message
  const handleSendReply = async (customText?: string) => {
    const textToSend = customText || replyText;
    const snapshot = pendingUploads.items;
    const attachmentUrls = snapshot.map((a) => a.url);
    if (
      (!textToSend.trim() && attachmentUrls.length === 0) ||
      !selectedConvId ||
      isSending
    ) {
      return;
    }

    stickToBottomRef.current = true;
    setIsSending(true);
    setReplyText('');
    pendingUploads.commit();

    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { conversationId: selectedConvId });
    }

    try {
      const storedUser = getAuthUser();
      const senderName = user?.name || storedUser?.name || 'Store Support';
      const senderRole = storedUser?.isOwner ? 'OWNER' : 'STAFF';

      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'send_message',
          {
            conversationId: selectedConvId,
            text: textToSend.trim() || undefined,
            senderName,
            attachments: attachmentUrls.length ? attachmentUrls : undefined,
          },
          (res: { success?: boolean; data?: ChatMessage }) => {
            if (res?.success && res.data) {
              const message = res.data;
              setMessages((prev) => {
                if (prev.some((m) => m.id === message.id)) return prev;
                return [...prev, message];
              });
            }
          }
        );
      } else {
        const sent = await chatService.sendOwnerMessage(selectedConvId, {
          text: textToSend.trim() || undefined,
          senderName,
          senderRole,
          attachments: attachmentUrls.length ? attachmentUrls : undefined,
        });
        if (sent) {
          setMessages((prev) => [...prev, sent]);
        }
      }
    } catch (err) {
      toast.error('Failed to send reply. Please try again.');
      setReplyText(textToSend);
      pendingUploads.restore(snapshot);
    } finally {
      setIsSending(false);
    }
  };

  // 5. Handle Typing Trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);

    if (socketRef.current && selectedConvId) {
      socketRef.current.emit('typing_start', { conversationId: selectedConvId });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing_stop', { conversationId: selectedConvId });
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // 6. Toggle Status (Resolve / Re-open)
  const handleToggleStatus = async () => {
    if (!selectedConversation) return;
    const newStatus = selectedConversation.status === 'resolved' ? 'active' : 'resolved';
    try {
      await chatService.updateConversationStatus(selectedConversation.id, newStatus);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConversation.id ? { ...c, status: newStatus } : c))
      );
      toast.success(`Conversation marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[32rem] flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <PageHeader
          title="Messages"
          description="Live chat with customers — reply, resolve, and track conversations"
        />
      </div>

      {/* Split inbox + chat — fills remaining height; message pane scrolls independently */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm md:flex-row">
        {/* LEFT: Conversation inbox */}
        <div className="flex max-h-[34%] min-h-[9rem] w-full shrink-0 flex-col overflow-hidden border-b border-line bg-canvas/30 md:max-h-none md:h-full md:w-[16.5rem] md:border-b-0 md:border-r xl:w-[19rem]">
          {/* Search & Filter Bar */}
          <div className="p-3.5 border-b border-line space-y-2 bg-surface">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers or text..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-line bg-canvas focus:outline-none focus:ring-1 focus:ring-clay"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              {['all', 'active', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize cursor-pointer transition-colors ${
                    statusFilter === st
                      ? 'bg-clay text-white shadow-2xs'
                      : 'text-ink-muted hover:text-ink hover:bg-subtle'
                  }`}
                >
                  {st}
                </button>
              ))}
              {totalUnread > 0 && (
                <span className="ml-auto text-xs font-semibold bg-clay/10 text-clay px-2 py-0.5 rounded-full">
                  {totalUnread} unread
                </span>
              )}
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-line/60">
            {isLoadingList && conversations.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-xs flex flex-col items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-clay mb-2" />
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-xs">
                <MessageSquare className="h-7 w-7 text-ink-muted/40 mx-auto mb-2" />
                <p className="font-medium text-ink">No conversations found</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  When customers send messages from storefront or account, they will appear here.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const hasUnread = conv.unreadByOwner > 0;
                const isOnline = onlineConvIds.has(conv.id);

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3.5 transition-all cursor-pointer relative group flex items-start gap-3 ${
                      isSelected
                        ? 'bg-surface border-l-4 border-l-clay shadow-2xs'
                        : hasUnread
                        ? 'bg-clay/5 hover:bg-clay/10'
                        : 'hover:bg-surface/80'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-clay/10 text-clay font-bold text-xs flex items-center justify-center ring-1 ring-line">
                        {conv.customerName.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <span
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface"
                          title="Customer Online"
                        />
                      )}
                    </div>

                    {/* Meta & Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs truncate ${hasUnread ? 'font-bold text-ink' : 'font-medium text-ink'}`}>
                          {conv.customerName}
                        </p>
                        <span className="text-xs text-ink-muted shrink-0">
                          {timeAgo(conv.lastMessageAt)}
                        </span>
                      </div>

                      <p className="text-xs text-ink-muted truncate leading-relaxed">
                        {conv.lastMessagePreview || 'No messages yet'}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge
                          tone={conv.status === 'resolved' ? 'success' : 'info'}
                          className="text-xs py-0 px-1"
                        >
                          {conv.status}
                        </Badge>
                        {hasUnread && (
                          <span className="h-4 min-w-[16px] px-1 rounded-full bg-clay text-white text-xs font-bold flex items-center justify-center">
                            {conv.unreadByOwner}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Active conversation */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface">
          {selectedConversation ? (
            <>
              {/* Chat Workspace Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-line bg-canvas/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-clay/15 text-clay font-bold text-sm flex items-center justify-center ring-2 ring-surface">
                      {selectedConversation.customerName.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-surface ${
                        (isCustomerOnline || onlineConvIds.has(selectedConversation.id)) ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={(isCustomerOnline || onlineConvIds.has(selectedConversation.id)) ? 'Customer Online' : 'Customer Offline'}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">
                        {selectedConversation.customerName}
                      </h3>
                      <Badge
                        tone={(isCustomerOnline || onlineConvIds.has(selectedConversation.id)) ? 'success' : 'neutral'}
                        className="text-xs py-0 px-1.5"
                      >
                        {(isCustomerOnline || onlineConvIds.has(selectedConversation.id)) ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-muted flex items-center gap-2 mt-0.5">
                      {selectedConversation.customerEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {selectedConversation.customerEmail}
                        </span>
                      )}
                      {selectedConversation.customerPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {selectedConversation.customerPhone}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleToggleStatus}
                    className="text-xs h-8 px-3 gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {selectedConversation.status === 'resolved' ? 'Re-open' : 'Resolve'}
                  </Button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-canvas/20 p-5"
              >
                {isLoadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-ink-muted text-xs">
                    <Loader2 className="h-6 w-6 animate-spin text-clay mb-2" />
                    Loading message history...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-ink-muted text-xs">
                    <MessageSquare className="h-8 w-8 text-ink-muted/30 mb-2" />
                    <p className="font-semibold text-ink">No message history yet</p>
                    <p className="text-xs text-ink-muted">Send a greeting message below to start the conversation.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isOwner = msg.senderRole === 'OWNER' || msg.senderRole === 'STAFF';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-end gap-2 max-w-[80%] sm:max-w-[70%]">
                            {!isOwner && (
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {msg.senderName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                                isOwner
                                  ? 'bg-clay text-white rounded-br-xs'
                                  : 'bg-surface border border-line text-ink rounded-bl-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span
                                  className={`text-xs font-semibold ${
                                    isOwner ? 'text-white/80' : 'text-clay'
                                  }`}
                                >
                                  {msg.senderName} {isOwner && `(${msg.senderRole})`}
                                </span>
                              </div>
                              {msg.text && msg.text !== '[Attachment]' ? (
                                <ChatMessageText
                                  text={msg.text}
                                  role="admin"
                                  tone={isOwner ? 'dark' : 'light'}
                                />
                              ) : null}
                              <ChatMessageAttachments
                                attachments={msg.attachments}
                                tone={isOwner ? 'dark' : 'light'}
                              />
                            </div>
                          </div>

                          <div
                            className={`flex items-center gap-1 mt-1 text-xs text-ink-muted/80 px-1 ${
                              isOwner ? 'pr-1' : 'pl-9'
                            }`}
                          >
                            <span>{formatDateTime(msg.createdAt)}</span>
                            {isOwner && <CheckCheck className="h-3 w-3 text-clay/80 inline" />}
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing Indicator */}
                    {isCustomerTyping && (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {selectedConversation.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-surface border border-line rounded-2xl rounded-bl-xs px-3.5 py-2 flex items-center gap-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 bg-clay rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-clay rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-clay rounded-full animate-bounce" />
                          <span className="text-xs text-ink-muted ml-1">
                            {selectedConversation.customerName} is typing...
                          </span>
                        </div>
                      </div>
                    )}

                  </>
                )}
              </div>

              {/* Quick Canned Replies Bar (Clean, no horizontal scrollbar track) */}
              <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-line bg-canvas/30 px-4 py-2 scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <span className="text-xs font-medium text-ink-muted shrink-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-clay" /> Quick:
                </span>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendReply(reply)}
                    className="text-xs whitespace-nowrap bg-surface hover:bg-clay/10 hover:text-clay hover:border-clay/30 border border-line px-2.5 py-1 rounded-full text-ink transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="shrink-0 border-t border-line bg-surface p-3.5">
                {pendingUploads.items.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {pendingUploads.items.map((item) => (
                      <div key={item.key} className="relative">
                        {isChatImageUrl(item.url) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.url}
                            alt=""
                            className="h-14 w-14 rounded-lg border border-line object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-line bg-subtle text-ink">
                            <FileText className="h-5 w-5" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => pendingUploads.remove(item.key)}
                          className="absolute -right-1.5 -top-1.5 rounded-full bg-ink p-0.5 text-canvas cursor-pointer"
                          aria-label="Remove attachment"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={CHAT_FILE_ACCEPT}
                    className="hidden"
                    onChange={handleAttachFile}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile || pendingUploads.atLimit}
                    className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-line text-ink hover:bg-subtle cursor-pointer disabled:opacity-50"
                    aria-label="Attach file"
                    title="Attach image or PDF"
                  >
                    {uploadingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </button>
                  <textarea
                    value={replyText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply… (Enter to send)"
                    rows={1}
                    className="flex-1 min-h-[42px] max-h-32 resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay transition-all leading-relaxed"
                  />

                  <Button
                    type="button"
                    onClick={() => handleSendReply()}
                    disabled={
                      (!replyText.trim() && pendingUploads.count === 0) ||
                      isSending
                    }
                    className="h-[42px] px-4 rounded-xl cursor-pointer bg-clay hover:bg-clay/90 text-white flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="hidden sm:inline">Send Reply</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-ink-muted">
              <MessageSquare className="h-12 w-12 text-ink-muted/20 mb-3" />
              <h3 className="text-sm font-semibold text-ink">Select a conversation</h3>
              <p className="text-xs text-ink-muted max-w-xs mt-1">
                Choose a customer conversation from the left inbox to view real-time chat history and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
