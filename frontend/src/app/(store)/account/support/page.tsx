'use client';


import { asApiError } from '@/lib/api-error';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  Loader2,
  LifeBuoy,
  ShoppingBag,
  Sparkles,
  CheckCheck,
  Paperclip,
  X,
  FileText,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/contexts/StoreContext';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { ChatMessageAttachments } from '@/components/store/chat/ChatMessageAttachments';
import { ChatMessageText } from '@/components/store/chat/ChatMessageText';
import { formatDateTime, formatBDT } from '@/utils/format';
import { getAuthToken, getAuthUser } from '@/services/auth';
import {
  chatService,
  ChatMessage,
  Conversation,
  CHAT_FILE_ACCEPT,
  CHAT_MAX_ATTACHMENTS,
  validateChatAttachment,
  isChatImageUrl,
} from '@/services/chat-service';
import { usePendingCloudUploads } from '@/hooks/usePendingCloudUploads';

const quickPrompts = [
  { label: 'Track my order', text: 'Hi, can you give me an update on my recent order?' },
  { label: 'Shipping & delivery', text: 'How long does standard delivery take to my area?' },
  { label: 'Return or exchange', text: 'I would like to initiate a return or exchange.' },
  { label: 'Payment or promo', text: 'I have a question regarding a discount code and payment.' },
];

export default function AccountSupportPage() {
  const { user, orders } = useStore();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [isAgentOnline, setIsAgentOnline] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [attachedOrder, setAttachedOrder] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const pendingUploads = usePendingCloudUploads({
    max: CHAT_MAX_ATTACHMENTS,
    discardRemote: async (item) => {
      await chatService.discardAttachment(
        item.publicId || item.url,
        'customer',
        item.resourceType,
      );
    },
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [messages, isAgentTyping]);

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
        const history = await chatService.getCustomerMessages(conv.id);
        if (history?.messages) {
          setMessages(history.messages);
        }
      }
    } catch (err) {
      console.error('Failed to initialize live chat:', err);
      toast.error('Could not connect to support chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  }, [user]);

  useEffect(() => {
    initChatSession();
  }, [initChatSession]);

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
      socket.emit(
        'join_conversation',
        { conversationId: conversation.id },
        (res: { isOtherPartyOnline?: boolean }) => {
          if (res?.isOtherPartyOnline) setIsAgentOnline(true);
        }
      );
      socket.emit(
        'check_presence',
        { conversationId: conversation.id },
        (res: { isOnline?: boolean }) => {
          if (res?.isOnline !== undefined) setIsAgentOnline(res.isOnline);
        }
      );
    });

    const handleIncomingMessage = (newMsg: ChatMessage) => {
      if (newMsg.conversationId !== conversation.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setIsAgentTyping(false);
      chatService.markCustomerRead(conversation.id);
    };

    socket.on('new_message', handleIncomingMessage);
    socket.on('receive_message', handleIncomingMessage);

    socket.on('user_typing', (data: { role: string; isTyping: boolean }) => {
      if (data.role !== 'CUSTOMER') setIsAgentTyping(data.isTyping);
    });

    socket.on(
      'presence_status',
      (data: { isOnline: boolean; role: string }) => {
        if (data.role !== 'CUSTOMER') setIsAgentOnline(data.isOnline);
      }
    );

    return () => {
      socket.emit('leave_conversation', { conversationId: conversation.id });
      socket.disconnect();
    };
  }, [conversation?.id]);

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
      const uploaded = await chatService.uploadAttachment(file, 'customer');
      if (uploaded?.url) {
        pendingUploads.add({
          url: uploaded.url,
          publicId: uploaded.publicId || uploaded.url,
          mimeType: uploaded.mimeType || file.type,
          name: uploaded.name || file.name,
          resourceType: uploaded.resourceType || (file.type === 'application/pdf' ? 'raw' : 'image'),
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

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || messageInput;
    const snapshot = pendingUploads.items;
    const attachmentUrls = snapshot.map((a) => a.url);
    if (
      (!textToSend.trim() && attachmentUrls.length === 0 && !attachedOrder) ||
      !conversation ||
      sending
    ) {
      return;
    }

    const trimmed = textToSend.trim();
    const fullMessage = attachedOrder
      ? trimmed
        ? `[Order #${attachedOrder}]: ${trimmed}`
        : `[Order #${attachedOrder}]`
      : trimmed || undefined;

    stickToBottomRef.current = true;
    setSending(true);
    setMessageInput('');
    setAttachedOrder('');
    pendingUploads.commit();

    if (socketRef.current) {
      socketRef.current.emit('typing_stop', {
        conversationId: conversation.id,
      });
    }

    try {
      const storedUser = getAuthUser();
      const senderName = user?.name || storedUser?.name || 'Customer';

      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'send_message',
          {
            conversationId: conversation.id,
            text: fullMessage,
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
        const sent = await chatService.sendCustomerMessage(conversation.id, {
          text: fullMessage,
          senderName,
          senderRole: 'CUSTOMER',
          attachments: attachmentUrls.length ? attachmentUrls : undefined,
        });
        if (sent) setMessages((prev) => [...prev, sent]);
      }
    } catch {
      toast.error('Failed to send message. Please try again.');
      setMessageInput(textToSend);
      pendingUploads.restore(snapshot);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    if (!socketRef.current || !conversation) return;

    socketRef.current.emit('typing_start', {
      conversationId: conversation.id,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', {
        conversationId: conversation.id,
      });
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <AccountHeader
        title="Help & support"
        description="Chat with the store team about orders, delivery, or returns."
      />

      {!isAgentOnline && !chatLoading ? (
        <p className="rounded-lg border border-line bg-subtle px-4 py-3 text-sm text-ink-soft">
          Support is away right now. Send a message anyway — the team will reply
          when they’re back.
        </p>
      ) : null}

      <div className="flex h-[min(650px,70vh)] min-h-[28rem] flex-col overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex shrink-0 items-center justify-between border-b border-line bg-canvas/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-ink ring-2 ring-surface">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-surface ${
                  isAgentOnline ? 'bg-emerald-500' : 'bg-ink-muted'
                }`}
                title={isAgentOnline ? 'Support is online' : 'Support is away'}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">Store support</h3>
                <Badge
                  tone={isAgentOnline ? 'success' : 'neutral'}
                  className="px-1.5 py-0 text-xs"
                >
                  {isAgentOnline ? 'Online' : 'Away'}
                </Badge>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                <Sparkles className="h-3 w-3" />
                Live chat for orders and store help
              </p>
            </div>
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-canvas/30 p-5"
        >
          {chatLoading ? (
            <div className="flex h-full flex-col items-center justify-center text-ink-soft">
              <Loader2 className="mb-2 h-6 w-6 animate-spin text-ink" />
              <p className="text-sm">Connecting to support…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-ink">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-ink">How can we help?</h4>
              <p className="mt-1 mb-5 max-w-sm text-sm text-ink-soft">
                Ask about orders, shipping, returns, or products.
              </p>
              <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={() => handleSendMessage(prompt.text)}
                    disabled={sending || !conversation}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface p-2.5 text-left text-xs text-ink transition-colors hover:border-line-strong hover:bg-subtle cursor-pointer disabled:opacity-60"
                  >
                    <span className="font-medium">{prompt.label}</span>
                    <Send className="h-3 w-3 text-ink-soft" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMe = msg.senderRole === 'CUSTOMER';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex max-w-[82%] items-end gap-2 sm:max-w-[70%]">
                      {!isMe ? (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-bold text-ink ring-1 ring-line">
                          S
                        </div>
                      ) : null}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                          isMe
                            ? 'rounded-br-sm bg-ink text-canvas'
                            : 'rounded-bl-sm border border-line bg-surface text-ink'
                        }`}
                      >
                        {!isMe ? (
                          <p className="mb-0.5 text-xs font-semibold text-ink">
                            {msg.senderName || 'Store support'}
                          </p>
                        ) : null}
                        {msg.text && msg.text !== '[Attachment]' ? (
                          <ChatMessageText
                            text={msg.text}
                            role="customer"
                            tone={isMe ? 'dark' : 'light'}
                          />
                        ) : null}
                        <ChatMessageAttachments
                          attachments={msg.attachments}
                          tone={isMe ? 'dark' : 'light'}
                        />
                      </div>
                    </div>
                    <div
                      className={`mt-1 flex items-center gap-1 px-1 text-xs text-ink-soft ${
                        isMe ? 'pr-1' : 'pl-9'
                      }`}
                    >
                      <span>{formatDateTime(msg.createdAt)}</span>
                      {isMe ? <CheckCheck className="inline h-3 w-3" /> : null}
                    </div>
                  </div>
                );
              })}

              {isAgentTyping ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-bold text-ink">
                    S
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-line bg-surface px-3.5 py-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink" />
                    <span className="ml-1 text-xs text-ink-soft">
                      Support is typing…
                    </span>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        {attachedOrder ? (
          <div className="flex items-center justify-between border-t border-line bg-subtle px-4 py-1.5 text-xs text-ink">
            <Link
              href={`/account/orders/${encodeURIComponent(attachedOrder)}`}
              className="inline-flex items-center gap-1.5 font-medium underline underline-offset-2 hover:opacity-80"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Linked order #{attachedOrder}
            </Link>
            <button
              type="button"
              onClick={() => setAttachedOrder('')}
              className="cursor-pointer hover:underline"
            >
              Remove
            </button>
          </div>
        ) : null}

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
          {orders.length > 0 ? (
            <div className="mb-2">
              <select
                value={attachedOrder}
                onChange={(e) => setAttachedOrder(e.target.value)}
                className="cursor-pointer rounded-lg border border-line bg-canvas px-2 py-1 text-xs text-ink outline-none focus:border-line-strong"
              >
                <option value="">Link an order (optional)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.number}>
                    {o.number} · {formatBDT(o.total)}
                  </option>
                ))}
              </select>
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
              disabled={
                uploadingFile ||
                pendingUploads.atLimit ||
                !conversation ||
                chatLoading
              }
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
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              disabled={!conversation || chatLoading}
              className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink leading-relaxed placeholder:text-ink-muted focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:opacity-60"
            />
            <Button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={
                (!messageInput.trim() &&
                  pendingUploads.count === 0 &&
                  !attachedOrder) ||
                sending ||
                !conversation
              }
              className="flex h-[42px] shrink-0 items-center gap-1.5 rounded-xl px-4"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
