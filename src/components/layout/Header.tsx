'use client';

import {
    Bars3Icon,
    BellIcon,
    HomeIcon,
    MagnifyingGlassIcon,
    PlusCircleIcon,
    UserCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' });
        setIsProfileOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                    <span className="text-white font-bold text-lg">S</span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                SocialApp
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/"
                            className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                        >
                            <HomeIcon className="w-5 h-5" />
                            <span className="font-medium">Home</span>
                        </Link>
                        <Link
                            href="/posts/new"
                            className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            <span className="font-medium">Create</span>
                        </Link>
                        {session?.user && (
                            <Link
                                href={`/profile/${session.user.name}`}
                                className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                            >
                                <UserCircleIcon className="w-5 h-5" />
                                <span className="font-medium">Profile</span>
                            </Link>
                        )}
                    </nav>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {status === 'loading' ? (
                            <div className="animate-pulse flex space-x-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                            </div>
                        ) : session ? (
                            <div className="relative">
                                <div className="flex items-center space-x-3">
                                    <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
                                        <BellIcon className="w-6 h-6" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                                    </button>

                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                                    >
                                        <img
                                            src={session.user?.image || '/default-avatar.svg'}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full ring-2 ring-gray-200"
                                        />
                                        <span className="text-sm font-medium text-gray-700 hidden lg:block">
                                            {session.user?.name}
                                        </span>
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                                                <p className="text-sm text-gray-500">{session.user?.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    href={`/profile/${session.user?.name}`}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    Your Profile
                                                </Link>
                                                <Link
                                                    href="/settings"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    Settings
                                                </Link>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    Sign out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link
                                    href="/auth/signin"
                                    className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                        >
                            {isMenuOpen ? (
                                <XMarkIcon className="w-6 h-6" />
                            ) : (
                                <Bars3Icon className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t border-gray-200 py-4"
                        >
                            <div className="space-y-2">
                                <Link
                                    href="/"
                                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <HomeIcon className="w-5 h-5" />
                                    <span>Home</span>
                                </Link>
                                <Link
                                    href="/posts/new"
                                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <PlusCircleIcon className="w-5 h-5" />
                                    <span>Create Post</span>
                                </Link>
                                {session?.user && (
                                    <Link
                                        href={`/profile/${session.user.name}`}
                                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <UserCircleIcon className="w-5 h-5" />
                                        <span>Profile</span>
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
} 