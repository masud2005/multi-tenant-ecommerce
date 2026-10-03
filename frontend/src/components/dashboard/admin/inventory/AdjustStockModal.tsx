'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';

export const INVENTORY_REASONS = [
  'Received',
  'Correction',
  'Damaged',
  'Lost / stolen',
  'Physical count',
  'Returned to stock',
];

export interface AdjustModalTarget {
  pid: string;
  vid: string;
  label: string;
  current: number;
}

interface AdjustStockModalProps {
  target: AdjustModalTarget | null;
  onClose: () => void;
  onSave: (data: {
    target: AdjustModalTarget;
    delta: number;
    reason: string;
    reference: string;
    note: string;
  }) => void;
}

export function AdjustStockModal({ target, onClose, onSave }: AdjustStockModalProps) {
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState(INVENTORY_REASONS[0]);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (target) {
      setDelta('');
      setReason(INVENTORY_REASONS[0]);
      setReference('');
      setNote('');
    }
  }, [target]);

  const handleSave = () => {
    if (!target) return;
    const n = Number(delta);
    if (!n) {
      toast.error('Enter a quantity, e.g. 10 or -2');
      return;
    }
    if (target.current + n < 0) {
      toast.error('Stock cannot go below zero');
      return;
    }

    onSave({
      target,
      delta: n,
      reason,
      reference: reference.trim(),
      note: note.trim(),
    });
  };

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Adjust stock"
      description={target?.label}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save adjustment</Button>
        </>
      }
    >
      {target && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Adjust by"
              inputMode="numeric"
              value={delta}
              onChange={(e) => setDelta(e.target.value.replace(/[^\d-]/g, ''))}
              placeholder="+10 or -2"
              autoFocus
            />
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">New on hand</p>
              <p className="flex h-10 items-center text-sm tabular-nums text-ink">
                {target.current} →{' '}
                <b className="ml-1 text-ink font-semibold">
                  {target.current + (Number(delta) || 0)}
                </b>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={INVENTORY_REASONS}
            />
            <Input
              label="Reference (PO / Order #)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-0412"
            />
          </div>
          <Input
            label="Note / Remarks (Optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Packaging damage, audit count mismatch..."
          />
          <p className="text-xs text-ink-muted">
            Every adjustment is recorded to the movement ledger with full timestamp and user audit trail.
          </p>
        </div>
      )}
    </Modal>
  );
}
