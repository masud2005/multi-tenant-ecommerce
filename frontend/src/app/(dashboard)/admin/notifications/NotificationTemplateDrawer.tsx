'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Bell, Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/button';
import { NotificationTemplate } from './data';

interface NotificationTemplateDrawerProps {
  template: NotificationTemplate | null;
  open: boolean;
  onClose: () => void;
  onSave: (updated: NotificationTemplate) => Promise<void> | void;
  editable: boolean;
}

function previewWithExamples(
  text: string,
  variables: NotificationTemplate['variables'],
) {
  let out = text || '';
  for (const v of variables) {
    if (!v?.tag) continue;
    const example = v.example || '';
    out = out.split(v.tag).join(example);
  }
  // Clear any leftover unmatched {{tokens}}
  return out.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g, '');
}

export function NotificationTemplateDrawer({
  template,
  open,
  onClose,
  onSave,
  editable,
}: NotificationTemplateDrawerProps) {
  const [activeTab, setActiveTab] = useState<'inApp' | 'email'>('inApp');
  const [saving, setSaving] = useState(false);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [inAppTitle, setInAppTitle] = useState('');
  const [inAppMessage, setInAppMessage] = useState('');

  const [focusedField, setFocusedField] = useState<
    'subject' | 'body' | 'inAppTitle' | 'inAppMessage'
  >('inAppTitle');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setEmailSubject(template.emailSubject || '');
      setEmailBody(template.emailBody || '');
      setInAppTitle(template.inAppTitle || '');
      setInAppMessage(template.inAppMessage || '');
      setActiveTab('inApp');
      setFocusedField('inAppTitle');
      setSaving(false);
    }
  }, [template]);

  const previewTitle = useMemo(
    () =>
      previewWithExamples(inAppTitle, template?.variables || []),
    [inAppTitle, template?.variables],
  );
  const previewMessage = useMemo(
    () =>
      previewWithExamples(inAppMessage, template?.variables || []),
    [inAppMessage, template?.variables],
  );

  if (!template) return null;

  const handleCopyVariable = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    toast.success(`Copied ${tag}`);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleInsertVariable = (tag: string) => {
    if (activeTab === 'email') {
      if (focusedField === 'subject') {
        setEmailSubject((prev) => `${prev} ${tag}`.trimStart());
      } else {
        setEmailBody((prev) => `${prev}${prev.endsWith('\n') || !prev ? '' : ' '}${tag}`);
      }
    } else if (focusedField === 'inAppTitle') {
      setInAppTitle((prev) => `${prev} ${tag}`.trimStart());
    } else {
      setInAppMessage((prev) => `${prev} ${tag}`.trimStart());
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        ...template,
        emailSubject,
        emailBody,
        inAppTitle,
        inAppMessage,
      });
      onClose();
    } catch {
      // Parent already toasts the error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={template.event}
      subtitle={template.description}
      width="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          {editable && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-clay hover:bg-clay-dark text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Template'
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="p-5 space-y-6">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('inApp')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'inApp'
                ? 'bg-clay text-white'
                : 'text-ink-muted hover:text-ink hover:bg-subtle'
            }`}
          >
            <Bell className="h-4 w-4" />
            In-App Notification
            {template.inApp && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'email'
                ? 'bg-clay text-white'
                : 'text-ink-muted hover:text-ink hover:bg-subtle'
            }`}
          >
            <Mail className="h-4 w-4" />
            Email Notification
            {template.email && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        <div className="rounded-lg border border-line bg-canvas/60 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-clay" />
              Available Dynamic Variables
            </span>
            <span className="text-xs text-ink-muted hidden sm:inline">
              Click to insert
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {template.variables.length === 0 ? (
              <span className="text-xs text-ink-muted">
                No variables defined for this template.
              </span>
            ) : (
              template.variables.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertVariable(v.tag)}
                  className="group flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-line hover:border-clay/50 text-xs font-mono text-ink transition-colors cursor-pointer"
                  title={`${v.name}: e.g. ${v.example}`}
                >
                  <span>{v.tag}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyVariable(v.tag);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        handleCopyVariable(v.tag);
                      }
                    }}
                    className="text-ink-muted hover:text-clay p-0.5"
                  >
                    {copiedTag === v.tag ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {activeTab === 'inApp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                In-App Notification Title
              </label>
              <input
                type="text"
                value={inAppTitle}
                onChange={(e) => setInAppTitle(e.target.value)}
                onFocus={() => setFocusedField('inAppTitle')}
                disabled={!editable || saving}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/20 focus:border-clay"
                placeholder="e.g. New Order {{order_number}}"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                In-App Notification Message
              </label>
              <textarea
                rows={4}
                value={inAppMessage}
                onChange={(e) => setInAppMessage(e.target.value)}
                onFocus={() => setFocusedField('inAppMessage')}
                disabled={!editable || saving}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/20 focus:border-clay font-sans"
                placeholder="e.g. {{customer_name}} placed an order for {{total_amount}}."
              />
            </div>

            <div className="mt-4 rounded-lg border border-line bg-canvas p-4 space-y-2">
              <span className="text-xs font-semibold text-ink-muted">
                In-App Preview (uses variable examples from this template):
              </span>
              <div className="p-3 rounded-lg border border-line bg-surface shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-full bg-clay/10 text-clay shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      {previewTitle || 'Notification Title'}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                      {previewMessage || 'Notification message'}
                    </p>
                    <span className="text-xs text-ink-muted mt-1 block">
                      Just now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                Email Subject Line
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                onFocus={() => setFocusedField('subject')}
                disabled={!editable || saving}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/20 focus:border-clay"
                placeholder="e.g. Order Confirmed: {{order_number}}"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                Email Body
              </label>
              <textarea
                rows={10}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                onFocus={() => setFocusedField('body')}
                disabled={!editable || saving}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/20 focus:border-clay font-mono text-xs leading-relaxed"
                placeholder="Email content..."
              />
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
