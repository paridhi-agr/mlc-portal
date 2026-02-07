'use client';

import React, { useState, useEffect } from 'react';
import { SessionProvider,signOut, useSession } from 'next-auth/react';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import LandingPage from './components/LandingPage';

function MainApp() {
  const { data: session, status } = useSession();
  const [currentView, setCurrentView] = useState('landing');

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'student') {
        setCurrentView('studentDashboard');
      } else if (session.user.role === 'teacher') {
        setCurrentView('teacherDashboard');
      }
    } else if (status === 'unauthenticated') {
      setCurrentView('landing');
    }
  }, [status, session]);

  const handleLogout = () => {
    signOut();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  return (
    <div>
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'studentDashboard' && <StudentDashboard session={session}/>}
      {currentView === 'teacherDashboard' && <TeacherDashboard session={session}/>}
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <MainApp />
    </SessionProvider>
  );
}