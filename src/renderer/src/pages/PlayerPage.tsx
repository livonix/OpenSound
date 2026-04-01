import React, { useState } from 'react';

const PlayerPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(84); // 1:24 in seconds
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const duration = 245; // 4:05 in seconds
  const progressPercentage = (currentTime / duration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setCurrentTime(percentage * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, x / rect.width));
    setVolume(newVolume);
  };

  const lyrics = [
    "The static air is thick tonight",
    "Beneath the glow of neon light",
    "We're chasing shadows through the glass",
    "Watching every second pass",
    "The city heart begins to beat",
    "A thousand rhythms on the street",
    "The static air is thick tonight",
    "Beneath the glow of neon light",
  ];

  return (
    <main className="ml-64 min-h-screen bg-player-mesh relative overflow-hidden flex pb-24">
      {/* Top Controls Overlay */}
      <header className="absolute top-0 right-0 left-0 h-16 flex items-center justify-between px-12 z-10 bg-transparent">
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
          <span className="material-symbols-outlined text-on-surface">keyboard_arrow_down</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-label">Now Playing</p>
          <p className="text-sm font-bold font-headline">Midnight City Vibes</p>
        </div>
        <div className="flex gap-4">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-white transition-colors">
            more_horiz
          </button>
        </div>
      </header>

      {/* Player Content Grid */}
      <div className="w-full flex items-center px-12 py-20 gap-20">
        {/* Left: Album Art & Info */}
        <div className="flex-1 flex flex-col items-start">
          <div className="relative group">
            <img
              alt="Midnight City Vibes Album Art"
              className="w-[500px] h-[500px] object-cover rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] group-hover:scale-[1.02] transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlo8yAMENw-xxJ7fr7h5t7tTlxyj3jLhwd19HwIDs5wF4dx6Kx31wWvR0fcMAfXsA42SqHHY3kbhmDcD0az0bk8gWoOgc3_7yAvOdZQWoGLqM1aPWRISqCmAbmxGKlCPsci_GNp4rgGf-yYRHesl9xySz25NMXsCoL3-rI-6jVTDo4iKDzE1z34YUs-4B6o9UZarFoLicOyZP4xjPrNMJUAPchCJPifTCbbKzTZamSOUWjpZTfzeFAljZeLMLbT4lvHwb-Ipxbtg"
            />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
          
          <div className="mt-12 w-full max-w-[500px]">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-extrabold font-headline tracking-tighter text-white">Neon Afterhours</h1>
                <p className="text-xl text-primary mt-2 font-medium">Crystal Echoes</p>
              </div>
              <button 
                className="material-symbols-outlined text-3xl text-primary hover:scale-110 transition-transform"
                style={{ fontVariationSettings: isLiked ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                onClick={() => setIsLiked(!isLiked)}
              >
                favorite
              </button>
            </div>

            {/* Centered Controls within the info area for visual weight */}
            <div className="mt-12 space-y-6">
              {/* Scrubber */}
              <div 
                className="relative w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden group cursor-pointer"
                onClick={handleProgressClick}
              >
                <div 
                  className="absolute top-0 left-0 h-full scrubber-gradient rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              
              <div className="flex justify-between text-[10px] text-on-surface-variant font-label tracking-widest uppercase">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Main Buttons */}
              <div className="flex items-center justify-between px-4">
                <button 
                  className={`material-symbols-outlined text-2xl transition-colors ${isShuffling ? 'text-primary' : 'text-on-surface-variant hover:text-white'}`}
                  onClick={() => setIsShuffling(!isShuffling)}
                >
                  shuffle
                </button>
                
                <div className="flex items-center gap-8">
                  <button className="material-symbols-outlined text-4xl text-white hover:scale-110 transition-transform">
                    skip_previous
                  </button>
                  <button 
                    className="w-20 h-20 rounded-full scrubber-gradient flex items-center justify-center text-on-primary-fixed hover:scale-105 transition-transform shadow-[0_0_30px_rgba(186,158,255,0.4)]"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    <span 
                      className="material-symbols-outlined text-5xl"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                    >
                      {isPlaying ? 'pause_arrow' : 'play_arrow'}
                    </span>
                  </button>
                  <button className="material-symbols-outlined text-4xl text-white hover:scale-110 transition-transform">
                    skip_next
                  </button>
                </div>
                
                <button 
                  className={`material-symbols-outlined text-2xl transition-colors ${isRepeating ? 'text-primary' : 'text-on-surface-variant hover:text-white'}`}
                  onClick={() => setIsRepeating(!isRepeating)}
                >
                  repeat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Lyrics Panel */}
        <div className="w-1/3 h-[600px] glass-panel rounded-[2rem] p-10 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-primary font-label">Lyrics</h3>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">fullscreen</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
            {lyrics.map((line, index) => (
              <p 
                key={index}
                className={`leading-snug transition-colors ${
                  index === 2 
                    ? 'text-4xl font-extrabold text-primary leading-tight' 
                    : index < 2 
                    ? 'text-2xl font-bold text-white' 
                    : 'text-2xl font-bold text-on-surface-variant/40'
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default PlayerPage;
