'use client';

import { cn } from '@/lib/utils';
import {
    ArrowDownIcon,
    ArrowUpIcon,
    BookmarkIcon,
    ShareIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Post {
    _id: string;
    title: string;
    content: string;
    imageUrls?: string[];
    tags: string[];
    upvotes: number;
    createdAt: string;
    userId: {
        _id: string;
        username: string;
        avatarUrl?: string;
        bio?: string;
    };
}

interface Comment {
    _id: string;
    content: string;
    createdAt: string;
    userId: {
        _id: string;
        username: string;
        avatarUrl?: string;
    };
    replies?: Comment[];
}

export default function PostDetail() {
    const { id } = useParams();
    const { data: session } = useSession();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, [id]);

    const fetchPost = async () => {
        try {
            const response = await fetch(`/api/posts/${id}`);
            if (response.ok) {
                const data = await response.json();
                setPost(data);
            }
        } catch (error) {
            console.error('Error fetching post:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/comments?postId=${id}`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleVote = async (value: number) => {
        if (!session || !post) return;
        setIsVoting(true);
        try {
            const response = await fetch('/api/votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post._id, value }),
            });
            if (response.ok) {
                const data = await response.json();
                setPost({ ...post, upvotes: data.upvotes });
            }
        } catch (error) {
            console.error('Error voting:', error);
        } finally {
            setIsVoting(false);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: id, content: newComment }),
            });

            if (response.ok) {
                setNewComment('');
                fetchComments();
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
        <div className={cn("border-l-2 pl-4", depth > 0 ? "ml-4 border-gray-200" : "border-transparent")}>
            <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                    <img
                        src={comment.userId.avatarUrl || '/default-avatar.svg'}
                        alt={comment.userId.username}
                        className="w-8 h-8 rounded-full border-2 border-gray-100"
                    />
                    <div>
                        <Link
                            href={`/profile/${comment.userId.username}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                            {comment.userId.username}
                        </Link>
                        <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700">{comment.content}</p>
                </div>
                <div className="mt-2 flex items-center space-x-4">
                    <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        Reply
                    </button>
                    <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        Share
                    </button>
                </div>
            </div>
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2">
                    {comment.replies.map((reply) => (
                        <CommentItem key={reply._id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
                <Link href="/" className="text-blue-600 hover:text-blue-700">
                    Go back home
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex">
                    {/* Voting Section */}
                    <div className="flex flex-col items-center py-4 px-2 bg-gray-50">
                        <button
                            onClick={() => handleVote(1)}
                            disabled={isVoting}
                            className={cn(
                                "p-1.5 rounded-lg transition-colors",
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
                                "p-1.5 rounded-lg transition-colors",
                                isVoting ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 text-gray-500 hover:text-red-600"
                            )}
                        >
                            <ArrowDownIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6">
                        {/* Author Info */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Link href={`/profile/${post.userId.username}`} className="flex items-center space-x-2 group">
                                    <img
                                        src={post.userId.avatarUrl || '/default-avatar.svg'}
                                        alt={post.userId.username}
                                        className="w-10 h-10 rounded-full border-2 border-gray-100 group-hover:border-gray-200"
                                    />
                                    <div>
                                        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors block">
                                            {post.userId.username}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </Link>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setIsBookmarked(!isBookmarked)}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isBookmarked ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                    )}
                                >
                                    <BookmarkIcon className="w-5 h-5" />
                                </button>
                                <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                                    <ShareIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {post.title}
                        </h1>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
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

                        {/* Images */}
                        {post.imageUrls && post.imageUrls.length > 0 && (
                            <div className="mb-6">
                                {post.imageUrls.length === 1 ? (
                                    // Single image layout
                                    <div className="max-w-2xl mx-auto rounded-xl overflow-hidden bg-gray-100">
                                        <div className="aspect-w-16 aspect-h-9">
                                            <img
                                                src={post.imageUrls[0]}
                                                alt={`${post.title} - Image 1`}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    // Multiple images collage layout
                                    <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
                                        {post.imageUrls.slice(0, 4).map((imageUrl, index) => (
                                            <div
                                                key={imageUrl}
                                                className={cn(
                                                    "relative rounded-xl overflow-hidden bg-gray-100",
                                                    post.imageUrls && post.imageUrls.length === 3 && index === 2 ? "col-span-2" : "",
                                                    index === 0 ? "col-span-2" : ""
                                                )}
                                            >
                                                <div className={cn(
                                                    "aspect-w-16 aspect-h-9",
                                                    index === 0 ? "aspect-h-9" : "aspect-h-12"
                                                )}>
                                                    <img
                                                        src={imageUrl}
                                                        alt={`${post.title} - Image ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {index === 3 && post.imageUrls && post.imageUrls.length > 4 && (
                                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-lg font-medium">
                                                            +{post.imageUrls.length - 4} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="prose prose-lg max-w-none mb-6">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {post.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>

                {/* Comment Form */}
                {session ? (
                    <form onSubmit={handleSubmitComment} className="mb-8">
                        <div className="bg-white text-black rounded-xl border border-gray-200 overflow-hidden">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full px-4 py-3 border-0 focus:ring-0 resize-none"
                                rows={3}
                            />
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    Use Markdown for formatting
                                </p>
                                <button
                                    type="submit"
                                    disabled={isSubmittingComment || !newComment.trim()}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium transition-colors",
                                        isSubmittingComment || !newComment.trim()
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                    )}
                                >
                                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
                        <p className="text-gray-600 mb-4">
                            Sign in to join the discussion
                        </p>
                        <Link
                            href="/auth/signin"
                            className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Sign in
                        </Link>
                    </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <CommentItem key={comment._id} comment={comment} />
                    ))}
                </div>
            </div>
        </div>
    );
} 