"use client";
import React from 'react';
import { Calendar, Users, ClipboardList} from 'lucide-react';
import { HeaderIcon } from "./HeaderIcon";
import { signIn } from 'next-auth/react';

// Landing Page
const LandingPage = () => {
    const handleGoogleSignIn = () => {
      signIn('google');
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdf8eb] to-orange-200">
        <nav className="w-full bg-[#fdf8eb] shadow-sm">
          <div className="flex items-center p-0 m-0">
            <HeaderIcon className="block" />
          </div>
        </nav>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Master Mathematics with Expert Guidance
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Sign in with your authorized Google account to access the platform.
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="bg-white text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-md border border-gray-200 inline-flex items-center space-x-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Only registered users can access this platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Calendar className="w-12 h-12 text-orange-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Scheduled Learning</h3>
              <p className="text-gray-600">Weekly assignments tailored to your learning pace</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <ClipboardList className="w-12 h-12 text-orange-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">Monitor submissions and grades in real-time</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Users className="w-12 h-12 text-orange-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Expert Teachers</h3>
              <p className="text-gray-600">Learn from qualified math educators</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default LandingPage;