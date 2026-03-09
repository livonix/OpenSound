import React from 'react';
import { Home, Search, Library, Plus, Heart, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: Search, label: 'Rechercher', path: '/search' },
    { icon: Library, label: 'Bibliothèque', path: '/library' },
  ];

  const libraryItems = [
    { icon: Plus, label: 'Créer une playlist' },
    { icon: Heart, label: 'Titres likés' },
    { icon: Download, label: 'Épisodes téléchargés' },
  ];

  return (
    <div className="w-64 bg-black bg-opacity-50 flex flex-col p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-spotify-green">OpenSound</h1>
      </div>

      <nav className="mb-8">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <div
                  onClick={() => navigate(item.path)}
                  className="sidebar-item"
                >
                  <Icon size={24} />
                  <span className="font-semibold">{item.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-800 pt-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">MA BIBLIOTHÈQUE</span>
            <button className="text-gray-400 hover:text-white">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <ul className="space-y-2">
          {libraryItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <div className="sidebar-item">
                  <Icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
            <div>
              <p className="font-semibold text-sm">Utilisateur Invité</p>
              <p className="text-xs text-gray-400">Connectez-vous</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
