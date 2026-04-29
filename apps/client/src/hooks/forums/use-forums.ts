import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Forum, ForumPost, ForumPostsResponse } from '@/types';

export function useForums() {
  return useQuery<Forum[]>({
    queryKey: ['forums'],
    queryFn: () => api.get('/forums').then((r) => r.data),
  });
}

export function useForumPosts(forumId: string | null) {
  return useQuery<ForumPostsResponse>({
    queryKey: ['forum-posts', forumId],
    queryFn: () => api.get(`/forums/${forumId}/posts`).then((r) => r.data),
    enabled: !!forumId,
  });
}

export function useForumPost(postId: string | null) {
  return useQuery<ForumPost>({
    queryKey: ['forum-post', postId],
    queryFn: () => api.get(`/forums/posts/${postId}`).then((r) => r.data),
    enabled: !!postId,
  });
}

export function useCreateForumPost(forumId: string | null, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { authorId: string; title: string; content: string; tags: string[] }) =>
      api.post('/forums/posts', { ...data, forumId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', forumId] });
      onSuccess?.();
    },
  });
}

export function useLikeForumPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      api.post(`/forums/posts/${postId}/like`, { userId }),
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post', postId] });
    },
  });
}

export function useAddForumComment(postId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ authorId, content }: { authorId: string; content: string }) =>
      api.post(`/forums/posts/${postId}/comments`, { authorId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', postId] });
    },
  });
}
