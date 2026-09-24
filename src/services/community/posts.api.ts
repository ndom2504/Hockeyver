import { apiRequest } from '@/api/client';
import type { Comment, FanUser, Like, Post, PostCategory } from '@/types/social';

export type PublishPostInput = {
  body: string;
  category: PostCategory;
  imageUrl?: string;
  playerId?: string;
  teamId?: string;
  matchId?: string;
  hashtags?: string[];
};

export function fetchPosts() {
  return apiRequest<{ posts: Post[]; comments: Comment[]; likes: Like[]; authors: FanUser[] }>('/api/posts', {
    method: 'GET',
  });
}

export function publishPost(token: string, input: PublishPostInput) {
  return apiRequest<{ post: Post }>('/api/posts', { token, body: input });
}

export function removeRemotePost(token: string, id: string) {
  return apiRequest<{ deleted: boolean }>('/api/posts', { method: 'DELETE', token, body: { id } });
}

export function publishComment(
  token: string,
  input: { postId: string; body: string; parentId?: string },
) {
  return apiRequest<{ comment: Comment }>('/api/comments', { token, body: input });
}

export function removeRemoteComment(token: string, id: string) {
  return apiRequest<{ deleted: boolean }>('/api/comments', { method: 'DELETE', token, body: { id } });
}

export function toggleReaction(token: string, input: { targetType: Like['targetType']; targetId: string }) {
  return apiRequest<{ liked: boolean; like?: Like }>('/api/reactions', { token, body: input });
}
