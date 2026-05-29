/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { MainFeed } from './components/MainFeed';
import { LivePlayer } from './components/LivePlayer';
import { ProfileView } from './components/ProfileView';
import { AdminPanel } from './components/AdminPanel';
import { AuthPage } from './components/AuthPage';
import { LiveStream } from './types';

function AppContent() {
  const { currentUser } = usePlatform();
  const [activeView, setActiveView] = useState<'HOME' | 'LIVE_PLAYER' | 'PROFILE' | 'ADMIN_PANEL'>('HOME');
  const [selectedLive, setSelectedLive] = useState<LiveStream | null>(null);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);

  if (!currentUser) {
    return <AuthPage />;
  }

  const handleSelectLive = (live: LiveStream) => {
    setSelectedLive(live);
    setActiveView('LIVE_PLAYER');
  };

  const handleSelectHost = (hostId: string) => {
    setSelectedHostId(hostId);
    setActiveView('PROFILE');
  };

  const handleNavigate = (view: 'HOME' | 'PROFILE' | 'ADMIN_PANEL') => {
    if (view === 'PROFILE') {
      setSelectedHostId(currentUser.id); // View own profile
    }
    setActiveView(view);
  };

  return (
    <div className={`bg-gray-950 text-gray-150 flex flex-col font-sans ${activeView === 'LIVE_PLAYER' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      
      {/* 2. DYNAMIC ROUTING LAYOUT VIEW */}
      <div className={`flex-1 ${activeView === 'LIVE_PLAYER' ? 'h-full overflow-hidden' : ''}`}>
        {activeView === 'HOME' && (
          <MainFeed
            onSelectLive={handleSelectLive}
            onSelectHost={handleSelectHost}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'LIVE_PLAYER' && selectedLive && (
          <LivePlayer
            live={selectedLive}
            onClose={() => {
              setSelectedLive(null);
              setActiveView('HOME');
            }}
            onSelectHost={handleSelectHost}
          />
        )}

        {activeView === 'PROFILE' && (
          <ProfileView
            userId={selectedHostId || currentUser.id}
            onNavigateHome={() => {
              setSelectedHostId(null);
              setActiveView('HOME');
            }}
            onSelectLive={handleSelectLive}
          />
        )}

        {activeView === 'ADMIN_PANEL' && (
          <AdminPanel
            onClose={() => setActiveView('HOME')}
          />
        )}
      </div>

    </div>
  );
}

export default function App() {
  return (
    <PlatformProvider>
      <AppContent />
    </PlatformProvider>
  );
}
