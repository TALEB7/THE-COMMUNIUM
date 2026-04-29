'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';

interface Props {
  isPending: boolean;
  onSubmit: (data: { title: string; content: string; tags: string[] }) => void;
  onCancel: () => void;
}

export function NewPostForm({ isPending, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = () => {
    onSubmit({ title, content, tags: tags ? tags.split(',').map((t) => t.trim()) : [] });
  };

  return (
    <Card className="border-primary">
      <CardContent className="p-5 space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du sujet..."
          className="w-full px-3 py-2 rounded-lg border border-border text-sm font-semibold focus:outline-none focus:border-primary"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Votre message..."
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary resize-none"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (séparés par des virgules)"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground/80 transition">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title || !content || isPending}
            className="ygo-btn-gold disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publier
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
