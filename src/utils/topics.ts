import type { Comment, Like, Post } from '@/types/social';

function ageHours(iso: string, now: number) {
  return (now - new Date(iso).getTime()) / 3_600_000;
}

export function activityScore(post: Post, comments: Comment[], likes: Like[], now = Date.now()) {
  const commentCount = comments.filter((comment) => comment.postId === post.id).length;
  const likeCount = likes.filter((like) => like.targetType === 'post' && like.targetId === post.id).length;
  const recency = Math.max(0, 48 - ageHours(post.createdAt, now)) / 48;
  return commentCount * 3 + likeCount + recency * 6;
}

export function hotTopics(posts: Post[], comments: Comment[], likes: Like[], now = Date.now()) {
  const scores = new Map<string, number>();
  for (const post of posts) {
    const commentCount = comments.filter((comment) => comment.postId === post.id).length;
    const likeCount = likes.filter((like) => like.targetType === 'post' && like.targetId === post.id).length;
    const recent = ageHours(post.createdAt, now) < 72 ? 1.35 : 1;
    const weight = (2 + commentCount * 2 + likeCount) * recent;
    for (const tag of post.hashtags) {
      scores.set(tag, (scores.get(tag) ?? 0) + weight);
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, score]) => ({ tag, score }));
}
