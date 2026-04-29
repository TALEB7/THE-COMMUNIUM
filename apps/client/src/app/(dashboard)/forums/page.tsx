'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-client';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { ForumCard } from '@/components/forums/forum-card';
import { ForumPostRow } from '@/components/forums/forum-post-row';
import { ForumPostDetail } from '@/components/forums/forum-post-detail';
import { NewPostForm } from '@/components/forums/new-post-form';
import {
  useForums, useForumPosts, useForumPost,
  useCreateForumPost, useLikeForumPost, useAddForumComment,
} from '@/hooks/forums/use-forums';

type ViewMode = 'forums' | 'posts' | 'post';

export default function ForumsPage() {
  const { userId } = useAuth();
  const { t } = useT();

  const [view, setView] = useState<ViewMode>('forums');
  const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
  const [selectedForumName, setSelectedForumName] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);

  const { data: forums, isLoading: forumsLoading } = useForums();
  const { data: postsData, isLoading: postsLoading } = useForumPosts(view === 'posts' ? selectedForumId : null);
  const { data: post, isLoading: postLoading } = useForumPost(view === 'post' ? selectedPostId : null);

  const createPost = useCreateForumPost(selectedForumId, () => setShowNewPost(false));
  const likePost = useLikeForumPost();
  const addComment = useAddForumComment(selectedPostId);

  const openForum = (id: string, name: string) => { setSelectedForumId(id); setSelectedForumName(name); setView('posts'); };
  const openPost = (id: string) => { setSelectedPostId(id); setView('post'); };
  const goBack = () => view === 'post' ? setView('posts') : setView('forums');

  // ── FORUMS LIST ──
  if (view === 'forums') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-primary font-heading">💬 {t.forums.title}</h1>
        <p className="text-sm text-muted-foreground">{t.forums.description}</p>

        {forumsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !forums?.length ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Aucun forum disponible</h3>
              <p className="text-sm text-muted-foreground mt-1">Les forums seront bientôt disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {forums.map((forum) => (
              <ForumCard key={forum.id} forum={forum} onClick={() => openForum(forum.id, forum.name)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── POSTS LIST ──
  if (view === 'posts') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 text-muted-foreground hover:text-primary rounded-lg transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-2xl font-bold text-primary font-heading">{selectedForumName}</h1>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:brightness-110 transition"
          >
            <Plus className="h-4 w-4" />
            Nouveau sujet
          </button>
        </div>

        {showNewPost && (
          <NewPostForm
            isPending={createPost.isPending}
            onSubmit={(data) => createPost.mutate({ ...data, authorId: userId! })}
            onCancel={() => setShowNewPost(false)}
          />
        )}

        {postsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !postsData?.posts?.length ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Aucune discussion</h3>
              <p className="text-sm text-muted-foreground mt-1">Soyez le premier à lancer la discussion !</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {postsData.posts.map((p) => (
              <ForumPostRow key={p.id} post={p} onClick={() => openPost(p.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── SINGLE POST ──
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={goBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition">
        <ArrowLeft className="h-4 w-4" />
        Retour aux discussions
      </button>

      {postLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !post ? (
        <p className="text-muted-foreground">Publication non trouvée</p>
      ) : (
        <ForumPostDetail
          post={post}
          isLiking={likePost.isPending}
          isCommenting={addComment.isPending}
          onLike={() => likePost.mutate({ postId: post.id, userId: userId! })}
          onComment={(content) => addComment.mutate({ authorId: userId!, content })}
        />
      )}
    </div>
  );
}
