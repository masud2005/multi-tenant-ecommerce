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
  const [activeTab, setActiveTab] = useState<'inApp' | 'email'>('inApp');

  // Form draft states
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [inAppTitle, setInAppTitle] = useState('');
  const [inAppMessage, setInAppMessage] = useState('');

  // Focus tracking for variable insertion
  const [focusedField, setFocusedField] = useState<'subject' | 'body' | 'inAppTitle' | 'inAppMessage'>('inAppTitle');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Sync draft states when template changes
  useEffect(() => {
    if (template) {
      setEmailSubject(template.emailSubject || '');
      setEmailBody(template.emailBody || '');
      setInAppTitle(template.inAppTitle || '');
      setInAppMessage(template.inAppMessage || '');
      setActiveTab('inApp');
      setFocusedField('inAppTitle');
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
      if (focusedField === 'inAppTitle') {
        setInAppTitle((prev) => `${prev} ${tag}`);
        toast.info(`Inserted ${tag} into Title`);
      } else {
        setInAppMessage((prev) => `${prev} ${tag}`);
        toast.info(`Inserted ${tag} into Message`);
      }
    }
  };

  // Save handler
  const handleSave = () => {
    const updated: NotificationTemplate = {
      ...template,
      emailSubject,
      emailBody,
      inAppTitle,
      inAppMessage
    };
    onSave(updated);
    toast.success(`Updated template for "${template.event}"`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={template.event}
      subtitle={template.description}
      width="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {editable && (
            <Button onClick={handleSave} className="bg-clay hover:bg-clay-dark text-white">
              Save Template
            </Button>
          )}
        </div>
      }
    >
      <div className="p-5 space-y-6">
        {/* Channel Navigation Tabs */}
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

        {/* Dynamic Variable Chips */}
        <div className="rounded-lg border border-line bg-canvas/60 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-clay" />
              Available Dynamic Variables
            </span>
            <span className="text-[11px] text-ink-muted">Click to insert into focused field</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {template.variables.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => handleInsertVariable(v.tag)}
                className="group flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-line hover:border-clay/50 text-xs font-mono text-ink transition-colors cursor-pointer"
                title={`${v.name}: e.g. ${v.example}`}
              >
                <span>{v.tag}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyVariable(v.tag);
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
            ))}
          </div>
        </div>

        {/* Tab Content 1: In-App Notification Editor */}
        {activeTab === 'inApp' && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                In-App Notification Title
              </label>
              <input
                type="text"
                value={inAppTitle}
                onChange={(e) => setInAppTitle(e.target.value)}
                onFocus={() => setFocusedField('inAppTitle')}
                disabled={!editable}
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
                disabled={!editable}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/20 focus:border-clay font-sans"
                placeholder="e.g. {{customer_name}} placed an order for {{total_amount}}."
              />
            </div>

            {/* Live In-App Preview Card */}
            <div className="mt-4 rounded-lg border border-line bg-canvas p-4 space-y-2">
              <span className="text-xs font-semibold text-ink-muted">In-App Preview (Bell Dropdown):</span>
              <div className="p-3 rounded-lg border border-line bg-surface shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-full bg-clay/10 text-clay shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">{inAppTitle || 'Notification Title'}</p>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{inAppMessage || 'Notification message description'}</p>
                    <span className="text-[10px] text-ink-muted mt-1 block">Just now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Email Notification Editor */}
        {activeTab === 'email' && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                Email Subject Line
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                onFocus={() => setFocusedField('subject')}
                disabled={!editable}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/20 focus:border-clay"
                placeholder="e.g. Order Confirmed: {{order_number}}"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                Email Body (HTML/Text)
              </label>
              <textarea
                rows={10}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                onFocus={() => setFocusedField('body')}
                disabled={!editable}
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
