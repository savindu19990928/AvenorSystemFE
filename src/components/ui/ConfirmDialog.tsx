import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Field } from './Field';
import { inputClass } from '../../utils/styles';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  reasonLabel?: string;
  reasonRequired?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger,
  pending,
  reasonLabel,
  reasonRequired
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
      <>
          <Button onClick={onClose}>Keep as is</Button>
          <Button
          variant={danger ? 'danger' : 'primary'}
          loading={pending}
          disabled={reasonRequired && !reason.trim()}
          onClick={() => onConfirm(reason.trim())}>
          
            {confirmLabel}
          </Button>
        </>
      }>
      
      <p className="text-sm text-muted">{message}</p>
      {reasonLabel &&
      <Field label={reasonLabel} htmlFor="confirm-reason" required={reasonRequired} className="mt-4">
          <textarea id="confirm-reason" rows={3} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      }
    </Modal>);

}