'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
  Paperclip,
  CheckCheck,
  LifeBuoy,
  Plus,
  ChevronLeft,
  ShoppingBag,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/contexts/StoreContext';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { formatDateTime, timeAgo } from '@/utils/format';
import { getAuthToken, getAuthUser } from '@/services/auth';
import { chatService, ChatMessage, Conversation } from '@/services/chat-service';
import { supportTickets } from '@/data/customers';
import type { SupportTicket } from '@/types/commerce';

const quickPrompts = [
  { label: '📦 Track my order', text: 'Hi, can you give me an update on my recent order?' },
  { label: '🚚 Shipping & Delivery', text: 'How long does standard delivery take to my area?' },
  { label: '🔄 Return or Exchange', text: 'I would like to initiate a return or exchange.' },
  { label: '💳 Payment or Promo code', text: 'I have a question regarding a discount code and payment.' },
];

export default function AccountSupportPage() {
  const { user, orders } = useStore();
  const [activeTab, setActiveTab] = useState<'live_chat' | 'tickets'>('live_chat');

  // --- Live Chat State ---
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [isAgentOnline, setIsAgentOnline] = useState(true);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [attachedOrder, setAttachedOrder] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Formal Tickets State ---
  const [tickets, setTickets] = useState<SupportTicket[]>(supportTickets);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketDraft, setTicketDraft] = useState({ subject: '', order: '', message: '' });

  const activeTicket = tickets.find((t) => t.id === activeTicketId);
  const myOrders = orders.filter((o) => o.customerId === user?.id);

  // Auto-scroll to bottom of chat
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentTyping, scrollToBottom]);

  // 1. Initialize or Resume Customer Live Chat Session
  const initChatSession = useCallback(async () => {
    setChatLoading(true);
    try {
      const storedUser = getAuthUser();
      const customerName = user?.name || storedUser?.name || 'Customer';
      const customerEmail = user?.email || storedUser?.email;

      const conv = await chatService.initCustomerChat({
        customerName,
        customerEmail,
      });

      if (conv) {
        setConversation(conv);
        // Load decrypted message history
        const history = await chatService.getCustomerMessages(conv.id);
        if (history?.messages) {
          setMessages(history.messages);
        }
      }
    } catch (err) {
      console.error('Failed to initialize live chat:', err);
    } finally {
      setChatLoading(false);
    }
  }, [user]);

  useEffect(() => {
    initChatSession();
  }, [initChatSession]);

  // 2. Real-Time Socket.IO Connection for Live Chat
  useEffect(() => {
    if (!conversation?.id) return;

    const token = getAuthToken();
    const storedUser = getAuthUser();
    const tenantId = storedUser?.tenantId;

    const socketUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
      'http://localhost:5000';

    const socket: Socket = io(`${socketUrl}/chat`, {
      auth: {
        token: token || undefined,
        tenantId,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Join conversation room
      socket.emit('join_conversation', { conversationId: conversation.id }, (res: any) => {
        if (res?.isOtherPartyOnline) {
          setIsAgentOnline(true);
        }
      });
      // Check presence
      socket.emit('check_presence', { conversationId: conversation.id }, (res: any) => {
        if (res?.isOnline !== undefined) {
          setIsAgentOnline(res.isOnline);
        }
      });
    });

    // Receive live incoming messages
    const handleIncomingMessage = (newMsg: ChatMessage) => {
      if (newMsg.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setIsAgentTyping(false);
        // Mark read
        chatService.markCustomerRead(conversation.id);
      }
    };

    socket.on('new_message', handleIncomingMessage);
    socket.on('receive_message', handleIncomingMessage);

    // Typing indicators
    socket.on('user_typing', (data: { role: string; isTyping: boolean }) => {
      if (data.role !== 'CUSTOMER') {
        setIsAgentTyping(data.isTyping);
      }
    });

    // Presence updates
    socket.on('presence_status', (data: { isOnline: boolean; role: string }) => {
      if (data.role !== 'CUSTOMER') {
        setIsAgentOnline(data.isOnline);
      }
    });

    return () => {
      socket.emit('leave_conversation', { conversationId: conversation.id });
      socket.disconnect();
    };
  }, [conversation?.id]);

  // 3. Handle Send Message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || messageInput;
    if (!textToSend.trim() || !conversation || sending) return;

    const fullMessage = attachedOrder
      ? `[Order #${attachedOrder}]: ${textToSend.trim()}`
      : textToSend.trim();

    setSending(true);
    setMessageInput('');
    setAttachedOrder('');

    // Clear typing indicator
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { conversationId: conversation.id });
    }

    try {
      const storedUser = getAuthUser();
      const senderName = user?.name || storedUser?.name || 'Customer';

      // 1. Send via Socket for instant real-time broadcast if connected
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'send_message',
          {
            conversationId: conversation.id,
            text: fullMessage,
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
        // Fallback to REST API
        const sent = await chatService.sendCustomerMessage(conversation.id, {
          text: fullMessage,
          senderName,
          senderRole: 'CUSTOMER',
        });
        if (sent) {
          setMessages((prev) => [...prev, sent]);
        }
      }
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
      setMessageInput(textToSend);
    } finally {
      setSending(false);
    }
  };

  // 4. Handle Typing Indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (socketRef.current && conversation) {
      socketRef.current.emit('typing_start', { conversationId: conversation.id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing_stop', { conversationId: conversation.id });
      }, 1500);
    }
  };

  // 5. Keyboard Shortcut (Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Formal Ticket Actions ---
  const sendTicketReply = () => {
    if (!ticketReply.trim() || !activeTicket) return;
    setTickets((ts) =>
      ts.map((t) =>
        t.id === activeTicket.id
          ? {
              ...t,
              status: 'open',
              updatedAt: new Date().toISOString(),
              messages: [
                ...t.messages,
                {
                  from: 'customer',
                  name: user?.name ?? 'You',
                  text: ticketReply,
                  at: new Date().toISOString(),
                },
              ],
            }
          : t
      )
    );
    setTicketReply('');
    toast.success('Reply submitted');
  };

  const createNewTicket = () => {
    if (ticketDraft.subject.trim().length < 4 || ticketDraft.message.trim().length < 10) {
      return toast.error('Please provide a descriptive subject and message');
    }
    const t: SupportTicket = {
      id: `T-${2042 + tickets.length}`,
      subject: ticketDraft.subject,
      orderNumber: ticketDraft.order || undefined,
      status: 'open',
      updatedAt: new Date().toISOString(),
      messages: [
        {
          from: 'customer',
          name: user?.name ?? 'You',
          text: ticketDraft.message,
          at: new Date().toISOString(),
        },
      ],
    };
    setTickets([t, ...tickets]);
    setCreatingTicket(false);
    setTicketDraft({ subject: '', order: '', message: '' });
    setActiveTicketId(t.id);
    toast.success('Support ticket created — we usually reply within 4 hours');
  };

  return (
    <div className="max-w-4xl space-y-6">
      <AccountHeader
        title="Customer Support & Help Center"
        description="Chat directly with our support team or manage formal inquiry tickets"
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab('live_chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'live_chat'
              ? 'bg-clay text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-subtle'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Live Chat Support
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-clay text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-subtle'
          }`}
        >
          <LifeBuoy className="h-4 w-4" />
          Support Tickets ({tickets.length})
        </button>
      </div>

      {/* TAB 1: 💬 LIVE CHAT SUPPORT */}
      {activeTab === 'live_chat' && (
        <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px]">
          {/* Live Chat Top Header */}
          <div className="border-b border-line px-5 py-3.5 bg-canvas/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-clay/10 text-clay flex items-center justify-center font-semibold text-sm ring-2 ring-surface shadow-xs">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-surface ${
                    isAgentOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  title={isAgentOnline ? 'Support is Online' : 'Support is Away'}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink">Store Customer Support</h3>
                  <Badge tone={isAgentOnline ? 'success' : 'neutral'} className="text-[10px] py-0 px-1.5">
                    {isAgentOnline ? 'Online' : 'Away'}
                  </Badge>
                </div>
                <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                  <Sparkles className="h-3 w-3 text-clay" />
                  Live instant assistance & order inquiries
                </p>
              </div>
            </div>

            {/* End-to-End Encryption Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted bg-surface/80 border border-line px-2.5 py-1 rounded-full shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>AES-256 Encrypted</span>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-canvas/30">
            {chatLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-ink-muted">
                <Loader2 className="h-6 w-6 animate-spin text-clay mb-2" />
                <p className="text-xs">Connecting to secure chat channel...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                <div className="w-12 h-12 rounded-2xl bg-clay/10 text-clay flex items-center justify-center mb-3 shadow-xs">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-ink">Welcome to Store Support!</h4>
                <p className="text-xs text-ink-muted max-w-sm mt-1 mb-5">
                  Ask any questions regarding your orders, shipping, returns, or products. Our team is here to help.
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.text)}
                      className="text-left text-xs bg-surface border border-line hover:border-clay/40 hover:bg-clay/5 p-2.5 rounded-xl text-ink transition-all cursor-pointer shadow-2xs group flex items-center justify-between"
                    >
                      <span className="font-medium text-ink">{prompt.label}</span>
                      <Send className="h-3 w-3 text-ink-muted group-hover:text-clay opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="text-center my-2">
                  <span className="text-[11px] text-ink-muted bg-surface px-3 py-1 rounded-full border border-line shadow-2xs">
                    🔒 Chat is encrypted and protected
                  </span>
                </div>

                {messages.map((msg) => {
                  const isMe = msg.senderRole === 'CUSTOMER';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[82%] sm:max-w-[70%]">
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-clay/10 text-clay flex items-center justify-center text-[11px] font-bold shrink-0 ring-1 ring-line">
                            S
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                            isMe
                              ? 'bg-clay text-white rounded-br-xs'
                              : 'bg-surface border border-line text-ink rounded-bl-xs'
                          }`}
                        >
                          {!isMe && (
                            <p className="text-[10px] font-semibold text-clay mb-0.5">
                              {msg.senderName || 'Store Support'}
                            </p>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-1 mt-1 text-[10px] text-ink-muted/80 px-1 ${
                          isMe ? 'pr-1' : 'pl-9'
                        }`}
                      >
                        <span>{formatDateTime(msg.createdAt)}</span>
                        {isMe && <CheckCheck className="h-3 w-3 text-clay/80 inline" />}
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isAgentTyping && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-clay/10 text-clay flex items-center justify-center text-[11px] font-bold shrink-0">
                      S
                    </div>
                    <div className="bg-surface border border-line rounded-2xl rounded-bl-xs px-3.5 py-2 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 bg-clay rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-clay rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-clay rounded-full animate-bounce" />
                      <span className="text-xs text-ink-muted ml-1">Store Support is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Order Reference Attachment */}
          {attachedOrder && (
            <div className="px-4 py-1.5 bg-clay/10 border-t border-clay/20 flex items-center justify-between text-xs text-clay">
              <span className="flex items-center gap-1.5 font-medium">
                <ShoppingBag className="h-3.5 w-3.5" /> Attached context: Order #{attachedOrder}
              </span>
              <button
                type="button"
                onClick={() => setAttachedOrder('')}
                className="hover:underline text-[11px] cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3.5 border-t border-line bg-surface">
            <div className="flex items-center gap-2 mb-2">
              {/* Order selector chip */}
              {myOrders.length > 0 && (
                <select
                  value={attachedOrder}
                  onChange={(e) => setAttachedOrder(e.target.value)}
                  className="text-xs border border-line bg-canvas rounded-lg px-2 py-1 text-ink-muted hover:text-ink cursor-pointer outline-none focus:border-clay"
                >
                  <option value="">📎 Link an Order (Optional)</option>
                  {myOrders.map((o) => (
                    <option key={o.id} value={o.number}>
                      Order #{o.number} (${o.total})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-end gap-2">
              <textarea
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here... (Press Enter to send)"
                rows={1}
                className="flex-1 min-h-[42px] max-h-32 resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay transition-all leading-relaxed"
              />

              <Button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!messageInput.trim() || sending}
                className="h-[42px] px-4 rounded-xl cursor-pointer bg-clay hover:bg-clay/90 text-white flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 🎫 FORMAL SUPPORT TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {activeTicket ? (
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <button
                    onClick={() => setActiveTicketId(null)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-clay hover:underline cursor-pointer mb-2"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back to all tickets
                  </button>
                  <h3 className="text-base font-semibold text-ink">{activeTicket.subject}</h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Ticket ID: {activeTicket.id}{' '}
                    {activeTicket.orderNumber && `• Order #${activeTicket.orderNumber}`}
                  </p>
                </div>
                <Badge tone={activeTicket.status === 'resolved' ? 'success' : 'info'}>
                  {activeTicket.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {activeTicket.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-4 text-sm ${
                      m.from === 'customer'
                        ? 'bg-clay/5 border border-clay/15 ml-8'
                        : 'bg-canvas border border-line mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
                      <span className="font-semibold text-ink">{m.name}</span>
                      <span>{timeAgo(m.at)}</span>
                    </div>
                    <p className="text-ink leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-line space-y-2">
                <Textarea
                  value={ticketReply}
                  onChange={(e) => setTicketReply(e.target.value)}
                  placeholder="Write your reply to support..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={sendTicketReply} disabled={!ticketReply.trim()} className="bg-clay text-white">
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-muted">Manage your formal tickets and support history</p>
                <Button onClick={() => setCreatingTicket(true)} className="bg-clay text-white gap-1.5 cursor-pointer">
                  <Plus className="h-4 w-4" /> Open New Ticket
                </Button>
              </div>

              <div className="divide-y divide-line border border-line rounded-2xl bg-surface overflow-hidden shadow-xs">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setActiveTicketId(t.id)}
                    className="p-4.5 hover:bg-canvas/60 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink group-hover:text-clay transition-colors">
                          {t.subject}
                        </p>
                        <Badge tone={t.status === 'resolved' ? 'success' : 'info'} className="text-[10px]">
                          {t.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-muted mt-1">
                        {t.id} • Updated {timeAgo(t.updatedAt)} • {t.messages.length} messages
                      </p>
                    </div>
                    <span className="text-xs text-clay font-medium group-hover:translate-x-0.5 transition-transform">
                      View →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Ticket Modal */}
      <Modal
        open={creatingTicket}
        onClose={() => setCreatingTicket(false)}
        title="Open Support Ticket"
        description="Describe your inquiry and our team will get back to you with a detailed reply."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Subject"
            placeholder="e.g. Question about delivery status"
            value={ticketDraft.subject}
            onChange={(e) => setTicketDraft({ ...ticketDraft, subject: e.target.value })}
          />
          {myOrders.length > 0 && (
            <Select
              label="Related Order (Optional)"
              value={ticketDraft.order}
              onChange={(e) => setTicketDraft({ ...ticketDraft, order: e.target.value })}
              options={[
                { value: '', label: 'None' },
                ...myOrders.map((o) => ({
                  value: o.number,
                  label: `Order #${o.number} ($${o.total})`,
                })),
              ]}
            />
          )}
          <Textarea
            label="Describe the issue"
            placeholder="Please provide full details so we can assist you quickly..."
            rows={4}
            value={ticketDraft.message}
            onChange={(e) => setTicketDraft({ ...ticketDraft, message: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreatingTicket(false)}>
              Cancel
            </Button>
            <Button onClick={createNewTicket} className="bg-clay text-white">
              Submit Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
