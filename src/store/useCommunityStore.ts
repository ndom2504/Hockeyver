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
import { readFeed, writeFeed, type SavedFeed } from '@/services/community/feed-storage';
import {
  fetchPosts,
  publishComment,
  publishPost,
  removeRemoteComment,
  removeRemotePost,
  toggleReaction,
} from '@/services/community/posts.api';
import { ring } from '@/services/alerts/alerts';
import { useSessionStore } from '@/store/useSessionStore';
import type { AppNotification, Comment, Like, NotificationType, Poll, Post, PostCategory, Report, ReportReason } from '@/types/social';
import { createId } from '@/utils/id';
import { displayName, mergeTags } from '@/utils/text';

function actorId() {
  return useSessionStore.getState().user?.id ?? CURRENT_USER_ID;
}

function mentionsCurrentUser(body: string) {
  const username = useSessionStore.getState().user?.username;
  if (!username) return false;
  return body.toLowerCase().includes(`@${username.toLowerCase()}`);
}

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
  addComment: (input: { postId: string; body: string; parentId?: string }) => Promise<boolean>;
  deleteComment: (commentId: string) => void;
  createPost: (input: CreatePostInput) => Promise<Post>;
  deletePost: (postId: string) => void;
  hidePost: (postId: string) => void;
  reportPost: (postId: string, reason: ReportReason) => void;
  votePoll: (pollId: string, optionId: string) => boolean;
  hydrateFeed: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  receiveAlert: (input: {
    type: NotificationType;
    title: string;
    body: string;
    postId?: string;
    matchId?: string;
    actorId?: string;
  }) => void;
  toggleFollowTeam: (teamId: string) => boolean;
  toggleFollowPlayer: (playerId: string) => boolean;
};

function hasLike(likes: Like[], targetType: Like['targetType'], targetId: string, userId: string) {
  return likes.some((like) => like.targetType === targetType && like.targetId === targetId && like.userId === userId);
}

const seedPostIds = new Set(seedPosts.map((post) => post.id));
const seedCommentIds = new Set(seedComments.map((comment) => comment.id));
const seedNotificationIds = new Set(seedNotifications.map((item) => item.id));

function localFeed(state: { posts: Post[]; comments: Comment[]; likes: Like[]; notifications: AppNotification[] }): SavedFeed {
  return {
    posts: state.posts.filter((post) => !seedPostIds.has(post.id)),
    comments: state.comments.filter((comment) => !seedCommentIds.has(comment.id)),
    likes: state.likes.filter(
      (like) =>
        !seedLikes.some(
          (seed) => seed.targetType === like.targetType && seed.targetId === like.targetId && seed.userId === like.userId,
        ),
    ),
    notifications: state.notifications.filter((item) => !seedNotificationIds.has(item.id)).slice(0, 80),
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function remember(state: { posts: Post[]; comments: Comment[]; likes: Like[]; notifications: AppNotification[] }) {
  void writeFeed(localFeed(state));
}

function placePost(post: Post) {
  const me = useSessionStore.getState().user;
  useCommunityStore.setState((state) => ({
    users: me && !state.users.some((user) => user.id === me.id) ? [me, ...state.users] : state.users,
    posts: state.posts.some((item) => item.id === post.id) ? state.posts : [post, ...state.posts],
  }));
  remember(useCommunityStore.getState());
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
    const userId = actorId();
    const liked = hasLike(get().likes, targetType, targetId, userId);
    set((state) => ({
      likes: liked
        ? state.likes.filter(
            (like) => !(like.targetType === targetType && like.targetId === targetId && like.userId === userId),
          )
        : [...state.likes, { targetType, targetId, userId }],
    }));
    remember(get());
    const token = useSessionStore.getState().token;
    if (token && isUuid(targetId)) void toggleReaction(token, { targetType, targetId }).catch(() => undefined);
  },
  addComment: async ({ postId, body, parentId }) => {
    const token = useSessionStore.getState().token;
    const remote = Boolean(token) && isUuid(postId) && (!parentId || isUuid(parentId));
    let comment: Comment;
    let synced = !remote;
    if (remote && token) {
      try {
        const saved = await publishComment(token, { postId, body, parentId });
        comment = saved.comment;
        synced = true;
      } catch (error) {
        comment = {
          id: createId('c'),
          postId,
          authorId: actorId(),
          body: body.trim(),
          parentId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ comments: [...state.comments, comment] }));
        remember(get());
        throw error;
      }
    } else {
      comment = {
        id: createId('c'),
        postId,
        authorId: actorId(),
        body: body.trim(),
        parentId,
        createdAt: new Date().toISOString(),
      };
    }
    set((state) => ({
      comments: state.comments.some((item) => item.id === comment.id) ? state.comments : [...state.comments, comment],
    }));
    remember(get());
    if (synced) useSessionStore.getState().addPoints(POINTS.comment);
    const post = get().posts.find((item) => item.id === postId);
    const me = actorId();
    if (!post || comment.authorId === me) return synced;
    const mentioned = mentionsCurrentUser(body);
    if (post.authorId !== me && !mentioned) return synced;
    const actor = get().users.find((user) => user.id === comment.authorId);
    const name = actor ? displayName(actor) : 'Un partisan';
    get().receiveAlert(
      mentioned
        ? { type: 'mention', postId, actorId: comment.authorId, title: 'Mention', body: `${name} vous a mentionné.` }
        : {
            type: 'reply',
            postId,
            actorId: comment.authorId,
            title: 'Nouvelle réponse',
            body: `${name} a répondu à votre publication.`,
          },
    );
    return synced;
  },
  deleteComment: (commentId) => {
    const comment = get().comments.find((item) => item.id === commentId);
    if (!comment || comment.authorId !== actorId()) return;
    const removed = new Set(
      [commentId, ...get().comments.filter((item) => item.parentId === commentId).map((item) => item.id)],
    );
    set((state) => ({
      comments: state.comments.filter((item) => !removed.has(item.id)),
      likes: state.likes.filter((like) => !(like.targetType === 'comment' && removed.has(like.targetId))),
    }));
    remember(get());
    const token = useSessionStore.getState().token;
    if (token && isUuid(commentId)) void removeRemoteComment(token, commentId).catch(() => undefined);
  },
  createPost: async (input) => {
    const hashtags = mergeTags(input.body, input.extraTags);
    const token = useSessionStore.getState().token;
    let post: Post;
    let synced = false;
    if (token) {
      try {
        const saved = await publishPost(token, {
          body: input.body,
          category: input.category,
          imageUrl: input.imageUrl,
          playerId: input.playerId,
          teamId: input.teamId,
          matchId: input.matchId,
          hashtags,
        });
        post = saved.post;
        synced = true;
      } catch (error) {
        post = {
          id: createId('p'),
          authorId: actorId(),
          body: input.body.trim(),
          imageUrl: input.imageUrl,
          category: input.category,
          playerId: input.playerId,
          teamId: input.teamId,
          matchId: input.matchId,
          hashtags,
          createdAt: new Date().toISOString(),
        };
        placePost(post);
        throw error;
      }
    } else {
      post = {
        id: createId('p'),
        authorId: actorId(),
        body: input.body.trim(),
        imageUrl: input.imageUrl,
        category: input.category,
        playerId: input.playerId,
        teamId: input.teamId,
        matchId: input.matchId,
        hashtags,
        createdAt: new Date().toISOString(),
      };
    }
    placePost(post);
    if (synced) useSessionStore.getState().addPoints(POINTS.post);
    return post;
  },
  deletePost: (postId) => {
    const post = get().posts.find((item) => item.id === postId);
    if (!post || post.authorId !== actorId()) return;
    set((state) => ({
      posts: state.posts.filter((item) => item.id !== postId),
      comments: state.comments.filter((item) => item.postId !== postId),
      likes: state.likes.filter((like) => !(like.targetType === 'post' && like.targetId === postId)),
    }));
    remember(get());
    const token = useSessionStore.getState().token;
    if (token) void removeRemotePost(token, postId).catch(() => undefined);
  },
  hidePost: (postId) => {
    if (get().hiddenPostIds.includes(postId)) return;
    set((state) => ({ hiddenPostIds: [...state.hiddenPostIds, postId] }));
  },
  reportPost: (postId, reason) => {
    const report: Report = {
      id: createId('r'),
      postId,
      userId: actorId(),
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
  receiveAlert: (input) => {
    const item: AppNotification = {
      id: createId('n'),
      type: input.type,
      createdAt: new Date().toISOString(),
      read: false,
      title: input.title,
      body: input.body,
      actorId: input.actorId,
      postId: input.postId,
      matchId: input.matchId,
    };
    set((state) => ({ notifications: [item, ...state.notifications] }));
    remember(get());
    void ring(input.type, input.title, input.body);
  },
  hydrateFeed: async () => {
    const saved = await readFeed();
    if (saved) {
      set((state) => ({
        posts: [...saved.posts.filter((post) => !state.posts.some((item) => item.id === post.id)), ...state.posts],
        comments: [
          ...saved.comments.filter((comment) => !state.comments.some((item) => item.id === comment.id)),
          ...state.comments,
        ],
        likes: [
          ...state.likes,
          ...saved.likes.filter(
            (like) =>
              !state.likes.some(
                (item) => item.targetType === like.targetType && item.targetId === like.targetId && item.userId === like.userId,
              ),
          ),
        ],
        notifications: [
          ...saved.notifications.filter((item) => !state.notifications.some((current) => current.id === item.id)),
          ...state.notifications,
        ],
      }));
    }
    try {
      const remote = await fetchPosts();
      set((state) => ({
        users: [
          ...remote.authors.filter((author) => !state.users.some((user) => user.id === author.id)),
          ...state.users,
        ],
        posts: [...remote.posts.filter((post) => !state.posts.some((item) => item.id === post.id)), ...state.posts],
        comments: [
          ...(remote.comments ?? []).filter((comment) => !state.comments.some((item) => item.id === comment.id)),
          ...state.comments,
        ],
        likes: [
          ...state.likes,
          ...(remote.likes ?? []).filter(
            (like) =>
              !state.likes.some(
                (item) => item.targetType === like.targetType && item.targetId === like.targetId && item.userId === like.userId,
              ),
          ),
        ],
      }));
      remember(get());
    } catch {
      // Le fil local reste affiché si Neon ne répond pas.
    }
  },
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
    }));
    remember(get());
  },
  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, read: true })),
    }));
    remember(get());
  },
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
