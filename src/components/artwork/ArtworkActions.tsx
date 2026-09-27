import React, { useState } from 'react';
import { CheckIcon, LockOpenIcon, RotateCcwIcon } from 'lucide-react';
import type { ArtworkSummary } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type Pending = 'approve' | 'revision' | 'unlock' | null;

export function ArtworkActions({ artwork, onChanged }: {artwork: ArtworkSummary;onChanged: () => void;}) {
  const { hasRole } = useAuth();
  const [confirm, setConfirm] = useState<Pending>(null);
  const { run, pending } = useAction();
  const canManage = hasRole('ADMIN', 'SALES');
  const isAdmin = hasRole('ADMIN');

  const act = async (reason: string) => {
    const kind = confirm;
    let res: unknown;
    if (kind === 'approve') res = await run(() => api.post(`/api/artworks/artworks/${artwork.id}/approve/`), 'Artwork approved and locked');
    if (kind === 'revision') res = await run(() => api.post(`/api/artworks/artworks/${artwork.id}/request-revision/`, { notes: reason }), 'Revision requested');
    if (kind === 'unlock') res = await run(() => api.post(`/api/artworks/artworks/${artwork.id}/unlock/`), 'Artwork unlocked');
    if (res !== undefined) {
      setConfirm(null);
      onChanged();
    }
  };

  if (!canManage) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {!artwork.is_locked && artwork.status !== 'APPROVED' &&
      <>
          <Button size="sm" variant="primary" icon={CheckIcon} onClick={() => setConfirm('approve')}>Approve</Button>
          <Button size="sm" icon={RotateCcwIcon} onClick={() => setConfirm('revision')}>Revision</Button>
        </>
      }
      {artwork.is_locked && isAdmin &&
      <Button size="sm" variant="ghost" icon={LockOpenIcon} onClick={() => setConfirm('unlock')}>Unlock</Button>
      }
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        pending={pending}
        danger={confirm === 'unlock'}
        title={confirm === 'approve' ? 'Approve and lock artwork?' : confirm === 'revision' ? 'Request a revision' : 'Emergency unlock?'}
        message={
        confirm === 'approve' ?
        `"${artwork.title}" v${artwork.version} becomes the locked version production must use. It can't be edited after this.` :
        confirm === 'revision' ?
        'The customer\'s change request is recorded and a new version number is issued.' :
        'Unlocking an approved artwork is an admin override and will be recorded in the audit log.'
        }
        confirmLabel={confirm === 'approve' ? 'Approve & lock' : confirm === 'revision' ? 'Request revision' : 'Unlock artwork'}
        reasonLabel={confirm === 'revision' ? 'What needs to change?' : undefined}
        reasonRequired={confirm === 'revision'} />
      
    </div>);

}