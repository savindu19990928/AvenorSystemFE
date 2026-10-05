import React, { useState } from 'react';
import { XIcon } from 'lucide-react';

interface ColourTagsInputProps {
  id?: string;
  value: string[];
  onChange: (colours: string[]) => void;
}

export function ColourTagsInput({ id, value, onChange }: ColourTagsInputProps) {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const additions = raw.
    split(',').
    map((c) => c.trim()).
    filter((c) => c && !value.some((v) => v.toLowerCase() === c.toLowerCase()));
    if (additions.length) onChange([...value, ...additions]);
    setDraft('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (draft.trim()) commit(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-[2.25rem] flex-wrap items-center gap-1 rounded-lg border border-line bg-surface px-1.5 py-1 shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      {value.map((c) =>
      <span key={c} className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-0.5 text-xs font-medium text-ink">
          {c}
          <button
          type="button"
          onClick={() => onChange(value.filter((v) => v !== c))}
          className="rounded text-faint transition-colors duration-150 hover:text-danger"
          aria-label={`Remove ${c}`}>
          
            <XIcon className="h-3 w-3" />
          </button>
        </span>
      )}
      <input
        id={id}
        className="min-w-[7rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-ink outline-none placeholder:text-faint"
        placeholder={value.length ? 'Add another…' : 'Black, White… press Enter'}
        value={draft}
        onChange={(e) => e.target.value.includes(',') ? commit(e.target.value) : setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commit(draft)} />
      
    </div>);

}