export interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Post {
  _id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  createdAt: Date;
  author?: User;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: Date;
  author?: User;
  replies?: Comment[];
}

export interface Vote {
  _id: string;
  userId: string;
  postId: string;
  value: number; // 1 for upvote, -1 for downvote
}

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  expires: string;
} 