'use client';

import { cn } from '@/lib/utils';
import {
    ArrowLeftIcon,
    DocumentTextIcon,
    EyeIcon,
    EyeSlashIcon,
    PhotoIcon,
    SparklesIcon,
    TagIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function NewPost() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
    });
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [previewMode, setPreviewMode] = useState(false);

    if (status === 'loading') {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="max-w-4xl mx-auto text-center py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <DocumentTextIcon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign in to create a post</h1>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Join our community and share your thoughts, ideas, and knowledge with others.
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                        <Link
                            href="/auth/signin"
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-medium hover:border-indigo-500 hover:text-indigo-600 transition-all duration-200"
                        >
                            Create account
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('content', formData.content);
            formDataToSend.append('tags', JSON.stringify(tags));

            if (selectedImage) {
                formDataToSend.append('image', selectedImage);
            }

            const response = await fetch('/api/posts', {
                method: 'POST',
                body: formDataToSend,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to create post');
            } else {
                router.push(`/posts/${data._id}`);
            }
        } catch (error) {
            setError('An error occurred while creating the post');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (!tags.includes(newTag) && newTag.length > 0) {
                setTags([...tags, newTag]);
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size must be less than 5MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div className="flex items-center space-x-4">
                    <Link
                        href="/"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Create a New Post</h1>
                        <p className="text-gray-600 mt-1">Share your knowledge with the community</p>
                    </div>
                </div>

                <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                        previewMode
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                >
                    {previewMode ? (
                        <>
                            <EyeSlashIcon className="w-5 h-5" />
                            <span>Edit</span>
                        </>
                    ) : (
                        <>
                            <EyeIcon className="w-5 h-5" />
                            <span>Preview</span>
                        </>
                    )}
                </button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Title Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-3">
                            Post Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-medium text-gray-900 placeholder-gray-500"
                            placeholder="What's your post about?"
                            maxLength={300}
                        />
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-sm text-gray-500">
                                Be specific and descriptive to help others find your post
                            </p>
                            <span className="text-sm text-gray-400">
                                {formData.title.length}/300
                            </span>
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center space-x-2 mb-3">
                            <PhotoIcon className="w-5 h-5 text-gray-500" />
                            <label className="block text-sm font-medium text-gray-700">
                                Featured Image (Optional)
                            </label>
                        </div>

                        {imagePreview ? (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-64 object-cover rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                            >
                                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-2">Click to upload an image</p>
                                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>

                    {/* Content Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                                Content
                            </label>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <DocumentTextIcon className="w-4 h-4" />
                                <span>Markdown supported</span>
                            </div>
                        </div>
                        <textarea
                            id="content"
                            name="content"
                            required
                            value={formData.content}
                            onChange={handleChange}
                            rows={16}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm leading-relaxed resize-none text-gray-900 placeholder-gray-500"
                            placeholder="Write your post content here... You can use markdown formatting like **bold**, *italic*, `code`, [links](url), and more."
                        />
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Markdown Tips:</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div>**bold** → <strong>bold</strong></div>
                                <div>*italic* → <em>italic</em></div>
                                <div>`code` → <code className="bg-gray-200 px-1 rounded">code</code></div>
                                <div>[link](url) → <a href="#" className="text-indigo-600">link</a></div>
                            </div>
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center space-x-2 mb-3">
                            <TagIcon className="w-5 h-5 text-gray-500" />
                            <label htmlFor="tagInput" className="block text-sm font-medium text-gray-700">
                                Tags
                            </label>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                id="tagInput"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagInputKeyDown}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                placeholder="Type a tag and press Enter to add it"
                            />

                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-2 text-indigo-600 hover:text-indigo-800"
                                            >
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-gray-500 mt-2">
                            Press Enter to add tags. Tags help others discover your post.
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-4"
                        >
                            <p className="text-red-600 text-sm">{error}</p>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="text-gray-600 hover:text-gray-800 px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Creating...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <SparklesIcon className="w-5 h-5" />
                                    <span>Publish Post</span>
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
} 