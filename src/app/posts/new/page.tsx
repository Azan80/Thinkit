'use client';

import { cn } from '@/lib/utils';
import {
    ArrowLeftIcon,
    CodeBracketIcon,
    DocumentTextIcon,
    EyeIcon,
    EyeSlashIcon,
    InformationCircleIcon,
    LinkIcon,
    ListBulletIcon,
    PhotoIcon,
    PlusCircleIcon,
    SparklesIcon,
    TagIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BoldIcon,
    Heading1Icon,
    Heading2Icon,
    ItalicIcon,
    ListOrderedIcon,
    QuoteIcon,
    StrikethroughIcon
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ToolbarButton {
    icon: React.ReactNode;
    label: string;
    action: string;
    shortcut?: string;
}

export default function NewPost() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
    });
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            imagePreviews.forEach(preview => {
                if (preview.startsWith('blob:')) {
                    URL.revokeObjectURL(preview);
                }
            });
        };
    }, [imagePreviews]);

    const toolbarButtons: ToolbarButton[] = [
        { icon: <Heading1Icon className="w-4 h-4" />, label: 'Heading 1', action: '# ', shortcut: '1' },
        { icon: <Heading2Icon className="w-4 h-4" />, label: 'Heading 2', action: '## ', shortcut: '2' },
        { icon: <BoldIcon className="w-4 h-4" />, label: 'Bold', action: '**', shortcut: 'b' },
        { icon: <ItalicIcon className="w-4 h-4" />, label: 'Italic', action: '*', shortcut: 'i' },
        { icon: <StrikethroughIcon className="w-4 h-4" />, label: 'Strikethrough', action: '~~' },
        { icon: <CodeBracketIcon className="w-4 h-4" />, label: 'Code', action: '`' },
        { icon: <QuoteIcon className="w-4 h-4" />, label: 'Quote', action: '> ' },
        { icon: <ListBulletIcon className="w-4 h-4" />, label: 'Bullet List', action: '- ' },
        { icon: <ListOrderedIcon className="w-4 h-4" />, label: 'Numbered List', action: '1. ' },
        { icon: <LinkIcon className="w-4 h-4" />, label: 'Link', action: '[](url)' },
    ];

    // Add these helper functions after the toolbarButtons array
    const insertText = (before: string, after: string = before) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        // If no text is selected and it's a block-level format, insert at line start
        if (start === end && (before === '# ' || before === '## ' || before === '> ' || before === '- ' || before === '1. ')) {
            // Find the start of the current line
            const lineStart = text.lastIndexOf('\n', start - 1) + 1;
            const lineEnd = text.indexOf('\n', start);
            const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

            // Remove the formatting if it's already applied
            if (currentLine.startsWith(before)) {
                const newText = text.substring(0, lineStart) + currentLine.substring(before.length) + text.substring(lineEnd === -1 ? text.length : lineEnd);
                setFormData(prev => ({ ...prev, content: newText }));
                textarea.setSelectionRange(lineStart, lineStart + currentLine.length - before.length);
            } else {
                // Add the formatting
                const newText = text.substring(0, lineStart) + before + currentLine + text.substring(lineEnd === -1 ? text.length : lineEnd);
                setFormData(prev => ({ ...prev, content: newText }));
                textarea.setSelectionRange(lineStart + before.length, lineStart + before.length + currentLine.length);
            }
            return;
        }

        // For inline formatting
        if (start === end) {
            // If no text is selected, just insert the markers and place cursor between them
            const newText = text.substring(0, start) + before + after + text.substring(end);
            setFormData(prev => ({ ...prev, content: newText }));
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + before.length, start + before.length);
            }, 0);
            return;
        }

        // Check if the selected text already has the formatting
        const hasFormatting = selectedText.startsWith(before) && selectedText.endsWith(after);

        if (hasFormatting) {
            // Remove formatting
            const newText = text.substring(0, start) +
                selectedText.substring(before.length, selectedText.length - after.length) +
                text.substring(end);
            setFormData(prev => ({ ...prev, content: newText }));
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(
                    start,
                    end - (before.length + after.length)
                );
            }, 0);
        } else {
            // Add formatting
            const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
            setFormData(prev => ({ ...prev, content: newText }));
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(
                    start + before.length,
                    end + before.length
                );
            }, 0);
        }
    };

    const handleToolbarClick = (action: string) => {
        switch (action) {
            case '# ':
            case '## ':
            case '> ':
            case '- ':
            case '1. ':
                insertText(action, '');
                break;
            case '[](url)':
                const textarea = textareaRef.current;
                if (!textarea) return;

                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);

                if (selectedText) {
                    insertText('[', '](url)');
                } else {
                    insertText('[Link text](url)');
                    // Position cursor to replace "Link text"
                    setTimeout(() => {
                        textarea.setSelectionRange(start + 1, start + 10);
                    }, 0);
                }
                break;
            default:
                insertText(action);
                break;
        }
    };

    const handleKeyboardShortcut = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.metaKey || e.ctrlKey) {
            const button = toolbarButtons.find(b => b.shortcut === e.key.toLowerCase());
            if (button) {
                e.preventDefault();
                handleToolbarClick(button.action);
            }
        }
    };

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
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                        <DocumentTextIcon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign in to create a post</h1>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Join our community and share your thoughts, ideas, and knowledge with others.
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                        <Link
                            href="/auth/signin"
                            className="bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-900 transition-colors duration-200"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="border-2 border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-medium hover:border-black hover:text-black transition-colors duration-200"
                        >
                            Create account
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        let totalSize = files.reduce((acc, file) => acc + file.size, 0);

        // Add size of existing images
        totalSize += selectedImages.reduce((acc, file) => acc + file.size, 0);

        // Check total size (20MB total limit)
        if (totalSize > 20 * 1024 * 1024) {
            setError('Total image size must be less than 20MB');
            return;
        }

        // Process each new file
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                setError(`Image ${file.name} is larger than 5MB`);
                return;
            }

            if (!file.type.startsWith('image/')) {
                setError(`File ${file.name} is not an image`);
                return;
            }

            // Create a URL for the image preview
            const imageUrl = URL.createObjectURL(file);
            setSelectedImages(prev => [...prev, file]);
            setImagePreviews(prev => [...prev, imageUrl]);
        });

        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));

        // Clean up the object URL before removing from previews
        const previewUrl = imagePreviews[index];
        if (previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }

        setImagePreviews(prev => prev.filter((_, i) => i !== index));

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('content', formData.content);
            formDataToSend.append('tags', JSON.stringify(tags));

            // Add each image to form data
            selectedImages.forEach((image, index) => {
                formDataToSend.append(`image${index}`, image);
            });

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
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
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
                        "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                        previewMode
                            ? "bg-gray-900 text-white hover:bg-gray-800"
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border-0 text-2xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                            placeholder="Post title"
                            maxLength={300}
                        />
                    </div>

                    {/* Content Section with Toolbar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        {/* Toolbar */}
                        <div className="border-b border-gray-200 p-3 flex flex-wrap items-center gap-1 bg-gray-50">
                            <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                                {toolbarButtons.slice(0, 2).map((button, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleToolbarClick(button.action)}
                                        className="p-2 hover:bg-white rounded-lg transition-colors group relative text-gray-700 hover:text-black"
                                        title={`${button.label}${button.shortcut ? ` (⌘${button.shortcut})` : ''}`}
                                    >
                                        {button.icon}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                                {toolbarButtons.slice(2, 5).map((button, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleToolbarClick(button.action)}
                                        className="p-2 hover:bg-white rounded-lg transition-colors group relative text-gray-700 hover:text-black"
                                        title={`${button.label}${button.shortcut ? ` (⌘${button.shortcut})` : ''}`}
                                    >
                                        {button.icon}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                                {toolbarButtons.slice(5, 7).map((button, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleToolbarClick(button.action)}
                                        className="p-2 hover:bg-white rounded-lg transition-colors group relative text-gray-700 hover:text-black"
                                        title={`${button.label}${button.shortcut ? ` (⌘${button.shortcut})` : ''}`}
                                    >
                                        {button.icon}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                {toolbarButtons.slice(7).map((button, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleToolbarClick(button.action)}
                                        className="p-2 hover:bg-white rounded-lg transition-colors group relative text-gray-700 hover:text-black"
                                        title={`${button.label}${button.shortcut ? ` (⌘${button.shortcut})` : ''}`}
                                    >
                                        {button.icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor/Preview */}
                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                {previewMode ? (
                                    <motion.div
                                        key="preview"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="prose prose-lg max-w-none min-h-[300px] p-4 bg-gray-50 rounded-xl"
                                    >
                                        {formData.content ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {formData.content}
                                            </ReactMarkdown>
                                        ) : (
                                            <div className="text-gray-400 italic">
                                                Nothing to preview yet...
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="editor"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <textarea
                                            ref={textareaRef}
                                            id="content"
                                            name="content"
                                            required
                                            value={formData.content}
                                            onChange={handleChange}
                                            onKeyDown={handleKeyboardShortcut}
                                            rows={12}
                                            className="w-full p-4 border-0 focus:ring-0 font-mono text-base leading-relaxed resize-none text-gray-900 placeholder-gray-400"
                                            placeholder="Write your post content here..."
                                        />
                                        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                <InformationCircleIcon className="w-4 h-4" />
                                                <span>Markdown supported</span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {formData.content.length} characters
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <PhotoIcon className="w-5 h-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Images</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <PlusCircleIcon className="w-5 h-5" />
                                <span>Add Image</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group aspect-w-16 aspect-h-9">
                                    <div className="w-full h-full rounded-xl overflow-hidden bg-gray-50">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-xl" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-opacity-70"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {imagePreviews.length === 0 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors"
                                >
                                    <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Click to add images</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                                </button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            multiple
                        />
                    </div>

                    {/* Tags Section */}
                    <div className="bg-white text-gray-600 rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <TagIcon className="w-5 h-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Tags</span>
                                <span className="text-xs text-gray-500">({tags.length}/5)</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    id="tagInput"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value.toLowerCase())}
                                    onKeyDown={handleTagInputKeyDown}
                                    disabled={tags.length >= 5}
                                    className={cn(
                                        "w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200",
                                        tags.length >= 5 && "bg-gray-50 cursor-not-allowed"
                                    )}
                                    placeholder={tags.length >= 5 ? "Maximum tags reached" : "Add a tag and press Enter"}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 group hover:bg-gray-200 transition-colors"
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-1.5 text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3"
                            >
                                <div className="flex-shrink-0 text-red-400">
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-red-600 font-medium">Error</p>
                                    <p className="mt-1 text-sm text-red-500">{error}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setError('')}
                                    className="flex-shrink-0 text-red-400 hover:text-red-500"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                            disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                            className={cn(
                                "relative px-8 py-3 rounded-xl font-medium transition-colors duration-200",
                                isSubmitting || !formData.title.trim() || !formData.content.trim()
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-black text-white hover:bg-gray-900"
                            )}
                        >
                            <span className={cn("flex items-center space-x-2", isSubmitting && "opacity-0")}>
                                <SparklesIcon className="w-5 h-5" />
                                <span>Publish Post</span>
                            </span>
                            {isSubmitting && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
} 