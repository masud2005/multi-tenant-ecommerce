'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Bell,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import {
  NotificationTemplate,
  TemplateVariable
} from './data';

interface NotificationTemplateDrawerProps {
  template: NotificationTemplate | null;
  open: boolean;
  onClose: () => void;
  onSave: (updated: NotificationTemplate) => void;
  editable: boolean;
}

export function NotificationTemplateDrawer({
  template,
  open,
  onClose,
  onSave,
  editable
}: NotificationTemplateDrawerProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'push'>('email');

  // Form draft states
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');

  // Focus tracking for variable insertion
  const [focusedField, setFocusedField] = useState<'subject' | 'body' | 'pushTitle' | 'pushBody'>('body');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Sync draft states when template changes
  useEffect(() => {
    if (template) {
      setEmailSubject(template.emailSubject);
      setEmailBody(template.emailBody);
      setPushTitle(template.pushTitle);
      setPushBody(template.pushBody);
      setActiveTab('email');
      setFocusedField('body');
    }
  }, [template]);

  if (!template) return null;

  // Copy variable handler
  const handleCopyVariable = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    toast.success(`Copied ${tag} to clipboard`);
    setTimeout(() => {
      setCopiedTag(null);
    }, 2000);
  };

  // Insert variable into active input
  const handleInsertVariable = (tag: string) => {
    if (activeTab === 'email') {
      if (focusedField === 'subject') {
        setEmailSubject((prev) => `${prev} ${tag}`);
        toast.info(`Inserted ${tag} into Subject`);
      } else {
        setEmailBody((prev) => `${prev} ${tag}`);
        toast.info(`Inserted ${tag} into Email body`);
      }
    } else {
      if (focusedField === 'pushTitle') {
        setPushTitle((prev) => `${prev} ${tag}`);
        toast.info(`Inserted ${tag} into Push title`);
      } else {
        setPushBody((prev) => `${prev} ${tag}`);
        toast.info(`Inserted ${tag} into Push content`);
      }
    }
  };

  // Save handler
  const handleSave = () => {
    const updated: NotificationTemplate = {
      ...template,
      emailSubject,
      emailBody,
      pushTitle,
      pushBody
    };
    onSave(updated);
    toast.success(`${template.event} templates saved successfully`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title={
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-ink text-base md:text-lg">
            {template.event}
          </span>
          <Badge tone="clay">{template.group}</Badge>
        </div>
      }
      subtitle={
        <p className="text-xs text-ink-muted mt-0.5">
          {template.description}
        </p>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!editable}
            onClick={handleSave}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      }
    >
      <div className="p-5 md:p-6 space-y-6">
        {/* Channel Segmented Tabs */}
        <div className="border-b border-line pb-4">
          <div className="inline-flex items-center gap-2 p-1 bg-subtle rounded-lg">
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setFocusedField('body');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Mail className={`h-4 w-4 ${activeTab === 'email' ? 'text-clay' : ''}`} />
              <span>1. Email</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('push');
                setFocusedField('pushBody');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'push'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Bell className={`h-4 w-4 ${activeTab === 'push' ? 'text-clay' : ''}`} />
              <span>2. Push</span>
            </button>
          </div>
        </div>

        {/* TAB 1: EMAIL TEMPLATE */}
        {activeTab === 'email' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Email Subject Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ink">
                  Email subject
                </label>
                <span className="text-[11px] text-ink-muted">
                  Supports variables (e.g. &#123;&#123;order_number&#125;&#125;)
                </span>
              </div>
              <input
                type="text"
                value={emailSubject}
                onFocus={() => setFocusedField('subject')}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Order Confirmed: {{order_number}}"
                className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 transition-all"
              />
            </div>

            {/* Email Body Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ink">
                  Email body
                </label>
                <span className="text-[11px] text-ink-muted">
                  Formatted text &amp; template variables
                </span>
              </div>
              <textarea
                rows={10}
                value={emailBody}
                onFocus={() => setFocusedField('body')}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your email notification body here..."
                className="w-full rounded-md border border-line-strong bg-surface p-3 font-mono text-xs leading-relaxed text-ink placeholder:text-ink-muted/50 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 transition-all"
              />
            </div>

            {/* Available Variables Section */}
            <div className="rounded-lg border border-line bg-subtle/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-clay" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Available Variables
                  </h4>
                </div>
                <span className="text-[11px] text-ink-muted">
                  Click to copy or insert into template
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {template.variables.map((v) => {
                  const isCopied = copiedTag === v.tag;
                  return (
                    <div
                      key={v.tag}
                      className="group flex items-center justify-between p-2 rounded-md border border-line bg-surface hover:border-clay/50 hover:bg-clay-soft/20 transition-all text-left"
                    >
                      <div
                        onClick={() => handleCopyVariable(v.tag)}
                        className="min-w-0 flex-1 cursor-pointer pr-2"
                        title={`Click to copy ${v.tag}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-semibold font-mono text-clay group-hover:text-clay-dark">
                            {v.tag}
                          </code>
                        </div>
                        <p className="text-[11px] text-ink-muted truncate mt-0.5">
                          {v.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleInsertVariable(v.tag)}
                          title="Insert into active field"
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded text-ink-muted hover:text-clay hover:bg-clay/10 transition-colors cursor-pointer"
                        >
                          + Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyVariable(v.tag)}
                          title="Copy tag"
                          className="p-1 text-ink-muted hover:text-ink rounded transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PUSH NOTIFICATION TEMPLATE */}
        {activeTab === 'push' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Push Title Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ink">
                  Notification title
                </label>
                <span className="text-[11px] text-ink-muted">
                  Short &amp; catchy title
                </span>
              </div>
              <input
                type="text"
                value={pushTitle}
                onFocus={() => setFocusedField('pushTitle')}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="e.g. Order {{order_number}} Confirmed! 🛍️"
                className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 transition-all"
              />
            </div>

            {/* Push Body / Content Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ink">
                  Notification content (body)
                </label>
                <span className="text-[11px] text-ink-muted tabular-nums">
                  {pushBody.length} characters
                </span>
              </div>
              <textarea
                rows={6}
                value={pushBody}
                onFocus={() => setFocusedField('pushBody')}
                onChange={(e) => setPushBody(e.target.value)}
                placeholder="Write your push notification message content here..."
                className="w-full rounded-md border border-line-strong bg-surface p-3 text-sm leading-relaxed text-ink placeholder:text-ink-muted/50 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 transition-all"
              />
            </div>

            {/* Available Variables Section */}
            <div className="rounded-lg border border-line bg-subtle/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-clay" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Available Variables
                  </h4>
                </div>
                <span className="text-[11px] text-ink-muted">
                  Click to copy or insert into notification
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {template.variables.map((v) => {
                  const isCopied = copiedTag === v.tag;
                  return (
                    <div
                      key={v.tag}
                      className="group flex items-center justify-between p-2 rounded-md border border-line bg-surface hover:border-clay/50 hover:bg-clay-soft/20 transition-all text-left"
                    >
                      <div
                        onClick={() => handleCopyVariable(v.tag)}
                        className="min-w-0 flex-1 cursor-pointer pr-2"
                        title={`Click to copy ${v.tag}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-semibold font-mono text-clay group-hover:text-clay-dark">
                            {v.tag}
                          </code>
                        </div>
                        <p className="text-[11px] text-ink-muted truncate mt-0.5">
                          {v.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleInsertVariable(v.tag)}
                          title="Insert into notification content"
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded text-ink-muted hover:text-clay hover:bg-clay/10 transition-colors cursor-pointer"
                        >
                          + Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyVariable(v.tag)}
                          title="Copy tag"
                          className="p-1 text-ink-muted hover:text-ink rounded transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
