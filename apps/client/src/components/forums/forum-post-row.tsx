'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, ThumbsUp, MessageCircle, Pin, Lock } from 'lucide-react';
import type { ForumPost } from '@/types';
import { getMediaUrl } from '@/lib/media-url';

interface Props {
  post: ForumPost;
  onClick: () => void;
}

export function ForumPostRow({ post, onClick }: Props) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="border-border hover:border-primary transition">
        <CardContent className="p-4 flex items-start gap-3">
          <img
            src={getMediaUrl(post.author?.avatarUrl) || '/default-avatar.png'}
            alt=""
            className="w-10 h-10 rounded-full border-2 border-border object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {post.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
              {post.isLocked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
              <h3 className="font-semibold text-sm text-primary truncate">{post.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {post.author?.firstName} {post.author?.lastName} · {new Date(post.createdAt).toLocaleDateString('fr-FR')}
            </p>
            {post.tags?.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs border-[#C8102E] px-1.5 py-0">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.viewCount}</span>
            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{post._count?.likes ?? 0}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post._count?.comments ?? 0}</span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
