'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import type { Forum } from '@/types';

interface Props {
  forum: Forum;
  onClick: () => void;
}

export function ForumCard({ forum, onClick }: Props) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="border-border hover:border-primary transition cursor-pointer">
        <CardContent className="p-5 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: forum.color || '#1a237e' }}
          >
            {forum.icon || forum.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary">{forum.name}</h3>
            {forum.description && <p className="text-xs text-muted-foreground mt-0.5">{forum.description}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-primary">{forum._count?.posts ?? 0}</p>
            <p className="text-xs text-muted-foreground">discussions</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0" />
        </CardContent>
      </Card>
    </button>
  );
}
