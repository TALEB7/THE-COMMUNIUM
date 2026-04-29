'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { GroupPost } from '@/types';
import { getMediaUrl } from '@/lib/media-url';

interface Props {
  post: GroupPost;
}

export function GroupPostCard({ post }: Props) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={getMediaUrl(post.author?.avatarUrl) || '/default-avatar.png'}
            alt=""
            className="w-9 h-9 rounded-full border border-border object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary">
              {post.author?.firstName} {post.author?.lastName}
              <span className="text-muted-foreground font-normal ml-2">
                {new Date(post.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </p>
            <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{post.content}</p>
            {post.comments && post.comments.length > 0 && (
              <div className="mt-3 space-y-2 ml-4 border-l-2 border-border pl-3">
                {post.comments.map((c) => (
                  <div key={c.id}>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">{c.author?.firstName}</span>
                      {' '}{c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
