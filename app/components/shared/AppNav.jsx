"use client";
import { HeaderIcon } from "./HeaderIcon";
import { LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";

export function AppNav({ session, onMenuClick }) {
  return (
    <nav className="bg-[#fdf8eb] shadow-sm w-full shrink-0 z-20 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-3 text-amber-700 hover:text-orange-500 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <HeaderIcon className="block" />
        </div>
        <div className="flex items-center space-x-3 pr-4 sm:pr-6">
          {session?.user?.image && (
            <img src={session.user.image} alt={session.user.name} className="w-8 h-8 rounded-full" />
          )}
          <span className="text-gray-700 text-sm hidden sm:inline">
            Welcome, {session?.user?.name}
          </span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}