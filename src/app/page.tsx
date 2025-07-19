'use client';

import { cn } from '@/lib/utils';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  FireIcon,
  PlusCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  upvotes: number;
  createdAt: string;
  userId: {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
}

interface PostFeedProps {
  posts: Post[];
  onVote: (postId: string, value: number) => void;
}

function PostCard({ post, onVote, index }: { post: Post; onVote: (postId: string, value: number) => void; index: number }) {
  const { data: session } = useSession();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (value: number) => {
    if (!session) return;

    setIsVoting(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post._id,
          value,
        }),
      });

      if (response.ok) {
        onVote(post._id, value);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const excerpt = post.content.length > 200
    ? post.content.substring(0, 200) + '...'
    : post.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Voting Section */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => handleVote(1)}
              disabled={isVoting}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 hover:bg-orange-50",
                isVoting ? "opacity-50 cursor-not-allowed" : "hover:text-orange-500"
              )}
            >
              <ArrowUpIcon className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-gray-900 min-w-[2rem] text-center">
              {post.upvotes}
            </span>
            <button
              onClick={() => handleVote(-1)}
              disabled={isVoting}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 hover:bg-blue-50",
                isVoting ? "opacity-50 cursor-not-allowed" : "hover:text-blue-500"
              )}
            >
              <ArrowDownIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            {/* Author Info */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <img
                  src={post.userId.avatarUrl || '/default-avatar.svg'}
                  alt={post.userId.username}
                  className="w-8 h-8 rounded-full ring-2 ring-gray-100"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/profile/${post.userId.username}`}
                  className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {post.userId.username}
                </Link>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Post Title */}
            <Link href={`/posts/${post._id}`}>
              <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {post.title}
              </h2>
            </Link>

            {/* Post Image */}
            {post.imageUrl && (
              <div className="mb-4">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Post Content */}
            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
              {excerpt}
            </p>

            {/* Tags */}
            <div className="flex items-center space-x-2 mb-4">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/?tag=${tag}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  {tag}
                </Link>
              ))}
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>0 comments</span>
              </div>
              <div className="flex items-center space-x-1">
                <EyeIcon className="w-4 h-4" />
                <span>0 views</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'latest' | 'trending'>('latest');

  useEffect(() => {
    fetchPosts();
    fetchPopularTags();
  }, [selectedTag, activeTab]);

  const fetchPosts = async () => {
    try {
      const url = selectedTag ? `/api/posts?tag=${selectedTag}` : '/api/posts';
      const response = await fetch(url);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      const allTags = data.posts?.flatMap((post: Post) => post.tags) || [];
      const tagCounts = allTags.reduce((acc: any, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});

      const popular = Object.entries(tagCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

      setPopularTags(popular);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
    }
  };

  const handleVote = (postId: string, value: number) => {
    setPosts(posts.map(post =>
      post._id === postId
        ? { ...post, upvotes: post.upvotes + value }
        : post
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
          >
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-4">
          Share Your Ideas
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join our community of creators, developers, and thinkers. Share your knowledge, discover amazing content, and connect with like-minded people.
        </p>
        {session ? (
          <Link
            href="/posts/new"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <PlusCircleIcon className="w-6 h-6 mr-2" />
            Create Your First Post
          </Link>
        ) : (
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
            <button
              onClick={() => setActiveTab('latest')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                activeTab === 'latest'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Latest</span>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                activeTab === 'trending'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <FireIcon className="w-5 h-5" />
              <span>Trending</span>
            </button>
          </div>

          {/* Posts */}
          <AnimatePresence mode="wait">
            {posts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FireIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Be the first to share something amazing!</p>
                {session && (
                  <Link
                    href="/posts/new"
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Create Post
                  </Link>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {posts.map((post, index) => (
                  <PostCard key={post._id} post={post} onVote={handleVote} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Popular Tags */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FireIcon className="w-5 h-5 mr-2 text-orange-500" />
                Popular Tags
              </h3>
              <div className="space-y-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={cn(
                      "block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      selectedTag === tag
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="mt-4 w-full text-center text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Community Stats */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Community Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-indigo-100">Total Posts</span>
                  <span className="font-semibold">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-100">Active Users</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-100">Topics</span>
                  <span className="font-semibold">{popularTags.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
