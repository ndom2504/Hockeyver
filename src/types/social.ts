export type PostCategory = 'player' | 'team' | 'match' | 'nhl' | 'society';

export type FanUser = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
  favoriteTeamId: string;
  bio: string;
  points: number;
};

export type Post = {
  id: string;
  authorId: string;
  body: string;
  imageUrl?: string;
  category: PostCategory;
  playerId?: string;
  teamId?: string;
  matchId?: string;
  hashtags: string[];
  createdAt: string;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  parentId?: string;
};

export type LikeTarget = 'post' | 'comment';

export type Like = {
  targetType: LikeTarget;
  targetId: string;
  userId: string;
};

export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
};

export type NotificationType =
  | 'reply'
  | 'reaction'
  | 'mention'
  | 'favorite_team'
  | 'game_start'
  | 'game_result'
  | 'poll';

export type AppNotification = {
  id: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  actorId?: string;
  postId?: string;
  matchId?: string;
};

export type ReportReason = 'spam' | 'offensive' | 'harassment' | 'offtopic' | 'other';

export type Report = {
  id: string;
  postId: string;
  userId: string;
  reason: ReportReason;
  createdAt: string;
};
