import React, { useState } from 'react';

const SettingsPage: React.FC = () => {
  const [quality, setQuality] = useState('high');
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);

  return (
    /* Modifications :
       1. h-screen : fixe la hauteur à celle de l'écran.
       2. w-full : s'assure qu'il prend toute la largeur.
       3. overflow-y-auto : active le scroll vertical.
    */
    <main className="h-screen w-full pt-24 pb-48 px-4 bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-6xl font-extrabold font-headline tracking-tighter text-white mb-12">Settings</h2>

        <div className="space-y-12">
          {/* Account Section */}
          <section>
            <h3 className="text-2xl font-bold font-headline text-white mb-6 pb-2 border-b border-outline-variant/20">Account</h3>
            <div className="flex items-center justify-between bg-surface-container rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  <img
                    alt="User profile"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuANNKNmT78WXv7Ps6w4_J-Rm6OkaUGtbJn8Pqe004opN7wXI4XTbzhgCqQu7ZTHaZTrdDzK2JAY4RPUy-0fXaLbHVsUhdTABfBCPYfbRnXyZ1xsrqIk0wIkg4wNZ19LPmsenJlBI9UXB7nw1a_C5Y0Wk23i5pFVfSoBgYMDQOIxe-sjwu4zvGGOuO0FNLOkH-K-MvQCCdHlQgY1L35nSZjUBAfDIPNOkjYr0ku4rQrpGVg5MxyMYeZbqRxmNYu6HjEQgGic4jJcKQ"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Bambinos</h4>
                  <p className="text-on-surface-variant text-sm">bambinos.235@gmail.com</p>
                </div>
              </div>
              <button className="px-6 py-2 rounded-full border border-outline-variant text-white font-bold hover:bg-surface-container-highest transition-colors">
                Edit Profile
              </button>
            </div>
          </section>

          {/* Playback Section */}
          <section>
            <h3 className="text-2xl font-bold font-headline text-white mb-6 pb-2 border-b border-outline-variant/20">Playback</h3>
            <div className="bg-surface-container rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-white">Audio Quality</h4>
                  <p className="text-on-surface-variant text-sm mt-1">Select the default streaming quality</p>
                </div>
                <select 
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="bg-surface-container-highest text-white border border-outline-variant/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Low (Data Saver)</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="very-high">Very High (Lossless)</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                <div>
                  <h4 className="text-lg font-bold text-white">Crossfade</h4>
                  <p className="text-on-surface-variant text-sm mt-1">Allow smooth transitions between songs</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section>
            <h3 className="text-2xl font-bold font-headline text-white mb-6 pb-2 border-b border-outline-variant/20">Appearance</h3>
            <div className="bg-surface-container rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-white">Theme</h4>
                  <p className="text-on-surface-variant text-sm mt-1">Choose your preferred visual style</p>
                </div>
                <div className="flex gap-2 bg-surface-container-highest p-1 rounded-lg">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${theme === 'light' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${theme === 'dark' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
                  >
                    Dark
                  </button>
                  <button 
                    onClick={() => setTheme('system')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${theme === 'system' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
                  >
                    System
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section>
            <h3 className="text-2xl font-bold font-headline text-white mb-6 pb-2 border-b border-outline-variant/20">Notifications</h3>
            <div className="bg-surface-container rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-white">Push Notifications</h4>
                  <p className="text-on-surface-variant text-sm mt-1">Receive updates about new releases and recommendations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notifications}
                    onChange={() => setNotifications(!notifications)}
                  />
                  <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;