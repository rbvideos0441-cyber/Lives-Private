/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { UserProfile, LiveStream } from '../types';
import { PrivatePhotosSection } from './PrivatePhotosSection';
import {
  Camera,
  Coins,
  Tv,
  CheckCircle,
  FileText,
  DollarSign,
  Send,
  UserCheck,
  UserPlus,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Settings,
  Share2,
  Clock,
  Check,
  AlertTriangle,
  Lock,
  Plus,
  Upload
} from 'lucide-react';

interface ProfileViewProps {
  userId: string;
  onNavigateHome: () => void;
  onSelectLive: (live: LiveStream) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId, onNavigateHome, onSelectLive }) => {
  const {
    currentUser,
    users,
    lives,
    withdrawals,
    financials,
    updateProfile,
    requestHostRole,
    requestWithdrawal,
    startLiveStream,
    followToggle,
    config
  } = usePlatform();

  // Find targeted user profile
  const targetUser = users.find(u => u.id === userId) || currentUser;
  const isOwnProfile = targetUser.id === currentUser.id;
  const isTargetHost = targetUser.role === 'HOST' || targetUser.isHostApproved;
  const isSpectatorFollowing = currentUser.followingIds.includes(targetUser.id);

  // Editable Profile Form states
  const [isEditMode, setIsEditMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');
  const [bannerInput, setBannerInput] = useState('');
  const [isAvatarDragActive, setIsAvatarDragActive] = useState(false);
  const [isBannerDragActive, setIsBannerDragActive] = useState(false);

  const openEditMode = () => {
    setUsernameInput(targetUser.username);
    setEmailInput(targetUser.email || '');
    setBioInput(targetUser.bio || '');
    setAvatarInput(targetUser.avatarUrl || '');
    setBannerInput(targetUser.bannerUrl || '');
    setIsEditMode(true);
  };

  const handleFileChange = (file: File, type: 'avatar' | 'banner') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (type === 'avatar') {
          setAvatarInput(reader.result);
        } else {
          setBannerInput(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Live Broadcast Launcher Form states
  const [isLiveLauncherOpen, setIsLiveLauncherOpen] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDesc, setLiveDesc] = useState('');
  const [isLivePrivate, setIsLivePrivate] = useState(false);
  const [liveEntryPrice, setLiveEntryPrice] = useState(20);

  // PIX Withdrawal Form states
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [pixName, setPixName] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixType, setPixType] = useState<'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'>('CPF');
  const [withdrawCoins, setWithdrawCoins] = useState(500);
  const [withdrawResult, setWithdrawResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Select appropriate tabs inside Profile ('ABOUT', 'FINANCES', 'PHOTOS')
  const [activeTab, setActiveTab] = useState<'ABOUT' | 'FINANCES'>('ABOUT');

  // Check if Host currently has an active Live Stream
  const activeLiveStream = lives.find(l => l.hostId === targetUser.id && l.isLive);

  // Filter financial transactions for this host
  const myFinancialHistory = financials.filter(f => f.hostId === targetUser.id);
  const myWithdrawRequests = withdrawals.filter(w => w.hostId === targetUser.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateProfile(usernameInput, emailInput, bioInput, avatarInput, bannerInput);
    if (res.success) {
      setIsEditMode(false);
      alert('Perfil atualizado com sucesso!');
    } else {
      alert(res.error || 'Erro ao atualizar o perfil.');
    }
  };

  const handleRequestHost = () => {
    requestHostRole();
    alert('Sua solicitação de Host foi enviada para análise! Aguarde aprovação de um administrador.');
  };

  const handleStartLive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveTitle.trim()) {
      alert('Por favor, informe uma descrição ou título da live.');
      return;
    }

    const createdLive = startLiveStream(
      liveTitle,
      liveDesc,
      isLivePrivate,
      isLivePrivate ? Math.max(config.minPrivateLivePrice, Number(liveEntryPrice)) : 0
    );

    setIsLiveLauncherOpen(false);
    onSelectLive(createdLive); // Open player immediately!
  };

  const handleRequestPIX = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixName.trim() || !pixKey.trim()) {
      setWithdrawResult({ success: false, msg: 'Preencha seu Nome Completo e chave PIX.' });
      return;
    }

    const coinsVal = Number(withdrawCoins);
    if (isNaN(coinsVal) || coinsVal < 100) {
      setWithdrawResult({ success: false, msg: 'O valor mínimo de moedas para saque é de 100 moedas.' });
      return;
    }

    const res = requestWithdrawal(pixName, pixKey, pixType, coinsVal);
    if (res.success) {
      setWithdrawResult({ success: true, msg: `Solicitação de saque PIX registrada! R$ ${(coinsVal * config.coinToBrlRate).toFixed(2)} já foi descontado do saldo disponível.` });
      // Reset
      setPixName('');
      setPixKey('');
      setWithdrawCoins(500);
    } else {
      setWithdrawResult({ success: false, msg: res.error || 'Erro processando pedido de saque.' });
    }
  };

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen pb-16 selection:bg-pink-600 selection:text-white">
      
      {/* 1. TOP MINI NAV HEADER */}
      <div className="bg-gray-900 border-b border-gray-850 sticky top-0 z-35 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar ao Início
          </button>
          
          <span className="text-xs text-gray-400 font-mono">
            {isOwnProfile ? 'Meu Perfil Particular' : `Visualizando @${targetUser.username}`}
          </span>

          <button
            onClick={() => alert(`Link de perfil copiado: streamvip.com/profile/${targetUser.username}`)}
            className="p-1 px-2.5 bg-gray-850 hover:bg-gray-800 rounded border border-gray-800 text-gray-400 hover:text-white text-3xs font-mono tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <Share2 size={12} /> Compartilhar
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        
        {/* 2. PROFILE HERO CARD (BANNER + AVATAR + ROLES + STATS) */}
        <div id="profile-card" className="bg-gray-900 border border-gray-850 rounded-2xl overflow-hidden relative shadow-xl">
          
          {/* Banner Container */}
          <div className="h-36 sm:h-48 md:h-52 bg-gray-950 relative overflow-hidden">
            <img src={targetUser.bannerUrl} alt="banner" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
          </div>

          {/* Floating Avatar & Main Info */}
          <div className="px-6 pb-6 relative z-10 -mt-10 sm:-mt-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 min-w-0">
              {/* Profile Avatar Frame */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-gray-900 bg-gray-950 overflow-hidden shadow-2xl relative shrink-0">
                <img src={targetUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>

              {/* Identity details */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-display font-black text-white shrink-0">
                    @{targetUser.username}
                  </h2>
                  {isTargetHost && (
                    <span className="bg-pink-500/20 text-pink-400 font-mono font-bold text-5xs px-2 py-0.5 rounded border border-pink-500/30 flex items-center gap-1 uppercase tracking-wider shrink-0">
                      <Radio size={10} /> Host Oficial
                    </span>
                  )}
                  {targetUser.role === 'SUPER_ADMIN' && (
                    <span className="bg-red-500/20 text-red-400 font-mono font-bold text-5xs px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1 uppercase tracking-wider shrink-0">
                      Super Admin
                    </span>
                  )}
                </div>
                <p className="text-2xs text-gray-400 font-mono mt-0.5">{targetUser.email}</p>
                
                {/* Stats layout */}
                <div className="flex items-center gap-4 mt-3 text-2xs md:text-xs font-mono text-gray-400">
                  <span>
                    <strong className="text-white font-display font-extrabold">{targetUser.followersCount}</strong> seguidores
                  </span>
                  <span>
                    <strong className="text-white font-display font-extrabold">{isOwnProfile ? targetUser.followingIds.length : 0}</strong> seguindo
                  </span>
                  {isTargetHost && (
                    <span>
                      <strong className="text-white font-display font-extrabold">{targetUser.livesCount}</strong> transmissões
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CTAs / Controls */}
            <div className="flex gap-2.5 shrink-0 self-start sm:self-end mt-2 sm:mt-0">
              
              {isOwnProfile ? (
                /* Self-owner commands */
                <>
                  <button
                    onClick={openEditMode}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl border border-gray-700/60 text-xs font-bold flex items-center gap-1 hover:scale-103 transition-transform cursor-pointer"
                  >
                    <Settings size={14} /> Editar Perfil
                  </button>

                  {/* Solicitacao cargo Host pendente ou disponível */}
                  {targetUser.role === 'USER' && !targetUser.isHostRequestPending && (
                    <button
                      onClick={handleRequestHost}
                      className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer shadow shadow-pink-600/20 flex items-center gap-1 hover:scale-103 transition-all"
                    >
                      <Plus size={14} /> Solicitar Ser Host
                    </button>
                  )}

                  {targetUser.role === 'USER' && targetUser.isHostRequestPending && (
                    <span className="bg-yellow-500/10 text-yellow-400 font-mono text-3xs px-3.5 py-2 rounded-xl border border-yellow-500/20">
                      Host Solicitado (Pendente)
                    </span>
                  )}

                  {isTargetHost && (
                    <button
                      onClick={() => setIsLiveLauncherOpen(true)}
                      className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-pink-600/20 cursor-pointer flex items-center gap-1 hover:scale-103 transition-transform"
                    >
                      <Radio size={14} className="animate-pulse" /> Iniciar Live
                    </button>
                  )}
                </>
              ) : (
                /* Visitor commands */
                <>
                  <button
                    onClick={() => followToggle(targetUser.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSpectatorFollowing
                        ? 'bg-gray-850 hover:bg-gray-800 text-gray-300 border border-gray-800'
                        : 'bg-pink-600 hover:bg-pink-700 text-white shadow shadow-pink-600/20'
                    }`}
                  >
                    {isSpectatorFollowing ? (
                      <>
                        <UserCheck size={14} /> Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} /> Seguir Host
                      </>
                    )}
                  </button>

                  {activeLiveStream && (
                    <button
                      onClick={() => onSelectLive(activeLiveStream)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl animate-bounce cursor-pointer flex items-center gap-1"
                    >
                      <Tv size={14} /> Assistir Live Ao Vivo
                    </button>
                  )}
                </>
              )}

            </div>

          </div>

          {/* Biography box */}
          <div className="px-6 pb-6 border-t border-gray-850 bg-gray-900/40 p-4">
            <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1">Biografia</p>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl font-sans italic">
              "{targetUser.bio || 'Este usuário não inseriu nenhuma biografia ainda.'}"
            </p>
          </div>

        </div>

        {/* 3. SUB-TABS SELECTOR FOR LIVES OWNERSHIP OR CLIENT BALANCES */}
        {isTargetHost && isOwnProfile && (
          <div className="flex border-b border-gray-850 mt-8">
            <button
              onClick={() => setActiveTab('ABOUT')}
              className={`pb-3 text-xs uppercase tracking-wider font-display font-black px-4 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'ABOUT' ? 'border-pink-600 text-pink-400' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Álbum & Configs
            </button>
            <button
              onClick={() => setActiveTab('FINANCES')}
              className={`pb-3 text-xs uppercase tracking-wider font-display font-black px-4 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'FINANCES' ? 'border-pink-600 text-pink-400' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Financeiro PIX & Divisão
            </button>
          </div>
        )}

        {/* 4. ACTUAL MAIN SECTION TO RENDER */}
        {activeTab === 'ABOUT' && (
          <>
            {/* Private photos modular component embedding */}
            {isTargetHost && (
              <PrivatePhotosSection hostId={targetUser.id} isOwnProfile={isOwnProfile} />
            )}

            {/* Standard logs if normal profile */}
            {!isTargetHost && (
              <div className="bg-gray-900 border border-gray-855 rounded-2xl p-6 mt-8">
                <h3 className="font-display font-bold text-sm text-gray-300 mb-4">Atividade da Conta</h3>
                <div className="text-center py-6 text-gray-500 text-xs font-mono p-4 border border-dashed border-gray-800 rounded-xl bg-gray-950/20">
                  <Coins size={25} className="mx-auto text-gray-700 mb-2" />
                  Este perfil espectador possui {currentUser.coinsBalance} moedas em carteira.
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'FINANCES' && isOwnProfile && isTargetHost && (
          <div className="space-y-8 mt-6">
            
            {/* Wallet metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Saldo Disponível', val: `🪙 ${targetUser.financialWallet.balanceAvailable}`, desc: `R$ ${(targetUser.financialWallet.balanceAvailable * config.coinToBrlRate).toFixed(2)} liberados`, highlights: true },
                { title: 'Saldos Pendentes', val: `🪙 ${targetUser.financialWallet.balancePending}`, desc: `Trava de ${config.pendingDays} dias`, highlights: false },
                { title: 'Total Recebido', val: `🪙 ${targetUser.financialWallet.totalReceived}`, desc: 'Comissão deduzida', highlights: false },
                { title: 'Total Sacado', val: `🪙 ${targetUser.financialWallet.totalWithdrawn}`, desc: 'Pagas via PIX', highlights: false }
              ].map((m, i) => (
                <div key={i} className={`p-4 border rounded-xl flex flex-col justify-between ${
                  m.highlights ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-gray-900 border-gray-850'
                }`}>
                  <div>
                    <span className="text-4xs text-gray-400 font-mono uppercase tracking-wider">{m.title}</span>
                    <p className={`text-sm sm:text-md font-mono font-black mt-1 ${m.highlights ? 'text-emerald-400' : 'text-white'}`}>{m.val}</p>
                  </div>
                  <span className="text-4xs text-gray-500 font-mono mt-2 block">{m.desc}</span>
                </div>
              ))}
            </div>

            {/* WITHDRAW AND FINANCE HISTORY GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box Solicitar Saque */}
              <div className="bg-gray-900 border border-gray-850 p-5 rounded-2xl">
                <h4 className="font-display font-extrabold text-sm text-gray-200 mb-4 flex items-center gap-1.5 border-b border-gray-850 pb-3">
                  <DollarSign size={16} className="text-emerald-500" /> Solicitar Saque via PIX
                </h4>

                {isWithdrawOpen ? (
                  <form onSubmit={handleRequestPIX} className="space-y-4 text-xs">
                    
                    {withdrawResult && (
                      <div className={`p-3 rounded font-mono text-center border ${
                        withdrawResult.success ? 'bg-emerald-950/45 text-emerald-400 border-emerald-800/20' : 'bg-red-955/40 text-red-400 border-red-500/20'
                      }`}>
                        {withdrawResult.msg}
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-400 mb-1 font-mono uppercase tracking-wider">Nome Completo do Titular</label>
                      <input
                        type="text"
                        value={pixName}
                        onChange={e => setPixName(e.target.value)}
                        placeholder="Ex: Juliana Bella Souza"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-650"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-400 mb-1 font-mono uppercase tracking-wider">Tipo Chave PIX</label>
                        <select
                          value={pixType}
                          onChange={e => setPixType(e.target.value as any)}
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-2 text-white"
                        >
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                          <option value="EMAIL">Email</option>
                          <option value="PHONE">Telefone</option>
                          <option value="RANDOM">Chave Aleatória</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1 font-mono uppercase tracking-wider">Chave PIX</label>
                        <input
                          type="text"
                          value={pixKey}
                          onChange={e => setPixKey(e.target.value)}
                          placeholder="Digite a chave PIX"
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-650"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1 font-mono uppercase tracking-wider">Valor em Moedas (Disponível: 🪙 {targetUser.financialWallet.balanceAvailable})</label>
                      <input
                        type="number"
                        min={100}
                        value={withdrawCoins}
                        onChange={e => setWithdrawCoins(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                      />
                      <span className="text-4xs text-gray-400 font-mono mt-1 block">
                        Equivale a: <strong>R$ {(withdrawCoins * config.coinToBrlRate).toFixed(2)}</strong>
                      </span>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsWithdrawOpen(false);
                          setWithdrawResult(null);
                        }}
                        className="bg-gray-800 hover:bg-gray-750 text-gray-300 px-3.5 py-2 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Enviar Solicitação PIX
                      </button>
                    </div>

                  </form>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400">
                      Você pode resgatar seu saldo financeiro acumulado diretamente por PIX. A moeda virtual vale <strong>R$ {config.coinToBrlRate.toFixed(2)}</strong> líquido.
                    </p>
                    <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-850 max-w-sm mx-auto mb-4 mt-2 text-[10px] text-gray-500 leading-normal font-sans">
                      <p className="text-4xs text-amber-500 font-mono font-bold uppercase mb-1">
                        *Mínimo para transferência PIX: 100 Moedas (R$ {(100 * config.coinToBrlRate).toFixed(2)})
                      </p>
                      <p>
                        💡 <strong>Sobre a Divisão:</strong> Todo saldo recebido de álbuns, lives e presentes já passou pela dedução da taxa de comissão administrativa de <strong>{config.platformFeePercent}%</strong>. Por isso, ao sacar pelo PIX você retira <strong>100%</strong> do valor equivalente às suas moedas líquidas.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsWithdrawOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow shadow-emerald-600/10 hover:scale-103 transition-transform"
                    >
                      Preencher Chave PIX Saque
                    </button>
                  </div>
                )}

              </div>

              {/* Status de saques passados */}
              <div className="bg-gray-900 border border-gray-850 p-5 rounded-2xl">
                <h4 className="font-display font-extrabold text-sm text-gray-200 mb-4 flex items-center gap-1.5 border-b border-gray-850 pb-3">
                  <Clock size={16} className="text-indigo-500" /> Meus Resgastes PIX ({myWithdrawRequests.length})
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {myWithdrawRequests.length === 0 ? (
                    <p className="text-xs text-gray-500 py-8 text-center font-mono">Nenhum saque solicitado ainda</p>
                  ) : (
                    myWithdrawRequests.map(w => (
                      <div key={w.id} className="p-2.5 bg-gray-950/60 rounded-xl border border-gray-850 text-3xs flex items-center justify-between gap-3">
                        <div>
                          <p className="text-gray-200 font-semibold font-mono">🪙 {w.amountCoins} moedas</p>
                          <p className="text-gray-500 {`font-mono`} mt-0.5">PIX: {w.pixKey} ({w.pixType})</p>
                          <p className="text-3xs text-gray-500 mt-1">{new Date(w.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-300">R$ {w.amountBRL.toFixed(2)}</p>
                          {w.status === 'PENDING' && <span className="bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20 text-3xs tracking-wider block mt-1 w-max ml-auto">Pendente</span>}
                          {w.status === 'APPROVED' && <span className="bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 text-3xs tracking-wider block mt-1 w-max ml-auto">Aprovado</span>}
                          {w.status === 'PAID' && <span className="bg-emerald-505/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 text-3xs tracking-wider block mt-1 w-max ml-auto font-bold uppercase">Pago via PIX</span>}
                          {w.status === 'REJECTED' && <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded border border-red-500/20 text-3xs tracking-wider block mt-1 w-max ml-auto">Recusado</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Extrato financeiro de transacoes brutas */}
            <div className="bg-gray-900 border border-gray-850 p-5 rounded-2xl">
              <h4 className="font-display font-extrabold text-sm text-gray-200 mb-4 flex items-center gap-1.5 border-b border-gray-850 pb-3">
                <FileText size={16} className="text-amber-500" /> Relatório de Transações & Divisão de Receita ({config.platformFeePercent}% Plataforma)
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-3xs font-mono text-gray-400 leading-normal border-collapse">
                  <thead>
                    <tr className="border-b border-gray-850 text-gray-550 uppercase font-bold">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Serviço/Album</th>
                      <th className="pb-2">Comprador</th>
                      <th className="pb-2">Valor Bruto</th>
                      <th className="pb-2">Minha Comissão ({100 - config.platformFeePercent}%)</th>
                      <th className="pb-2">Status Liberação</th>
                      <th className="pb-2">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myFinancialHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-gray-550">Sem registros nas últimas 24 horas</td>
                      </tr>
                    ) : (
                      myFinancialHistory.map(f => (
                        <tr key={f.id} className="border-b border-gray-850/40 hover:bg-gray-950/20">
                          <td className="py-2.5 max-w-[60px] truncate">{f.id}</td>
                          <td className="py-2.5 text-pink-400">
                            {f.transactionType === 'UNLOCK_PHOTO' && 'Desbloqueio Álbum 📸'}
                            {f.transactionType === 'LIVE_ENTRY' && 'Entrada Live Privada 🎟️'}
                            {f.transactionType === 'LIVE_GIFT' && 'Presente na Live 🎁'}
                          </td>
                          <td className="py-2.5 text-gray-300">@{f.userName}</td>
                          <td className="py-2.5 text-amber-500 font-bold">🪙 {f.grossCoins}</td>
                          <td className="py-2.5 text-emerald-450 font-bold">🪙 {f.hostCutCoins}</td>
                          <td className="py-2.5">
                            {f.isPending ? (
                              <span className="text-yellow-400 font-bold bg-yellow-900/20 px-1.5 py-0.5 rounded border border-yellow-500/20" title={`Libera em ${new Date(f.clearanceTimestamp).toLocaleDateString()}`}>Trava Ativa ⏱️</span>
                            ) : (
                              <span className="text-emerald-400 bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">Liberado</span>
                            )}
                          </td>
                          <td className="py-2.5 text-gray-500">{new Date(f.timestamp).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 5. EDIT PROFILE FORM OVERLAY SHEET */}
      {isEditMode && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-gray-800 bg-gray-950/60 flex items-center justify-between">
              <h3 className="font-display font-black text-white text-md">Editar Perfil Público</h3>
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="text-gray-400 hover:text-white font-mono text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs text-gray-105">
              
              <div className="space-y-1">
                <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Nome de Usuário (@)</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. maria_bella"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs placeholder-gray-600 focus:outline-none focus:border-pink-500 text-white transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">E-mail de Contato</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. maria@gmail.com"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs placeholder-gray-600 focus:outline-none focus:border-pink-500 text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1.5">Foto de Perfil</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isAvatarDragActive 
                      ? 'border-pink-500 bg-pink-500/10' 
                      : 'border-gray-800 bg-gray-950 hover:bg-gray-900/40'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsAvatarDragActive(true);
                  }}
                  onDragLeave={() => setIsAvatarDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsAvatarDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange(file, 'avatar');
                  }}
                  onClick={() => document.getElementById('avatar-file-input')?.click()}
                >
                  <input 
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file, 'avatar');
                    }}
                  />
                  {avatarInput ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={avatarInput} alt="Preview Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-pink-500" referrerPolicy="no-referrer" />
                      <span className="text-3xs text-pink-400 font-mono">Arraste nova foto ou clique para alterar</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-1">
                      <Upload size={18} className="text-gray-500 mb-1" />
                      <span className="font-semibold text-gray-300">Carregar Foto de Perfil</span>
                      <span className="text-4xs text-gray-500">Arraste e solte ou de um clique</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1.5">Banner Superior</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isBannerDragActive 
                      ? 'border-pink-500 bg-pink-500/10' 
                      : 'border-gray-800 bg-gray-950 hover:bg-gray-900/40'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsBannerDragActive(true);
                  }}
                  onDragLeave={() => setIsBannerDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsBannerDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange(file, 'banner');
                  }}
                  onClick={() => document.getElementById('banner-file-input')?.click()}
                >
                  <input 
                    id="banner-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file, 'banner');
                    }}
                  />
                  {bannerInput ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={bannerInput} alt="Preview Banner" className="w-full h-12 rounded object-cover border border-pink-500" referrerPolicy="no-referrer" />
                      <span className="text-3xs text-pink-400 font-mono">Arraste ou clique para alterar o banner</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-1">
                      <Upload size={18} className="text-gray-500 mb-1" />
                      <span className="font-semibold text-gray-300">Carregar Banner Superior</span>
                      <span className="text-4xs text-gray-500">Arraste e solte ou de um clique</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Minha Biografia</label>
                <textarea
                  value={bioInput}
                  onChange={e => setBioInput(e.target.value)}
                  placeholder="Conte um pouco sobre suas atividades e horários de transmissão!"
                  rows={3}
                  maxLength={160}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-805 flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="bg-gray-800 hover:bg-gray-750 text-gray-300 px-3.5 py-2 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 rounded-lg cursor-pointer shadow"
                >
                  Gravar Alterações
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. LIVE LAUNCHER MODAL (HOST INICIA LIVE DIRETA PELO NAVEGADOR) */}
      {isLiveLauncherOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-gray-800 bg-gray-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="text-pink-500 animate-pulse" size={20} />
                <h3 className="font-display font-extrabold text-white text-md">Lançar Transmissão Ao Vivo Direta</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveLauncherOpen(false)}
                className="text-gray-400 hover:text-white font-mono text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartLive} className="p-6 space-y-4 text-xs text-gray-100">
              
              <div>
                <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Título da Transmissão</label>
                <input
                  type="text"
                  value={liveTitle}
                  onChange={e => setLiveTitle(e.target.value)}
                  placeholder="Ex: Conversa de Bastidores & Relax Noite do Vinho 🍷"
                  maxLength={60}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-650"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Descrição Curta</label>
                <textarea
                  value={liveDesc}
                  onChange={e => setLiveDesc(e.target.value)}
                  placeholder="Ex: Abrirei a câmera por 1 hora para conversar em tempo real com todos!"
                  maxLength={150}
                  rows={2}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-650"
                />
              </div>

              {/* Private Settings togglers */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-200">Definir como Live Privada (Paywall)</h4>
                    <p className="text-4xs text-gray-400 mt-1 max-w-xs">Apenas espectadores pagantes que debitarem entrada poderão assistir.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isLivePrivate}
                    onChange={e => setIsLivePrivate(e.target.checked)}
                    className="w-5 h-5 accent-pink-600 rounded cursor-pointer"
                  />
                </div>

                {isLivePrivate && (
                  <div className="pt-3 border-t border-gray-850 grid grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Preço de Entrada (Moedas)</label>
                      <input
                        type="number"
                        min={config.minPrivateLivePrice}
                        value={liveEntryPrice}
                        onChange={e => setLiveEntryPrice(Math.max(config.minPrivateLivePrice, Number(e.target.value)))}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <p className="text-3xs text-yellow-400/80 font-mono leading-tight">
                      *Mínimo permitido p/ lives privadas: <strong>🪙 {config.minPrivateLivePrice} moedas</strong> conforme regras administrativas.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-pink-955/10 p-3 rounded-xl border border-pink-500/20 text-3xs leading-relaxed text-gray-450 font-mono">
                💡 <strong>Transmissão direta sem Softwares:</strong> O navegador fará captura direta da sua Webcam e Microfone. Você poderá bater papo, gerenciar silenciamentos e remover mensagens no player em tempo real!
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2 font-semibold">
                <button
                  type="button"
                  onClick={() => setIsLiveLauncherOpen(false)}
                  className="bg-gray-800 hover:bg-gray-750 text-gray-300 px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-pink-600 to-rose-500 text-white px-5 py-2 rounded-lg cursor-pointer shadow-lg shadow-pink-600/10 flex items-center gap-1"
                >
                  <Radio size={14} className="animate-pulse" /> Abrir Minha Câmera Ao Vivo
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
