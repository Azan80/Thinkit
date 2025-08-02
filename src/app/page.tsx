'use client';

import { cn } from '@/lib/utils';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  PlusCircleIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrls?: string[];
  tags: string[];
  upvotes: number;
  views: number;
  createdAt: string;
  userId: {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
}

function PostCard({ post, onVote, index }: { post: Post; onVote: (postId: string, value: number) => void; index: number }) {
  const { data: session } = useSession();
  const [isVoting, setIsVoting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const postRef = useRef<HTMLDivElement>(null);

  // Fetch view count when component mounts
  useEffect(() => {
    fetchViewCount();
  }, [post._id]);

  const fetchViewCount = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}/views`);
      if (response.ok) {
        const data = await response.json();
        setViewCount(data.views);
      }
    } catch (error) {
      console.error('Error fetching view count:', error);
    }
  };

  // Track view when post comes into view
  useEffect(() => {
    if (!session?.user || hasTrackedView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView) {
            trackView();
            setHasTrackedView(true);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the post is visible
        rootMargin: '0px 0px -100px 0px' // Trigger slightly before the post is fully in view
      }
    );

    if (postRef.current) {
      observer.observe(postRef.current);
    }

    return () => {
      if (postRef.current) {
        observer.unobserve(postRef.current);
      }
    };
  }, [session?.user, hasTrackedView, post._id]);

  const trackView = async () => {
    if (!session?.user || hasTrackedView) return;

    try {
      const response = await fetch(`/api/posts/${post._id}/view`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Update the view count if it's a new view
        if (data.isNewView) {
          setViewCount(data.views);
        }
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleVote = async (value: number) => {
    if (!session) return;
    setIsVoting(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post._id, value }),
      });
      if (response.ok) onVote(post._id, value);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const excerpt = post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content;

  return (
    <motion.div
      ref={postRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300"
    >
      <div className="flex">
        {/* Voting Section */}
        <div className="flex flex-col items-center py-4 px-2 bg-gray-50 rounded-l-xl">
          <button
            onClick={() => handleVote(1)}
            disabled={isVoting}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              isVoting ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 text-gray-500 hover:text-blue-600"
            )}
          >
            <ArrowUpIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-gray-900 my-1">
            {post.upvotes}
          </span>
          <button
            onClick={() => handleVote(-1)}
            disabled={isVoting}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              isVoting ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 text-gray-500 hover:text-red-600"
            )}
          >
            <ArrowDownIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3 mb-3">
            <Link href={`/profile/${post.userId.username}`} className="flex items-center space-x-2 group">
              <img
                src={post.userId.avatarUrl || '/default-avatar.svg'}
                alt={post.userId.username}
                className="w-8 h-8 rounded-full border-2 border-gray-100 group-hover:border-gray-200"
              />
              <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {post.userId.username}
              </span>
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Post Content */}
          <Link href={`/posts/${post._id}`} className="block group">
            <div className="flex flex-col md:flex-row gap-4">
              {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="md:w-48 flex-shrink-0 relative">
                  {post.imageUrls.length === 1 ? (
                    // Single image layout
                    <div className="h-32 overflow-hidden rounded-lg">
                      <img
                        src={post.imageUrls[0]}
                        alt={post.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : post.imageUrls && (
                    // Multiple images collage layout
                    <div className="grid grid-cols-2 gap-1 h-32 rounded-lg overflow-hidden">
                      {post.imageUrls.slice(0, 4).map((url, index) => (
                        <div
                          key={url}
                          className={cn(
                            "relative overflow-hidden",
                            post.imageUrls && post.imageUrls.length === 3 && index === 2 ? "col-span-2" : "",
                            "h-[60px]"
                          )}
                        >
                          <img
                            src={url}
                            alt={`${post.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          />
                          {index === 3 && post.imageUrls && post.imageUrls.length > 4 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-sm font-medium">
                              +{post.imageUrls.length - 4}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                  {excerpt}
                </p>
              </div>
            </div>
          </Link>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${tag}`}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <Link
                href={`/posts/${post._id}#comments`}
                className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>Comments</span>
              </Link>
              <div className="flex items-center space-x-1.5 text-sm text-gray-500">
                <EyeIcon className="w-4 h-4" />
                <span>{viewCount} views</span>
              </div>
              <button className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ShareIcon className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={cn(
                "flex items-center space-x-1.5 text-sm transition-colors",
                isBookmarked ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <BookmarkIcon className="w-4 h-4" />
              <span>Save</span>
            </button>
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async (reset: boolean = false) => {
    console.log('fetchPosts called with reset:', reset, 'page:', page);

    try {
      const currentPage = reset ? 1 : page;
      const url = selectedTag
        ? `/api/posts?tag=${selectedTag}&page=${currentPage}`
        : `/api/posts?page=${currentPage}`;

      console.log('Fetching posts from URL:', url);

      if (reset) {
        setLoading(true);
        setPosts([]); // Clear existing posts when resetting
      } else {
        setLoadingMore(true);
      }

      // Use regular fetch instead of EventSource
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const newPosts = data.posts || [];
      const pagination = data.pagination || {};

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      }

      setHasMore(pagination.hasNextPage || false);
      setPage(currentPage + 1);

    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const loadMorePosts = () => {
      if (!hasMore || loadingMore) {
        console.log('Skipping load more:', { hasMore, loadingMore });
        return;
      }
      console.log('Loading more posts...');
      setPage(prev => prev + 1);
      fetchPosts(false);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          console.log('Intersection detected, loading more posts...');
          loadMorePosts();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      console.log('Observer attached to target');
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        console.log('Observer detached from target');
        observer.unobserve(currentTarget);
        observer.disconnect();
      }
    };
  }, [hasMore, loadingMore, fetchPosts]);

  // Call fetchPosts on mount and when filters change
  useEffect(() => {
    console.log('Filter/tab changed, resetting posts...');
    setPage(1);
    setPosts([]);

    // Start fetching posts
    fetchPosts(true);

    fetchPopularTags();
  }, [selectedTag, activeTab]);

  const fetchPopularTags = async () => {
    try {
      const response = await fetch('/api/posts?limit=100');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const allPosts = data.posts || [];

      // Process tags from all posts
      const allTags = allPosts.flatMap((post: Post) => post.tags || []);
      const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});

      const popular = Object.entries(tagCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([tag]) => tag);

      setPopularTags(popular);

    } catch (error) {
      console.error('Error fetching popular tags:', error);
    }
  };

  const handleVote = (postId: string, value: number) => {
    setPosts(posts.map(post =>
      post._id === postId ? { ...post, upvotes: post.upvotes + value } : post
    ));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Filters and Create Post */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('latest')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'latest'
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              Latest
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'trending'
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              Trending
            </button>
          </div>

          {session && (
            <Link
              href="/posts/new"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Create Post</span>
            </Link>
          )}
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No posts found</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onVote={handleVote}
                    index={index}
                  />
                ))}
              </div>

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="py-8 flex justify-center items-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent align-[-0.125em]" role="status">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                      Loading...
                    </span>
                  </div>
                </div>
              )}

              {/* Intersection observer target */}
              <div
                ref={observerTarget}
                className="h-px w-full"
                aria-hidden="true"
              />

              {/* End of posts message */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 text-gray-600">
                  No more posts to load
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Tags</h2>
          <div className="space-y-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  "block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
                  selectedTag === tag
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
