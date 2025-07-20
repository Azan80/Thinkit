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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          email: string
          created_at: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string
          image_urls: string[] | null
          tags: string[] | null
          upvotes: number
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_urls?: string[] | null
          tags?: string[] | null
          upvotes?: number
          created_at?: string
          user_id: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type DbPost = Database['public']['Tables']['posts']['Row']

export type PostWithProfile = DbPost & {
  profile?: Profile | null
}

export type CountResult = {
  count: number
} 