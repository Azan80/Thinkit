'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  createdAt: string;
}

export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    fetchUserPosts();
  }, [username]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/posts?userId=${username}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
        <Link href="/" className="text-indigo-600 hover:text-indigo-500">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-start space-x-6">
          <img
            src={user.avatarUrl || '/default-avatar.svg'}
            alt={user.username}
            className="w-20 h-20 rounded-full"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
            {user.bio && (
              <p className="text-gray-600 mb-4">{user.bio}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Member since {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
              <span>{posts.length} posts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Posts by {user.username}</h2>
        
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-gray-400">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-400">{post.upvotes} upvotes</span>
                </div>
                
                <Link href={`/posts/${post._id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600">
                    {post.title}
                  </h3>
                </Link>
                
                <p className="text-gray-600 mb-3">
                  {post.content.length > 200 
                    ? post.content.substring(0, 200) + '...' 
                    : post.content}
                </p>
                
                <div className="flex items-center space-x-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/?tag=${tag}`}
                      className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-200"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 