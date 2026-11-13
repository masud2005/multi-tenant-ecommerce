'use client';


import { asApiError } from '@/lib/api-error';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { storeService } from '@/services/store-service';
import { EMPTY_AUTH_PAGE, parseAuthPage, type AuthPageContent } from '@/lib/auth-page';
import { Skeleton } from '@/components/ui/Skeleton';

export interface AuthPageEditorDrawerProps {
  open: boolean;
  mode: 'sign-in' | 'sign-up';
  onClose: () => void;
}

export function AuthPageEditorDrawer({
  open,
  mode,
  onClose,
}: AuthPageEditorDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AuthPageContent>(EMPTY_AUTH_PAGE);

  useEffect(() => {
    if (!open) return;
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const res = await storeService.getOwnerSettings();
        if (!alive) return;
        setForm(parseAuthPage(res?.data?.settings?.authPage));
      } catch {
        if (alive) {
          setForm(EMPTY_AUTH_PAGE);
          toast.error('Could not load this page');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [open]);

  const handleUpdate = async () => {
    const title = mode === 'sign-in' ? form.signInTitle : form.signUpTitle;
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await storeService.updateOwnerSettings({
        settings: { authPage: form },
      });
      toast.success(mode === 'sign-in' ? 'Sign in page updated' : 'Sign up page updated');
      onClose();
    } catch (err: unknown) {
      toast.error(asApiError(err).message || 'Failed to update this page');
    } finally {
      setSaving(false);
    }
  };

  const previewPath = mode === 'sign-in' ? '/login' : '/register';
  const titleLabel = mode === 'sign-in' ? 'Sign in title' : 'Sign up title';
  const subtitleLabel = mode === 'sign-in' ? 'Sign in subtitle' : 'Sign up subtitle';
  const titleValue = mode === 'sign-in' ? form.signInTitle : form.signUpTitle;
  const subtitleValue = mode === 'sign-in' ? form.signInSubtitle : form.signUpSubtitle;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title={mode === 'sign-in' ? 'Sign in' : 'Sign up'}
      subtitle={previewPath}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.open(previewPath, '_blank')}
            className="flex cursor-pointer items-center gap-1.5 px-2 py-1 text-sm text-ink hover:underline"
          >
            <Eye className="h-4 w-4 text-ink-muted" /> Preview
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md border border-neutral-300 bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleUpdate}
              className="cursor-pointer rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 px-6 py-5">
        {loading ? (
          <div className="space-y-4" aria-hidden>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="aspect-[4/5] w-full max-w-sm" />
          </div>
        ) : (
          <>
            <Input
              label={titleLabel}
              value={titleValue}
              disabled={loading || saving}
              onChange={(e) =>
                setForm(
                  mode === 'sign-in'
                    ? { ...form, signInTitle: e.target.value }
                    : { ...form, signUpTitle: e.target.value },
                )
              }
            />
            <Input
              label={subtitleLabel}
              value={subtitleValue}
              disabled={loading || saving}
              onChange={(e) =>
                setForm(
                  mode === 'sign-in'
                    ? { ...form, signInSubtitle: e.target.value }
                    : { ...form, signUpSubtitle: e.target.value },
                )
              }
            />
            <Input
              label="Image caption"
              value={form.caption}
              disabled={loading || saving}
              hint="Shown under the image on both sign in and sign up."
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
            />
            <ImageUploadField
              label="Side image"
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              showAlt={false}
              aspectClassName="aspect-[4/5] max-w-sm"
              disabled={loading || saving}
              hint="Used on the right side of both sign in and sign up."
            />
          </>
        )}
      </div>
    </Drawer>
  );
}
