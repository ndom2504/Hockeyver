import type { Comment, Post } from '@/types/social';

export function filterFeedPosts(posts: Post[], hiddenPostIds: string[], blockedUserIds: string[]) {
  return posts.filter((post) => !hiddenPostIds.includes(post.id) && !blockedUserIds.includes(post.authorId));
}

export function filterFeedComments(comments: Comment[], blockedUserIds: string[]) {
  return comments.filter((comment) => !blockedUserIds.includes(comment.authorId));
}
