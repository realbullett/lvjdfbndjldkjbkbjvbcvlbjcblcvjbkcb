import React from 'react';
import { Activity, Sparkles } from 'lucide-react';

interface HeaderProps {
  onContactClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onContactClick }) => {
  return (
    <header className="fixed w-full glass-panel-strong z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer">
          {/* LV Logo Mark - Custom SVG */}
          <div className="w-11 h-11 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] opacity-90 group-hover:opacity-100 transition-opacity">
              {/* Left Leaf */}
              <path d="M50 45 C 50 45 25 40 25 15 C 25 5 45 5 50 45 Z" />
              {/* Right Leaf */}
              <path d="M50 45 C 50 45 75 40 75 15 C 75 5 55 5 50 45 Z" />
              {/* L */}
              <path d="M25 55 V 90 H 55 V 80 H 35 V 55 Z" />
              {/* V */}
              <path d="M60 55 L 72 90 L 84 55 H 74 L 72 65 L 70 55 Z" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">
              Assistant<span className="text-brand-accent">Doctor</span>
            </h1>
            <p className="text-[10px] text-purple-300/70 font-medium uppercase tracking-[0.2em] mt-1">Powered by LV Health</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button
            onClick={onContactClick}
            className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-primary/30 px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-[0_0_15px_rgba(124,58,237,0.2)]"
          >
            Contact Us
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-accent bg-brand-accent/10 px-3 py-1.5 rounded-full border border-brand-accent/20 shadow-[0_0_10px_rgba(217,70,239,0.15)]">
            <Activity size={14} className="animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  );
};