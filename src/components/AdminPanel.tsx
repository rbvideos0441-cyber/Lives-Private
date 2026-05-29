/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { UserProfile, LiveStream, CoinPackage, PlatformConfig, UserRole } from '../types';
import {
  ShieldAlert,
  Users,
  Radio,
  Tv,
  Coins,
  Settings,
  FileText,
  UserCheck,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  DollarSign,
  KeyRound,
  ArrowLeft,
  ChevronRight,
  Unlock
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const {
    currentUser,
    users,
    lives,
    photos,
    adminLogs,
    financials,
    withdrawals,
    coinPackages,
    config,
    approveHost,
    rejectHost,
    suspendHost,
    addCoinsToUser,
    removeCoinsFromUser,
    editUserRole,
    toggleUserBlock,
    deleteUser,
    forceEndLive,
    approvePhoto,
    rejectPhoto,
    updatePlatformConfig,
    updateCoinPackages,
    processWithdrawal
  } = usePlatform();

  // Selected Section Inside Dashboard
  const [activeTab, setActiveTab] = useState<'DASH' | 'USERS' | 'HOSTS' | 'PHOTOS' | 'WITHDRAWS' | 'ADMINS' | 'SETTINGS' | 'LOGS'>('DASH');

  // Deletion confirmation custom modal state
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // Search filter trackers
  const [userQuery, setUserQuery] = useState('');
  const [photoFilter, setPhotoFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');

  // Coin adjustments
  const [coinsAmountMap, setCoinsAmountMap] = useState<{ [key: string]: number }>({});
  const handleCoinInput = (uId: string, val: string) => {
    setCoinsAmountMap(prev => ({ ...prev, [uId]: Math.max(1, Number(val)) }));
  };

  // Finance metrics computations
  const totalUsers = users.length;
  const totalHosts = users.filter(u => u.role === 'HOST' || u.isHostApproved).length;
  const activeStreams = lives.filter(l => l.isLive).length;
  const candidateHosts = users.filter(u => u.isHostRequestPending);

  const completedWithdrawSum = withdrawals
    .filter(w => w.status === 'PAID')
    .reduce((acc, w) => acc + w.amountBRL, 0);

  const totalPlatformComissionCoins = financials
    .reduce((acc, f) => acc + f.platformCutCoins, 0);

  const calculatedPlatformValueBRL = totalPlatformComissionCoins * config.coinToBrlRate;

  // Render Role Tags
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-red-950/40 text-red-400 border border-red-500/20 text-4xs font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase">Super Admin</span>;
      case 'ADMIN':
        return <span className="bg-orange-950/40 text-orange-400 border border-orange-500/20 text-4xs font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase">Admin</span>;
      case 'HOST':
        return <span className="bg-pink-950/40 text-pink-400 border border-pink-500/20 text-4xs font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase">Host</span>;
      default:
        return <span className="bg-gray-950 text-gray-400 border border-gray-800 text-4xs font-mono font-semibold px-2 py-0.5 rounded uppercase">Espectador</span>;
    }
  };

  // Config adjustments state management
  const [pName, setPName] = useState(config.platformName);
  const [pLogo, setPLogo] = useState(config.logoText);
  const [waLink, setWaLink] = useState(config.whatsappUrl);
  const [maxPhotos, setMaxPhotos] = useState(config.maxPrivatePhotos);
  const [hrsAccess, setHrsAccess] = useState(config.photoAccessHours);
  const [minPriceLive, setMinPriceLive] = useState(config.minPrivateLivePrice);
  const [commissionPct, setCommissionPct] = useState(config.platformFeePercent);
  const [pendingDaysState, setPendingDaysState] = useState(config.pendingDays);
  const [coinBrlRateState, setCoinBrlRateState] = useState(config.coinToBrlRate);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformConfig({
      platformName: pName,
      logoText: pLogo,
      whatsappUrl: waLink,
      maxPrivatePhotos: Number(maxPhotos),
      photoAccessHours: Number(hrsAccess),
      minPrivateLivePrice: Number(minPriceLive),
      platformFeePercent: Number(commissionPct),
      pendingDays: Number(pendingDaysState),
      coinToBrlRate: Number(coinBrlRateState)
    });
    alert('Configurações do sistema gravadas com sucesso!');
  };

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen pb-16 font-sans select-none selection:bg-pink-600 selection:text-white">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <div className="bg-gray-900 border-b border-gray-850 px-4 py-3 sticky top-0 z-35 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-pink-500 shrink-0" size={20} />
          <h2 className="font-display font-black text-md text-white tracking-tight">Painel Administrativo VIP</h2>
        </div>
        <button
          onClick={onClose}
          className="bg-gray-850 hover:bg-gray-800 border border-gray-800 text-gray-300 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
        >
          <ArrowLeft size={14} /> Voltar ao App
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* COL 1: SIDEBAR TABS SELECTION */}
        <div className="lg:col-span-1 bg-gray-900 rounded-2xl border border-gray-850 p-4 shrink-0 h-max space-y-1.5">
          {[
            { id: 'DASH', name: 'Dashboard Geral', icon: <TrendingUp size={16} /> },
            { id: 'USERS', name: 'Gerenciar Usuários', icon: <Users size={16} /> },
            { id: 'HOSTS', name: 'Aprovar Hosts', icon: <Radio size={16} /> },
            { id: 'PHOTOS', name: 'Moderar Fotos', icon: <Lock size={16} /> },
            { id: 'WITHDRAWS', name: 'Solicitações Saque', icon: <DollarSign size={16} /> },
            { id: 'ADMINS', name: 'Administradores', icon: <KeyRound size={16} /> },
            { id: 'SETTINGS', name: 'Configurar Sistema', icon: <Settings size={16} /> },
            { id: 'LOGS', name: 'Logs de Auditoria', icon: <FileText size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left font-display font-black text-xs p-3 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 border ${
                activeTab === tab.id
                  ? 'bg-pink-650/15 border-pink-500/30 text-pink-400'
                  : 'bg-transparent border-transparent hover:bg-gray-850/60 text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* COL 2: MAIN PANEL CONTENTS CONTAINER */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SEC 1: DASHBOARD METRICS RESUMES */}
          {activeTab === 'DASH' && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-850 rounded-2xl p-6">
                <h3 className="font-display font-extrabold text-white text-md border-b border-gray-850 pb-3 mb-4">Métricas Gerais da Plataforma</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total de Usuários', value: totalUsers, desc: 'Apoiadores e visitantes', icon: <Users size={16} className="text-blue-500" /> },
                    { label: 'Total de Hosts', value: totalHosts, desc: 'Criadores Oficiais', icon: <Radio size={16} className="text-pink-500" /> },
                    { label: 'Câmeras Ativas', value: activeStreams, desc: 'Em transmissão direta', icon: <Tv size={16} className="text-indigo-500" /> },
                    { label: 'Host Candidatos', value: candidateHosts.length, desc: 'Aguardando aprovação', icon: <ShieldAlert size={16} className="text-yellow-500" /> }
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-950 border border-gray-850 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-3xs text-gray-400 font-mono uppercase tracking-wider">{stat.label}</span>
                        {stat.icon}
                      </div>
                      <p className="text-lg font-display font-black text-white">{stat.value}</p>
                      <span className="text-5xs text-gray-500 font-mono leading-none mt-1.5 block">{stat.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings card split */}
              <div className="bg-gray-900 border border-gray-850 rounded-2xl p-6">
                <h3 className="font-display font-extrabold text-white text-md border-b border-gray-850 pb-3 mb-4">Relatórios de Divisão de Receitas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Lucro Total Plataforma', value: `🪙 ${totalPlatformComissionCoins}`, desc: `Equivale a R$ ${calculatedPlatformValueBRL.toFixed(2)} (${config.platformFeePercent}% comissão sobre fotos/lives)`, icon: <DollarSign size={18} className="text-emerald-500" /> },
                    { label: 'Pagas via PIX aos Hosts', value: `R$ ${completedWithdrawSum.toFixed(2)}`, desc: 'Total retirado líquido', icon: <CheckCircle size={18} className="text-emerald-500" /> },
                    { label: 'Saldo Máximo em Circulação', value: `🪙 ${users.reduce((acc, u) => acc + u.coinsBalance, 0)}`, desc: 'Soma das carteiras dos clientes', icon: <Coins size={18} className="text-amber-500" /> }
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-950 border border-gray-850 p-4 rounded-xl flex items-center gap-3">
                      <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 shrink-0 text-gray-250">
                        {stat.icon}
                      </div>
                      <div>
                        <span className="text-3xs text-gray-400 font-mono uppercase tracking-wider">{stat.label}</span>
                        <p className="text-sm sm:text-md font-mono font-black text-white mt-0.5">{stat.value}</p>
                        <span className="text-5xs text-gray-500 font-mono mt-1 block">{stat.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEC 2: MANAGE USERS & COINS */}
          {activeTab === 'USERS' && (
            <div className="bg-gray-900 border border-gray-855 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-gray-850 pb-3">
                <h3 className="font-display font-black text-white text-md">Painel de Contas & Usuários</h3>
                <input
                  type="text"
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  placeholder="Buscar usuário por @username..."
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 w-full max-w-xs placeholder-gray-550"
                />
              </div>

              {/* Users management table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-3xs font-mono text-gray-400 border-collapse">
                  <thead>
                    <tr className="border-b border-gray-850 text-gray-500 uppercase font-black">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Username</th>
                      <th className="pb-2">Role Nível</th>
                      <th className="pb-2">Saldo Moedas</th>
                      <th className="pb-2">Adicionar Moedas</th>
                      <th className="pb-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => u.username.toLowerCase().includes(userQuery.toLowerCase()))
                      .map(u => {
                        const adjustCoinsInput = coinsAmountMap[u.id] || 100;
                        return (
                          <tr key={u.id} className="border-b border-gray-850/40 hover:bg-gray-950/20">
                            <td className="py-3 text-gray-500 max-w-[60px] truncate">{u.id}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-1.5">
                                <img src={u.avatarUrl} alt="avatar" className="w-6 h-6 rounded-md object-cover" referrerPolicy="no-referrer" />
                                <span className="font-bold text-gray-200">@{u.username}</span>
                                {u.isBlocked && <span className="bg-red-500/20 text-red-400 text-5xs px-1 rounded">Mudo/Bloqueado</span>}
                              </div>
                            </td>
                            <td className="py-3">{renderRoleBadge(u.role)}</td>
                            <td className="py-3 font-bold text-amber-500">🪙 {u.coinsBalance}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={adjustCoinsInput}
                                  onChange={e => handleCoinInput(u.id, e.target.value)}
                                  className="w-12 bg-gray-950 border border-gray-800 rounded px-1 py-0.5 text-3xs font-bold text-white text-center"
                                />
                                <button
                                  onClick={() => addCoinsToUser(u.id, adjustCoinsInput)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded font-bold hover:scale-103 cursor-pointer shrink-0"
                                  title="Adicionar"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeCoinsFromUser(u.id, adjustCoinsInput)}
                                  className="bg-red-650 hover:bg-red-700 text-white p-1 rounded font-bold hover:scale-103 cursor-pointer shrink-0"
                                  title="Remover"
                                >
                                  -
                                </button>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => toggleUserBlock(u.id)}
                                  className={`px-2 py-1 rounded text-3xs font-semibold cursor-pointer shrink-0 ${
                                    u.isBlocked ? 'bg-emerald-950/40 text-emerald-450' : 'bg-red-950/40 text-red-400'
                                  }`}
                                >
                                  {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                                </button>
                                {currentUser.id !== u.id && u.role !== 'SUPER_ADMIN' && (
                                  <button
                                    onClick={() => {
                                      setDeletingUser(u); if (false) {
                                        deleteUser(u.id);
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-850 rounded text-red-500 hover:text-red-450 cursor-pointer"
                                    title="Excluir"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEC 3: APPROVE HOST RESPONSIVENESS */}
          {activeTab === 'HOSTS' && (
            <div className="bg-gray-900 border border-gray-850 rounded-2xl p-6">
              <h3 className="font-display font-extrabold text-white text-md border-b border-gray-850 pb-3 mb-4">Solicitações Pendentes de Hosts ({candidateHosts.length})</h3>
              
              {candidateHosts.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck size={35} className="mx-auto text-gray-700 mb-2" />
                  <p className="text-xs text-gray-500 font-mono leading-relaxed">Nenhuma solicitação de Host aguardando aprovação civil no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidateHosts.map(candidate => (
                    <div key={candidate.id} className="p-4 bg-gray-950/60 border border-gray-850 rounded-xl flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <img src={candidate.avatarUrl} alt="avatar" className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="font-display font-black text-sm text-gray-200">@{candidate.username}</h4>
                          <p className="text-xs text-gray-400 mt-1 max-w-md leading-relaxed">{candidate.bio}</p>
                          <p className="text-4xs text-gray-500 font-mono mt-1 block">Email: {candidate.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveHost(candidate.id)}
                          className="bg-emerald-600 hover:bg-emerald-750 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow shadow-emerald-550/10"
                        >
                          <CheckCircle size={14} /> Aprovar Host
                        </button>
                        <button
                          onClick={() => rejectHost(candidate.id)}
                          className="bg-red-650 hover:bg-red-750 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle size={14} /> Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEC 4: MODERATE PRIVATE PHOTOS */}
          {activeTab === 'PHOTOS' && (
            <div className="bg-gray-900 border border-gray-850 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-gray-855 pb-3">
                <h3 className="font-display font-extrabold text-white text-md">Painel de Moderação de Fotos Privadas</h3>
                <div className="flex gap-2 text-xs font-mono">
                  {['PENDING', 'APPROVED', 'ALL'].map(filt => (
                    <button
                      key={filt}
                      onClick={() => setPhotoFilter(filt as any)}
                      className={`px-3 py-1.5 rounded-lg border text-4xs font-bold cursor-pointer ${
                        photoFilter === filt
                          ? 'bg-pink-650/20 border-pink-500 text-pink-400'
                          : 'bg-transparent border-gray-800 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {filt === 'PENDING' ? 'Pendentes' : filt === 'APPROVED' ? 'Aprovadas' : 'Ver Todas'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos lists for approval */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {photos
                  .filter(p => {
                    if (photoFilter === 'PENDING') return !p.isApproved;
                    if (photoFilter === 'APPROVED') return p.isApproved;
                    return true;
                  })
                  .map(photo => (
                    <div key={photo.id} className="p-3 bg-gray-950/60 border border-gray-850 rounded-xl relative flex flex-col justify-between">
                      <div>
                        {/* Miniature layout */}
                        <div className="h-40 bg-gray-900 rounded-lg overflow-hidden relative mb-3">
                          <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <span className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur text-amber-500 font-mono font-bold text-5xs px-2 py-0.5 rounded border border-gray-800">
                            Preço: 🪙 {photo.coinPrice}
                          </span>
                        </div>
                        <h4 className="font-display font-extrabold text-xs text-gray-250 leading-relaxed">{photo.title}</h4>
                        <p className="text-3xs text-gray-550 leading-relaxed font-sans">{photo.description}</p>
                        <p className="text-4xs text-pink-400 font-mono mt-1">Produtor: @{photo.hostName}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-850 flex gap-2">
                        {!photo.isApproved ? (
                          <button
                            onClick={() => approvePhoto(photo.id)}
                            className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-3xs px-4 py-1.5 rounded-lg cursor-pointer flex-1 flex items-center justify-center gap-1"
                          >
                            <CheckCircle size={12} /> Aprovar Conteúdo
                          </button>
                        ) : (
                          <span className="bg-emerald-950/30 text-emerald-450 text-4xs font-mono font-black px-3 py-1.5 rounded flex items-center gap-1 border border-emerald-800/10">
                            <CheckCircle size={10} /> Aprovado Ativo
                          </span>
                        )}
                        <button
                          onClick={() => rejectPhoto(photo.id)}
                          className="bg-red-950/70 border border-red-700 text-red-400 hover:bg-red-900 text-3xs px-4.5 py-1.5 rounded-lg cursor-pointer shrink-0 flex items-center justify-center"
                          title="Remover Conteúdo"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SEC 5: APPROVE SOLICITAÇÕES SAQUE PIX */}
          {activeTab === 'WITHDRAWS' && (
            <div className="bg-gray-900 border border-gray-850 rounded-2xl p-6">
              <h3 className="font-display font-extrabold text-white text-md border-b border-gray-850 pb-3 mb-4">Aprovação de Resgastes Financeiros PIX</h3>
              
              <div className="space-y-4">
                {withdrawals.length === 0 ? (
                  <p className="text-xs text-center py-10 text-gray-500 font-mono">Nenhum saque solicitado no histórico</p>
                ) : (
                  withdrawals.map(w => (
                    <div key={w.id} className="p-4 bg-gray-950/60 border border-gray-850 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 text-sm">
                          <strong className="text-amber-500">🪙 {w.amountCoins} moedas</strong>
                          <span className="text-gray-300 font-display font-black text-xs">➔ R$ {w.amountBRL.toFixed(2)}</span>
                        </div>
                        <p className="text-gray-302 font-bold font-sans">Solicitado por Host: <span className="text-pink-400 font-display font-extrabold">@{w.hostName}</span></p>
                        <p className="text-3xs text-gray-400 leading-normal font-sans mt-0.5">Nome PIX: <strong>{w.fullName}</strong></p>
                        <p className="text-3xs text-gray-400 leading-normal font-mono mt-0.5">Chave PIX: <strong className="text-emerald-400 font-mono">{w.pixKey} ({w.pixType})</strong></p>
                        <p className="text-4xs text-gray-500 mt-1">{new Date(w.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="flex gap-2">
                        {w.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => processWithdrawal(w.id, 'APPROVED')}
                              className="bg-blue-600 hover:bg-blue-750 text-white font-bold text-3xs px-3 py-2 rounded-xl cursor-pointer"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => processWithdrawal(w.id, 'REJECTED')}
                              className="bg-red-650 hover:bg-red-750 text-white font-bold text-3xs px-3 py-2 rounded-xl cursor-pointer"
                            >
                              Recusar
                            </button>
                          </>
                        )}
                        {w.status === 'APPROVED' && (
                          <button
                            onClick={() => processWithdrawal(w.id, 'PAID')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-3xs px-4 py-2 rounded-xl cursor-pointer"
                          >
                            Marcar como Pago (Concluir PIX)
                          </button>
                        )}
                        {w.status === 'PAID' && (
                          <span className="bg-emerald-950/30 text-emerald-450 font-bold border border-emerald-500/10 rounded-xl px-4 py-2 text-3xs uppercase tracking-wider block">
                            Concluído & Pago
                          </span>
                        )}
                        {w.status === 'REJECTED' && (
                          <span className="bg-red-956/20 text-red-400 border border-red-500/10 rounded-xl px-4 py-2 text-3xs uppercase tracking-wider block">
                            Recusado
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SEC 6: ADMINS STAFF TIER MANAGER */}
          {activeTab === 'ADMINS' && (
            <div className="bg-gray-900 border border-gray-850 rounded-2xl p-6">
              <h3 className="font-display font-extrabold text-white text-md border-b border-gray-850 pb-3 mb-4">Gerenciamento de Administradores & Staff</h3>

              {currentUser.role !== 'SUPER_ADMIN' ? (
                <div className="bg-yellow-950/40 p-4 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="shrink-0" size={16} />
                  <span>Acesso Restrito: Apenas <strong>Super Administradores</strong> possuem permissões para gerenciar e reconfigurar as permissões de outros administradores e moderadores do staff.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* PROMOTION TOOLCARD */}
                  <div className="p-4 bg-gray-950/40 border border-gray-850 rounded-xl mb-4 space-y-3">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-pink-500">Promover Novo Administrador / Staff</h4>
                    <p className="text-3xs text-gray-400 font-mono">SELECIONE UM USUÁRIO DO SISTEMA PARA PROMOVER AO STAFF DE ADMINISTRADORES DA TRANSMISSÃO:</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        id="user-promote-select"
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-pink-500 text-gray-200 outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>Selecionar usuário para promover...</option>
                        {users.filter(u => u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN').map(u => (
                          <option key={u.id} value={u.id}>@{u.username} ({u.email || 'Não informado'})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const selectEl = document.getElementById('user-promote-select') as HTMLSelectElement;
                          const userIdToPromote = selectEl?.value;
                          if (!userIdToPromote) {
                            alert('Por favor, selecione um usuário para promover.');
                            return;
                          }
                          const target = users.find(u => u.id === userIdToPromote);
                          if (target) {
                            editUserRole(userIdToPromote, 'ADMIN');
                            alert(`@${target.username} foi promovido a Administrador com sucesso!`);
                            selectEl.value = '';
                          }
                        }}
                        className="bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer shrink-0 font-sans"
                      >
                        Promover a Admin
                      </button>
                    </div>
                  </div>

                  {users
                    .filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
                    .map(adm => (
                      <div key={adm.id} className="p-4 bg-gray-950/60 border border-gray-850 rounded-xl space-y-3.5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            <img src={adm.avatarUrl} alt="avatar" className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                            <div>
                              <h4 className="font-display font-black text-sm text-gray-200">@{adm.username}</h4>
                              <p className="text-4xs text-gray-500 font-mono italic">{adm.email}</p>
                            </div>
                          </div>
                          <div>
                            <select
                              value={adm.role}
                              onChange={e => editUserRole(adm.id, e.target.value as any, adm.permissions)}
                              className="bg-gray-900 border border-gray-800 text-3xs text-yellow-500 px-3 py-1.5 rounded-lg font-mono font-bold"
                            >
                              <option value="USER">Remover Staff (User)</option>
                              <option value="ADMIN">Administrador Padrão</option>
                              <option value="SUPER_ADMIN">Super Administrador</option>
                            </select>
                          </div>
                        </div>

                        {/* Interactive toggle checkboxes permissions list */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-850">
                          {[
                            { flag: 'manageUsers', label: 'Gerenciar Usuários' },
                            { flag: 'manageHosts', label: 'Gerenciar Hosts' },
                            { flag: 'manageLives', label: 'Gerenciar Lives' },
                            { flag: 'manageCoins', label: 'Moderar Moedas' },
                            { flag: 'manageSettings', label: 'Configurações' },
                            { flag: 'manageAdmins', label: 'Editar Colegas Staff' }
                          ].map(perm => (
                            <label key={perm.flag} className="flex items-center gap-2 text-3xs text-gray-400 font-mono uppercase tracking-widest leading-none cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(adm.permissions as any)[perm.flag] || false}
                                onChange={e => {
                                  const updatedPerms = { ...adm.permissions, [perm.flag]: e.target.checked };
                                  editUserRole(adm.id, adm.role, updatedPerms);
                                }}
                                className="w-3.5 h-3.5 accent-pink-600 rounded cursor-pointer"
                              />
                              <span>{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* SEC 7: DYNAMIC SYSTEM CONFIGURATIONS */}
          {activeTab === 'SETTINGS' && (
            <div className="bg-gray-900 border border-gray-855 rounded-2xl p-6">
              <h3 className="font-display font-extrabold text-white text-md border-b border-gray-850 pb-3 mb-4">Ajustes Globais e Precificação</h3>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Nome da Plataforma</label>
                    <input
                      type="text"
                      value={pName}
                      onChange={e => setPName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Texto do Logotipo</label>
                    <input
                      type="text"
                      value={pLogo}
                      onChange={e => setPLogo(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">WhatsApp Comercial Redirect Link</label>
                  <input
                    type="text"
                    value={waLink}
                    onChange={e => setWaLink(e.target.value)}
                    placeholder="e.g. https://chat.whatsapp.com/... ou https://wa.me/55..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500 font-mono text-xs"
                  />
                  <p className="text-3xs text-gray-500 mt-1.5 leading-relaxed">
                    💡 <strong>Formatos Suportados:</strong><br />
                    • <strong>Grupo de WhatsApp:</strong> <code>https://chat.whatsapp.com/ExemploGrupoID</code> (O link não será corrompido, redireciona direto ao grupo)<br />
                    • <strong>Conversa Direta:</strong> <code>https://wa.me/5511999999999</code> (Inclui automaticamente a mensagem padrão de intenção de compra)<br />
                    • <strong>Apenas Número:</strong> <code>5511999999999</code> (Será convertido automaticamente em link de conversa direta)
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Limite Álbuns</label>
                    <input
                      type="number"
                      value={maxPhotos}
                      onChange={e => setMaxPhotos(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Validade Passe (h)</label>
                    <input
                      type="number"
                      value={hrsAccess}
                      onChange={e => setHrsAccess(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Mínimo Live Entry</label>
                    <input
                      type="number"
                      value={minPriceLive}
                      onChange={e => setMinPriceLive(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Comissão Plataforma %</label>
                    <input
                      type="number"
                      value={commissionPct}
                      onChange={e => setCommissionPct(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Trava Financeira (Dias de carência)</label>
                    <input
                      type="number"
                      value={pendingDaysState}
                      onChange={e => setPendingDaysState(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div className="text-3xs text-gray-500 font-mono mt-4 leading-relaxed">
                    *Tempo para que o saldo das fotos vendidas passe do <strong>Saldo Pendente</strong> para o <strong>Saldo Disponível</strong> do host.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-850/40">
                  <div>
                    <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Conversão Saque (R$ por Moeda)</label>
                    <input
                      type="number"
                      step="0.005"
                      min="0.005"
                      max="1.000"
                      value={coinBrlRateState}
                      onChange={e => setCoinBrlRateState(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div className="text-3xs text-gray-500 font-mono mt-1 leading-relaxed">
                    ⚠️ <strong>Importante:</strong> Recomenda-se utilizar <code>0.05</code> ou <code>0.06</code> de taxa de resgate líquido. Se usar <code>0.10</code>, 500 moedas equivalem a R$ 50.00, o que fica mais caro do que a venda na loja (onde R$ 50.00 compra 600 moedas!). Conversões de R$ 0.05 garantem a integridade financeira e lucratividade de sua plataforma.
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 flex justify-end">
                  <button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg cursor-pointer flex items-center gap-1 shadow"
                  >
                    Gravar Ajustes Sistema
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* SEC 8: AUDIT ACTIONS LOGS */}
          {activeTab === 'LOGS' && (
            <div className="bg-gray-900 border border-gray-850 rounded-2xl p-6">
              <h3 className="font-display font-extrabold text-white text-md border-b border-gray-850 pb-3 mb-4">Histórico Geral de Logs Administrativos</h3>
              
              <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-2">
                {adminLogs.map(l => (
                  <div key={l.id} className="p-3 bg-gray-950/60 rounded-xl border border-gray-850 text-xs font-mono leading-relaxed">
                    <div className="flex justify-between items-start flex-wrap gap-2 text-3xs mb-1">
                      <span className="text-pink-400 font-display font-black">Operador: @{l.adminName}</span>
                      <span className="text-gray-500">{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-200">{l.action}</p>
                    <p className="text-4xs text-gray-600 mt-1">ID Transação: #{l.id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {deletingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] select-none animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-950/50 text-red-500 mb-4 border border-red-900/30">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-display font-black text-white text-md mb-2">Excluir Conta Permanentemente?</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Você tem certeza de que deseja excluir permanentemente a conta de <strong className="text-white">@{deletingUser.username}</strong> ({deletingUser.email})? Esta ação é irreversível e removerá todo o histórico de transações e mídias.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  deleteUser(deletingUser.id);
                  setDeletingUser(null);
                }}
                className="flex-1 bg-red-650 hover:bg-red-700 active:scale-98 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all shadow-lg"
              >
                Sim, Excluir Conta
              </button>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 bg-gray-850 hover:bg-gray-800 text-gray-300 hover:text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer border border-gray-800 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
