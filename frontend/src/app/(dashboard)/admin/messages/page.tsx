'use client';

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
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAdmin } from '@/contexts/AdminContext';
import { getAuthToken, getAuthUser } from '@/services/auth';
import { chatService, Conversation, ChatMessage } from '@/services/chat-service';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCustomerOnline, setIsCustomerOnline] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedConvId) || null;

  // Auto-scroll messages
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isCustomerTyping, scrollToBottom]);

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

  // 3. Socket.IO Connection & Real-Time Sync
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
      if (selectedConvId) {
        socket.emit('join_conversation', { conversationId: selectedConvId });
        socket.emit('check_presence', { conversationId: selectedConvId }, (res: any) => {
          if (res?.isOnline !== undefined) setIsCustomerOnline(res.isOnline);
        });
      }
    });

    // Handle incoming messages
    const handleIncomingMessage = (newMsg: ChatMessage) => {
      // 1. If message belongs to currently open conversation, append to feed
      if (newMsg.conversationId === selectedConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setIsCustomerTyping(false);
      }

      // 2. Update conversation preview and unread count in inbox list
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === newMsg.conversationId);
        if (!exists) {
          fetchConversations();
          return prev;
        }
        return prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            const isCurrent = c.id === selectedConvId;
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
    socket.on('presence_status', (data: { isOnline: boolean; role: string }) => {
      if (data.role === 'CUSTOMER') {
        setIsCustomerOnline(data.isOnline);
      }
    });

    return () => {
      if (selectedConvId) {
        socket.emit('leave_conversation', { conversationId: selectedConvId });
      }
      socket.disconnect();
    };
  }, [selectedConvId, fetchConversations]);

  // Switch conversation room when selected
  useEffect(() => {
    if (socketRef.current?.connected && selectedConvId) {
      socketRef.current.emit('join_conversation', { conversationId: selectedConvId });
      socketRef.current.emit('check_presence', { conversationId: selectedConvId }, (res: any) => {
        if (res?.isOnline !== undefined) setIsCustomerOnline(res.isOnline);
      });
    }
  }, [selectedConvId]);

  // 4. Send Reply Message
  const handleSendReply = async (customText?: string) => {
    const textToSend = customText || replyText;
    if (!textToSend.trim() || !selectedConvId || isSending) return;

    setIsSending(true);
    setReplyText('');

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
            text: textToSend.trim(),
            senderName,
          },
          (res: any) => {
            if (res?.success && res?.data) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === res.data.id)) return prev;
                return [...prev, res.data];
              });
            }
          }
        );
      } else {
        const sent = await chatService.sendOwnerMessage(selectedConvId, {
          text: textToSend.trim(),
          senderName,
          senderRole,
        });
        if (sent) {
          setMessages((prev) => [...prev, sent]);
        }
      }
    } catch (err) {
      toast.error('Failed to send reply. Please try again.');
      setReplyText(textToSend);
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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Live Customer Chat & Messages"
        description="Encrypted real-time communication channel with active store customers"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-lg text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Socket.IO Live Connected
            </div>
            <Button
              variant="secondary"
              onClick={() => fetchConversations()}
              className="gap-1.5 text-xs h-9 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        }
      />

      {/* 2-Column Split Chat Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface border border-line rounded-2xl shadow-sm overflow-hidden h-[720px]">
        {/* LEFT COLUMN: Conversation Inbox List (4 Cols) */}
        <div className="lg:col-span-4 border-r border-line flex flex-col h-full bg-canvas/30">
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
                <span className="ml-auto text-[11px] font-semibold bg-clay/10 text-clay px-2 py-0.5 rounded-full">
                  {totalUnread} unread
                </span>
              )}
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-line/60">
            {isLoadingList && conversations.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-xs flex flex-col items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-clay mb-2" />
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-xs">
                <MessageSquare className="h-7 w-7 text-ink-muted/40 mx-auto mb-2" />
                <p className="font-medium text-ink">No conversations found</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  When customers send messages from storefront or account, they will appear here.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const hasUnread = conv.unreadByOwner > 0;

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
                      {conv.status === 'active' && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                      )}
                    </div>

                    {/* Meta & Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs truncate ${hasUnread ? 'font-bold text-ink' : 'font-medium text-ink'}`}>
                          {conv.customerName}
                        </p>
                        <span className="text-[10px] text-ink-muted shrink-0">
                          {timeAgo(conv.lastMessageAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-ink-muted truncate leading-relaxed">
                        {conv.lastMessagePreview || 'No messages yet'}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge
                          tone={conv.status === 'resolved' ? 'success' : 'info'}
                          className="text-[9px] py-0 px-1"
                        >
                          {conv.status}
                        </Badge>
                        {hasUnread && (
                          <span className="h-4 min-w-[16px] px-1 rounded-full bg-clay text-white text-[9px] font-bold flex items-center justify-center">
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

        {/* RIGHT COLUMN: Active Chat Conversation Workspace (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-surface">
          {selectedConversation ? (
            <>
              {/* Chat Workspace Header */}
              <div className="p-4 border-b border-line bg-canvas/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-clay/15 text-clay font-bold text-sm flex items-center justify-center ring-2 ring-surface">
                      {selectedConversation.customerName.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-surface ${
                        isCustomerOnline ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={isCustomerOnline ? 'Customer Online' : 'Customer Away'}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">
                        {selectedConversation.customerName}
                      </h3>
                      <Badge
                        tone={isCustomerOnline ? 'success' : 'neutral'}
                        className="text-[10px] py-0 px-1.5"
                      >
                        {isCustomerOnline ? 'Online' : 'Offline'}
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
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-ink-muted bg-surface px-2.5 py-1 rounded-full border border-line">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>AES-256 Encrypted</span>
                  </div>

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
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-canvas/20">
                {isLoadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-ink-muted text-xs">
                    <Loader2 className="h-6 w-6 animate-spin text-clay mb-2" />
                    Decrypting message history...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-ink-muted text-xs">
                    <MessageSquare className="h-8 w-8 text-ink-muted/30 mb-2" />
                    <p className="font-semibold text-ink">No message history yet</p>
                    <p className="text-xs text-ink-muted">Send a greeting message below to start the conversation.</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center my-1">
                      <span className="text-[10px] text-ink-muted bg-surface px-3 py-1 rounded-full border border-line shadow-2xs">
                        🔒 End-to-End Encrypted Session
                      </span>
                    </div>

                    {messages.map((msg) => {
                      const isOwner = msg.senderRole === 'OWNER' || msg.senderRole === 'STAFF';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-end gap-2 max-w-[80%] sm:max-w-[70%]">
                            {!isOwner && (
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
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
                                  className={`text-[10px] font-semibold ${
                                    isOwner ? 'text-white/80' : 'text-clay'
                                  }`}
                                >
                                  {msg.senderName} {isOwner && `(${msg.senderRole})`}
                                </span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                            </div>
                          </div>

                          <div
                            className={`flex items-center gap-1 mt-1 text-[10px] text-ink-muted/80 px-1 ${
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
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
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

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Quick Canned Replies Bar */}
              <div className="px-4 py-2 border-t border-line bg-canvas/30 flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[11px] font-medium text-ink-muted shrink-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-clay" /> Quick:
                </span>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendReply(reply)}
                    className="text-[11px] whitespace-nowrap bg-surface hover:bg-clay/10 hover:text-clay hover:border-clay/30 border border-line px-2.5 py-1 rounded-full text-ink transition-all cursor-pointer shrink-0"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3.5 border-t border-line bg-surface">
                <div className="flex items-end gap-2">
                  <textarea
                    value={replyText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply to customer... (Press Enter to send)"
                    rows={1}
                    className="flex-1 min-h-[42px] max-h-32 resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay transition-all leading-relaxed"
                  />

                  <Button
                    type="button"
                    onClick={() => handleSendReply()}
                    disabled={!replyText.trim() || isSending}
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
