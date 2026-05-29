/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import {
  Flame,
  Tv,
  Coins,
  Bell,
  Sliders,
  Sparkles,
  Users,
  Eye,
  Heart,
  Lock,
  Compass,
  MessageCircle,
  TrendingUp,
  X,
  MapPin,
  CheckCircle2,
  Settings,
  ChevronRight
} from 'lucide-react';
import { LiveStream, UserProfile } from '../types';

interface MainFeedProps {
  onSelectLive: (live: LiveStream) => void;
  onSelectHost: (hostId: string) => void;
  onNavigate: (view: 'HOME' | 'PROFILE' | 'ADMIN_PANEL') => void;
}

export const MainFeed: React.FC<MainFeedProps> = ({ onSelectLive, onSelectHost, onNavigate }) => {
  const {
    currentUser,
    users,
    lives,
    coinPackages,
    purchaseCoinsSimulated,
    config,
    notifications,
    logout
  } = usePlatform();

  if (!currentUser) return null;

  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Filter approved Hosts
  const approvedHosts = users.filter(u => u.role === 'HOST' || u.isHostApproved);
  const activeLives = lives.filter(l => l.isLive);
  const unreadNotifCount = notifications.filter(n => n.userId === currentUser.id && !n.isRead).length;

  const handleOpenPurchaseRedirect = (pack: any) => {
    setSelectedPackage(pack);
  };

  const getWhatsAppUrl = (pack: any) => {
    if (!pack) return '#';
    let baseUrl = (config.whatsappUrl || '').trim();
    if (!baseUrl) {
      baseUrl = 'https://wa.me/5511999999999';
    }
    
    // Auto-detect raw phone numbers without protocol and add https://wa.me prefix
    const digitsOnly = baseUrl.replace(/[+\-\s()]/g, '');
    if (/^\d{8,15}$/.test(digitsOnly)) {
      baseUrl = `https://wa.me/${digitsOnly}`;
    }

    const message = `Olá! Decidi comprar o pacote "${pack.name}" (${pack.coinsCount} Moedas) por R$ ${pack.priceBRL.toFixed(2)} no app ${config.platformName}. Qual a chave PIX para pagamento?`;
    
    // If it's a WhatsApp group link, do not append text parameter to prevent link corruption
    if (baseUrl.includes('chat.whatsapp.com') || baseUrl.includes('invite')) {
      return baseUrl;
    }
    
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
  };

  const confirmCoinsPurchaseAndRedirect = () => {
    if (!selectedPackage) return;
    
    // Simulate credit instantly
    purchaseCoinsSimulated(selectedPackage.id);
    
    const finalWaUrl = getWhatsAppUrl(selectedPackage);
    
    // Try window.open fallback in case user browser does not block it
    try {
      window.open(finalWaUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn("Popup blocked, fallback to direct anchor click in next step.", e);
    }
    
    setIsCoinModalOpen(false);
    setSelectedPackage(null);
  };

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen pb-20 selection:bg-pink-600 selection:text-white">
      {/* 1. APP NAVBAR */}
      <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur border-b border-gray-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('HOME')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center font-display font-extrabold text-white text-lg tracking-wider shadow-lg shadow-pink-500/15">
              V
            </div>
            <span className="font-display font-black text-xl tracking-wider text-white">
              {config.platformName}
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* Coin Wallet Button */}
            <button
              onClick={() => setIsCoinModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-gray-950 px-3.5 py-1.5 rounded-full font-mono font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10 hover:scale-105 active:scale-95 text-center shrink-0"
            >
              <Coins size={16} className="text-gray-950 shrink-0" />
              <span>🪙 {currentUser.coinsBalance}</span>
              <span className="bg-white/30 text-gray-950 px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase shrink-0">Comprar</span>
            </button>

            {/* Notifications panel toggle */}
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700/60 relative cursor-pointer text-gray-300 hover:text-white"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 rounded-full text-2xs text-white font-bold flex items-center justify-center">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay Menu */}
              {isNotifDropdownOpen && (
                <div id="notif-dropdown" className="absolute right-0 mt-3 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-3">
                    <span className="text-sm font-bold text-gray-200">Minhas Notificações</span>
                    <button className="text-xs text-gray-400 hover:text-pink-400">Marcar como lidas</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                    {notifications.filter(n => n.userId === currentUser.id).length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-6 font-mono">Nenhum aviso recebido</p>
                    ) : (
                      notifications.filter(n => n.userId === currentUser.id).map(n => (
                        <div key={n.id} className="p-2 bg-gray-950/50 rounded-lg border border-gray-850 text-3xs">
                          <div className="flex justify-between font-bold mb-1">
                            <span className="text-pink-400">{n.title}</span>
                            <span className="text-gray-500">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-gray-400 text-xs leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar / Settings Dropdown Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 bg-gray-850 hover:bg-gray-800 border border-gray-750 rounded-lg cursor-pointer transition-all hover:scale-[1.02] text-left text-gray-200"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-7 h-7 rounded-md object-cover border border-gray-600 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="hidden md:inline text-xs font-semibold px-1 max-w-[90px] truncate">
                  @{currentUser.username}
                </span>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-4.5 z-55 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="pb-2.5 border-b border-gray-800 mb-2">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Conta Ativa</p>
                    <p className="font-bold text-gray-100 text-sm">@{currentUser.username}</p>
                    <p className="text-[10px] text-pink-400 font-mono mt-0.5 uppercase tracking-wide">
                      {currentUser.role === 'SUPER_ADMIN' ? 'Super Admin 👑' : currentUser.role === 'ADMIN' ? 'Administrador 🛠️' : currentUser.role === 'HOST' ? 'Host Oficial 💄' : 'Espectador VIP 👥'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onNavigate('PROFILE');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-sm">👤</span>
                      <span>Meu perfil</span>
                    </button>

                    {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                      <button
                        onClick={() => {
                          onNavigate('ADMIN_PANEL');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left p-2 bg-pink-950/20 hover:bg-pink-900/30 rounded-lg text-pink-400 hover:text-pink-300 font-bold transition-all flex items-center gap-2 border border-pink-500/10 cursor-pointer"
                      >
                        <Settings size={14} className="text-pink-400" />
                        <span>Painel Admin</span>
                      </button>
                    )}

                    <div className="pt-2 border-t border-gray-800 mt-2">
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left p-2 hover:bg-red-950/25 hover:text-red-400 text-gray-400 font-bold transition-all flex items-center gap-2 rounded-lg cursor-pointer"
                      >
                        <span className="text-sm">🚪</span>
                        <span>Sair da conta</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Administrador Dashboard access link */}
            {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
              <button
                onClick={() => onNavigate('ADMIN_PANEL')}
                className="p-2 bg-pink-950/40 text-pink-400 hover:bg-pink-900/50 rounded-lg border border-pink-500/30 cursor-pointer text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Settings size={16} />
                <span className="hidden lg:inline">Painel Admin</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* 2. DYNAMIC HERO BRAND BANNER */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/70 to-transparent z-10"></div>
          <img
            src={config.mainBannerUrl}
            alt="Main Advertising Banner"
            className="w-full h-44 sm:h-64 md:h-72 object-cover object-center scale-102 hover:scale-100 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 z-25 p-6 sm:p-10 flex flex-col justify-center max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-pink-600/20 text-pink-400 border border-pink-500/30 px-3 py-1 rounded-full text-xs font-bold w-max mb-3 animate-live-pulse uppercase tracking-wider">
              <Sparkles size={12} /> Prontos para Transmissão
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-white leading-tight">
              A Plataforma Oficial dos Melhores <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-400">Hosts VIP</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-2 line-clamp-2 max-w-sm font-sans">
              Assista transmissões exclusivas em ultra-definição diretamente do navegador, desbloqueie mídias privadas e interaja ao vivo!
            </p>
            <div className="mt-4 sm:mt-6 flex items-center gap-3">
              <button
                onClick={() => setIsCoinModalOpen(true)}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-lg font-display transition-all cursor-pointer shadow-lg shadow-pink-600/20"
              >
                Adquirir Moedas
              </button>
              <button
                onClick={() => {
                  const firstLive = activeLives[0];
                  if (firstLive) onSelectLive(firstLive);
                }}
                className="bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-lg font-display transition-all cursor-pointer"
              >
                Assistir Ao Vivo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. APP STATS ROW */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hosts Credenciados', value: approvedHosts.length, icon: <Users size={18} className="text-pink-500" /> },
          { label: 'Transmissões Ativas', value: activeLives.length, icon: <Tv size={18} className="text-indigo-500" /> },
          { label: 'Espectadores Conectados', value: activeLives.reduce((acc, l) => acc + l.viewersCount, 0) + 120, icon: <Flame size={18} className="text-orange-500" /> },
          { label: 'Taxas Confortáveis', value: `${100 - config.platformFeePercent}% / ${config.platformFeePercent}%`, icon: <TrendingUp size={18} className="text-emerald-500" /> }
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800 shrink-0">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xs text-gray-400 font-mono uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-display font-extrabold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. ACTIVE LIVE STREAMS SECTION */}
      <section className="max-w-7xl mx-auto px-4 mt-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Tv className="text-pink-500 shrink-0" size={22} />
            <h2 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
              Transmissões Ao Vivo Ativas
            </h2>
          </div>
          <span className="font-mono text-xs text-pink-400 bg-pink-950/30 px-3 py-1 rounded-full border border-pink-500/20 animate-pulse flex items-center gap-1">
            🟢 ONLINE {activeLives.length} LIVES
          </span>
        </div>

        {activeLives.length === 0 ? (
          <div className="bg-gray-900 border border-gray-850 p-10 rounded-2xl text-center">
            <Tv size={45} className="mx-auto text-gray-700 mb-3" />
            <h3 className="text-lg font-bold text-gray-300">Nenhum Host transmitindo no momento</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Seja o primeiro! Mude o simulador no topo para o perfil do Host <strong>@juliana_bella</strong>, clique no perfil dela e inicie sua transmissão ao vivo direta!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeLives.map(live => (
              <div
                key={live.id}
                onClick={() => onSelectLive(live)}
                className="group bg-gray-900 border border-gray-850 hover:border-gray-750 rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative"
              >
                {/* Thumbnail aspect simulation with avatar background and badges */}
                <div className="relative h-44 bg-gray-950 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10"></div>
                  {/* Backdrop */}
                  <img
                    src={live.hostAvatar}
                    alt="Backdrop blur"
                    className="absolute inset-0 w-full h-full object-cover blur-md opacity-25"
                    referrerPolicy="no-referrer"
                  />
                  {/* Central Avatar */}
                  <div className="relative z-20 text-center p-4">
                    <div className="w-20 h-20 rounded-full border-2 border-pink-600 mx-auto overflow-hidden shadow-lg shadow-pink-500/20">
                      <img src={live.hostAvatar} alt={live.hostName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>

                  {/* Top indicators */}
                  <div className="absolute top-3 inset-x-3 flex justify-between items-center z-30">
                    <span className="bg-red-650 text-white font-mono font-bold text-3xs px-2.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-widest animate-live-pulse">
                      🔴 Ao Vivo
                    </span>
                    <span className="bg-gray-950/80 backdrop-blur font-mono text-white text-3xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Eye size={12} className="text-indigo-400" /> {live.viewersCount} espectadore{live.viewersCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Private Paywall Badge */}
                  {live.isPrivate && (
                    <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 bg-yellow-500 text-gray-950 font-mono font-black text-2xs px-2.5 py-1 rounded shadow">
                      <Lock size={12} /> PRIVADA • ENTRY 🪙{live.entryPrice}
                    </div>
                  )}

                  {!live.isPrivate && (
                    <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 bg-emerald-500 text-white font-mono font-bold text-2xs px-2.5 py-1 rounded shadow">
                      PÚBLICA • LIVRE
                    </div>
                  )}
                </div>

                {/* Info block */}
                <div className="p-4 flex gap-3">
                  <img
                    src={live.hostAvatar}
                    alt={live.hostName}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <h3 className="font-display font-extrabold text-sm text-gray-100 group-hover:text-pink-400 transition-colors truncate">
                      {live.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Transmitido por <span className="font-bold text-gray-300 font-display">@{live.hostName}</span>
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-sans">
                      {live.description}
                    </p>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="border-t border-gray-850 p-3 bg-gray-950/40 flex justify-between text-2xs font-mono text-gray-500">
                  <span className="flex items-center gap-1"><Heart size={12} className="text-pink-600" /> {live.likesCount} curtidas</span>
                  <span className="hover:text-pink-400 transition-colors flex items-center gap-1">Assistir Agora <ChevronRight size={12} /></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. GORGEOUS HOSTS LISTING */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Compass className="text-pink-500 shrink-0" size={22} />
            <h2 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
              Recomendados • Hosts Oficiais
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {approvedHosts.map(host => {
            const hasActiveLive = lives.some(l => l.hostId === host.id && l.isLive);
            return (
              <div
                key={host.id}
                onClick={() => onSelectHost(host.id)}
                className="group bg-gray-900 border border-gray-850 hover:border-pink-500/30 rounded-2xl overflow-hidden cursor-pointer text-center relative transition-all duration-300 p-4"
              >
                {/* Hover outline */}
                <div className="absolute inset-0 border border-pink-500/0 hover:border-pink-500/20 rounded-2xl transition-all"></div>
                
                {/* Banner miniature */}
                <div className="absolute top-0 inset-x-0 h-16 bg-gray-950 overflow-hidden">
                  <img src={host.bannerUrl} alt="banner" className="w-full h-full object-cover blur-sm opacity-30" referrerPolicy="no-referrer" />
                </div>

                {/* Verified state indicator */}
                {hasActiveLive && (
                  <span className="absolute top-3 right-3 z-30 bg-red-650 text-white font-bold font-mono text-3xs px-2 py-0.5 rounded animate-bounce">
                    AO VIVO
                  </span>
                )}

                {/* Avatar */}
                <div className="relative z-20 mt-6 mx-auto w-20 h-20 rounded-full border-3 border-gray-900 overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
                  <img src={host.avatarUrl} alt={host.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>

                <div className="relative z-20 mt-3 min-w-0">
                  <h3 className="font-display font-black text-sm text-gray-200 flex items-center justify-center gap-1 truncate">
                    @{host.username}
                    <CheckCircle2 size={13} className="text-pink-500 shrink-0 fill-pink-500/10" />
                  </h3>
                  <p className="text-2xs text-pink-400 font-mono mt-0.5">
                    {host.followersCount >= 1000
                      ? `${(host.followersCount / 1000).toFixed(1)}k`
                      : host.followersCount}{' '}
                    seguidores
                  </p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 px-1 font-sans min-h-[32px]">
                    {host.bio}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-850 flex items-center justify-between text-3xs text-gray-400 font-mono">
                  <span>🎥 {host.livesCount} lives</span>
                  <span className="text-pink-400 font-semibold group-hover:underline">Ver perfil</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. PLATAFORM TERMOS & REGIONAL FOOTER */}
      <footer className="mt-20 border-t border-gray-900 bg-gray-950 py-10 px-4 text-center text-xs text-gray-500 max-w-7xl mx-auto">
        <p className="font-mono tracking-wider">
          PLATAFORMA INTEGRADA {config.platformName.toUpperCase()} • SEGURANÇA MÁXIMA PIX
        </p>
        <p className="max-w-md mx-auto mt-2 leading-relaxed">
          As fotos e transmissões são de inteira responsabilidade civil dos Hosts produtores. Transações em moedas digitais são processadas via assessoria direta WhatsApp.
        </p>
        <div className="flex justify-center gap-6 mt-4">
          <span className="cursor-pointer hover:text-gray-300">Termos de Serviço</span>
          <span className="cursor-pointer hover:text-gray-300 font-mono text-emerald-500">Contato Administrativo (WA Link)</span>
          <span className="cursor-pointer hover:text-gray-300">Políticas de Fotos Privadas (24h)</span>
        </div>
      </footer>

      {/* 7. COIN STORE MODAL (COMPRA DE MOEDAS) */}
      {isCoinModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            
            {/* Header info */}
            <div className="p-5 border-b border-gray-800 bg-gray-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={22} className="text-amber-500 shrink-0" />
                <h2 className="font-display font-extrabold text-lg text-white">Comprar Pacotes de Moedas</h2>
              </div>
              <button
                onClick={() => {
                  setIsCoinModalOpen(false);
                  setSelectedPackage(null);
                }}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 hover:text-white rounded-lg text-gray-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pack contents */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-3">Selecione o pacote desejado para comprar via PIX:</p>
                <div className="space-y-3">
                  {coinPackages.map(pack => (
                    <a
                      key={pack.id}
                      href={getWhatsAppUrl(pack)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        // Simulate deposit and close modal immediately
                        purchaseCoinsSimulated(pack.id);
                        setIsCoinModalOpen(false);
                      }}
                      className="p-4 rounded-xl border border-gray-800 bg-gray-950/50 hover:bg-emerald-950/20 hover:border-emerald-500/50 text-gray-300 hover:text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 cursor-pointer group/pack no-underline block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 group-hover/pack:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors">
                          <Coins size={22} className="shrink-0" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase font-display tracking-tight text-white group-hover/pack:text-pink-400 transition-colors">
                            {pack.name}
                          </p>
                          <p className="text-2xs text-gray-400 font-mono mt-0.5">
                            Adiciona <strong>🪙 {pack.coinsCount} moedas</strong> instantaneamente
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-gray-850 pt-2 sm:pt-0">
                        <span className="text-[10px] text-emerald-400/90 font-mono font-bold uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                          🟢 PIX via WhatsApp
                        </span>
                        <span className="font-mono text-xs font-black text-amber-500 bg-amber-955/20 group-hover/pack:bg-amber-500 group-hover/pack:text-gray-950 px-3 py-1.5 rounded-lg border border-amber-500/20 group-hover/pack:border-transparent transition-all shrink-0">
                          R$ {pack.priceBRL.toFixed(2)}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-gray-950/60 rounded-xl border border-gray-800 text-3xs text-gray-500 leading-normal">
                <span>💡 <strong>Dica de Uso:</strong> Basta clicar diretamente em qualquer pacote acima. O sistema abrirá o suporte de vendas no WhatsApp para processar e de forma simulada irá recarregar as moedas em sua carteira do app imediatamente!</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
