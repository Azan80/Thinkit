'use client';

import { supabase } from '@/lib/supabase/client';
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
import { useSupabaseSession } from './Providers';

export default function Header() {
    const { data: nextAuthSession, status: nextAuthStatus } = useSession();
    const { session: supabaseSession, loading: supabaseLoading } = useSupabaseSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Only consider user logged in if they have a NextAuth session
    // Supabase session alone (from email verification) should not show user as logged in
    const isLoggedIn = !!nextAuthSession;
    const isLoading = nextAuthStatus === 'loading' || supabaseLoading;

    const handleSignOut = async () => {
        // Sign out from both NextAuth and Supabase
        if (nextAuthSession) {
            await signOut({ callbackUrl: '/' });
        }
        if (supabaseSession) {
            await supabase.auth.signOut();
        }
        setIsProfileOpen(false);
    };

    // Get user info only from NextAuth session
    const user = nextAuthSession?.user;
    const userName = nextAuthSession?.user?.name || user?.email?.split('@')[0];
    const userEmail = user?.email;
    const userImage = nextAuthSession?.user?.image || '/default-avatar.svg';

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">S</span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                                SocialApp
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        <Link
                            href="/"
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <HomeIcon className="w-5 h-5" />
                            <span className="font-medium">Home</span>
                        </Link>
                        <Link
                            href="/posts/new"
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            <span className="font-medium">Create</span>
                        </Link>
                        {isLoggedIn && (
                            <Link
                                href={`/profile/${userName}`}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
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
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-md focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
                            />
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {isLoading ? (
                            <div className="animate-pulse flex space-x-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                            </div>
                        ) : isLoggedIn ? (
                            <div className="relative">
                                <div className="flex items-center space-x-3">
                                    <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                                        <BellIcon className="w-6 h-6" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                                    </button>

                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
                                    >
                                        <img
                                            src={userImage}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full border border-gray-200"
                                        />
                                        <span className="text-sm font-medium text-gray-700 hidden lg:block">
                                            {userName}
                                        </span>
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                                        >
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900">{userName}</p>
                                                <p className="text-sm text-gray-500">{userEmail}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    href={`/profile/${userName}`}
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
                                    className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-900 transition-colors"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
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
                            className="md:hidden border-t border-gray-200 py-2"
                        >
                            <div className="space-y-1 px-4">
                                <Link
                                    href="/"
                                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <HomeIcon className="w-5 h-5" />
                                    <span>Home</span>
                                </Link>
                                <Link
                                    href="/posts/new"
                                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <PlusCircleIcon className="w-5 h-5" />
                                    <span>Create Post</span>
                                </Link>
                                {isLoggedIn && (
                                    <Link
                                        href={`/profile/${userName}`}
                                        className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
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