'use client';

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
    imageUrl?: string;
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postId: post._id,
                    value,
                }),
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postId: id,
                    content: newComment,
                }),
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
        <div className={`${depth > 0 ? 'ml-8' : ''} mb-4`}>
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                    <img
                        src={comment.userId.avatarUrl || '/default-avatar.svg'}
                        alt={comment.userId.username}
                        className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-900">
                        {comment.userId.username}
                    </span>
                    <span className="text-sm text-gray-400">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
            </div>
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
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
                <Link href="/" className="text-indigo-600 hover:text-indigo-500">
                    Go back home
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center space-y-1">
                        <button
                            onClick={() => handleVote(1)}
                            disabled={isVoting}
                            className="text-gray-400 hover:text-orange-500 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                        <span className="text-lg font-medium text-gray-900">{post.upvotes}</span>
                        <button
                            onClick={() => handleVote(-1)}
                            disabled={isVoting}
                            className="text-gray-400 hover:text-blue-500 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <img
                                src={post.userId.avatarUrl || '/default-avatar.svg'}
                                alt={post.userId.username}
                                className="w-8 h-8 rounded-full"
                            />
                            <span className="text-sm text-gray-600">
                                Posted by{' '}
                                <Link href={`/profile/${post.userId.username}`} className="text-indigo-600 hover:text-indigo-500">
                                    {post.userId.username}
                                </Link>
                            </span>
                            <span className="text-sm text-gray-400">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

                        {post.imageUrl && (
                            <div className="mb-6">
                                <img 
                                    src={post.imageUrl} 
                                    alt={post.title}
                                    className="w-full h-auto rounded-lg shadow-sm"
                                />
                            </div>
                        )}

                        <div className="prose max-w-none mb-6">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {post.content}
                            </ReactMarkdown>
                        </div>

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
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Comments</h2>

                {session ? (
                    <form onSubmit={handleSubmitComment} className="mb-6">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                        <div className="mt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmittingComment}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">
                            <Link href="/auth/signin" className="text-indigo-600 hover:text-indigo-500">
                                Sign in
                            </Link>{' '}
                            to leave a comment.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                    ) : (
                        comments.map((comment) => (
                            <CommentItem key={comment._id} comment={comment} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
} 