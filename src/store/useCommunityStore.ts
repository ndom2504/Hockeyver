import { create } from 'zustand';

import { POINTS } from '@/constants/levels';
import { CURRENT_USER_ID } from '@/constants/session';
import {
  seedComments,
  seedFans,
  seedLikes,
  seedNotifications,
  seedPolls,
  seedPosts,
} from '@/services/community/community.mock';
import { useSessionStore } from '@/store/useSessionStore';
import type { Comment, Like, Poll, Post, PostCategory, Report, ReportReason } from '@/types/social';
import { createId } from '@/utils/id';
import { mergeTags } from '@/utils/text';

type CreatePostInput = {
  body: string;
  category: PostCategory;
  imageUrl?: string;
  playerId?: string;
  teamId?: string;
  matchId?: string;
  extraTags?: string[];
};

type CommunityState = {
  users: typeof seedFans;
  posts: Post[];
  comments: Comment[];
  likes: Like[];
  polls: Poll[];
  pollVotes: Record<string, string>;
  notifications: typeof seedNotifications;
  reports: Report[];
  hiddenPostIds: string[];
  followedTeamIds: string[];
  followedPlayerIds: string[];
  toggleLike: (targetType: Like['targetType'], targetId: string) => void;
  addComment: (input: { postId: string; body: string; parentId?: string }) => void;
  deleteComment: (commentId: string) => void;
  createPost: (input: CreatePostInput) => Post;
  deletePost: (postId: string) => void;
  hidePost: (postId: string) => void;
  reportPost: (postId: string, reason: ReportReason) => void;
  votePoll: (pollId: string, optionId: string) => boolean;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toggleFollowTeam: (teamId: string) => boolean;
  toggleFollowPlayer: (playerId: string) => boolean;
};

function hasLike(likes: Like[], targetType: Like['targetType'], targetId: string, userId: string) {
  return likes.some((like) => like.targetType === targetType && like.targetId === targetId && like.userId === userId);
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  users: seedFans,
  posts: seedPosts,
  comments: seedComments,
  likes: seedLikes,
  polls: seedPolls,
  pollVotes: {},
  notifications: seedNotifications,
  reports: [],
  hiddenPostIds: [],
  followedTeamIds: ['MTL'],
  followedPlayerIds: ['suzuki'],
  toggleLike: (targetType, targetId) => {
    const liked = hasLike(get().likes, targetType, targetId, CURRENT_USER_ID);
    set((state) => ({
      likes: liked
        ? state.likes.filter(
            (like) =>
              !(like.targetType === targetType && like.targetId === targetId && like.userId === CURRENT_USER_ID),
          )
        : [...state.likes, { targetType, targetId, userId: CURRENT_USER_ID }],
    }));
  },
  addComment: ({ postId, body, parentId }) => {
    const comment: Comment = {
      id: createId('c'),
      postId,
      authorId: CURRENT_USER_ID,
      body: body.trim(),
      parentId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ comments: [...state.comments, comment] }));
    useSessionStore.getState().addPoints(POINTS.comment);
  },
  deleteComment: (commentId) => {
    const comment = get().comments.find((item) => item.id === commentId);
    if (!comment || comment.authorId !== CURRENT_USER_ID) return;
    const removed = new Set(
      [commentId, ...get().comments.filter((item) => item.parentId === commentId).map((item) => item.id)],
    );
    set((state) => ({
      comments: state.comments.filter((item) => !removed.has(item.id)),
      likes: state.likes.filter((like) => !(like.targetType === 'comment' && removed.has(like.targetId))),
    }));
  },
  createPost: (input) => {
    const post: Post = {
      id: createId('p'),
      authorId: CURRENT_USER_ID,
      body: input.body.trim(),
      imageUrl: input.imageUrl,
      category: input.category,
      playerId: input.playerId,
      teamId: input.teamId,
      matchId: input.matchId,
      hashtags: mergeTags(input.body, input.extraTags),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ posts: [post, ...state.posts] }));
    useSessionStore.getState().addPoints(POINTS.post);
    return post;
  },
  deletePost: (postId) => {
    const post = get().posts.find((item) => item.id === postId);
    if (!post || post.authorId !== CURRENT_USER_ID) return;
    set((state) => ({
      posts: state.posts.filter((item) => item.id !== postId),
      comments: state.comments.filter((item) => item.postId !== postId),
      likes: state.likes.filter((like) => !(like.targetType === 'post' && like.targetId === postId)),
    }));
  },
  hidePost: (postId) => {
    if (get().hiddenPostIds.includes(postId)) return;
    set((state) => ({ hiddenPostIds: [...state.hiddenPostIds, postId] }));
  },
  reportPost: (postId, reason) => {
    const report: Report = {
      id: createId('r'),
      postId,
      userId: CURRENT_USER_ID,
      reason,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ reports: [report, ...state.reports] }));
  },
  votePoll: (pollId, optionId) => {
    if (get().pollVotes[pollId]) return false;
    set((state) => ({
      pollVotes: { ...state.pollVotes, [pollId]: optionId },
      polls: state.polls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: poll.options.map((option) =>
                option.id === optionId ? { ...option, votes: option.votes + 1 } : option,
              ),
            }
          : poll,
      ),
    }));
    useSessionStore.getState().addPoints(POINTS.poll);
    return true;
  },
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, read: true })),
    })),
  toggleFollowTeam: (teamId) => {
    const following = get().followedTeamIds.includes(teamId);
    set((state) => ({
      followedTeamIds: following
        ? state.followedTeamIds.filter((id) => id !== teamId)
        : [...state.followedTeamIds, teamId],
    }));
    return !following;
  },
  toggleFollowPlayer: (playerId) => {
    const following = get().followedPlayerIds.includes(playerId);
    set((state) => ({
      followedPlayerIds: following
        ? state.followedPlayerIds.filter((id) => id !== playerId)
        : [...state.followedPlayerIds, playerId],
    }));
    return !following;
  },
}));
