/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { PrivatePhoto, PhotoUnlock } from '../types';
import { Lock, Eye, Coins, Plus, Trash2, Clock, CheckCircle, AlertCircle, Sparkles, Upload } from 'lucide-react';

interface PrivatePhotosSectionProps {
  hostId: string;
  isOwnProfile: boolean;
}

export const PrivatePhotosSection: React.FC<PrivatePhotosSectionProps> = ({ hostId, isOwnProfile }) => {
  const {
    currentUser,
    photos,
    photoLocks,
    buyPhotoUnlock,
    uploadPrivatePhoto,
    deletePrivatePhoto,
    config,
    expireUnlockInstant
  } = usePlatform();

  // Dialog states for uploading
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCoins, setPriceCoins] = useState(15);
  const [imageUrl, setImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [unlockPhotoTarget, setUnlockPhotoTarget] = useState<PrivatePhoto | null>(null);
  const [photoUnlockError, setPhotoUnlockError] = useState<string | null>(null);

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  // 1. Filter photos belonging to this particular host
  const hostPhotos = photos.filter(p => p.hostId === hostId);
  const approvedHostPhotos = isOwnProfile ? hostPhotos : hostPhotos.filter(p => p.isApproved);

  // 2. Helper to determine unlock status and time left
  const getUnlockDetails = (photoId: string) => {
    const lock = photoLocks.find(l => l.photoId === photoId && l.userId === currentUser.id);
    if (!lock) return { isUnlocked: false, timeLeftStr: '', expired: true, lockId: '' };

    const expiresAt = new Date(lock.expiresAt).getTime();
    const now = Date.now();
    const diff = expiresAt - now;

    if (diff <= 0) {
      return { isUnlocked: false, timeLeftStr: 'Expirado', expired: true, lockId: lock.id };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      isUnlocked: true,
      timeLeftStr: `${hours}h ${mins}min restante`,
      expired: false,
      lockId: lock.id
    };
  };

  // Re-render tick to keep countdown precise
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleBuy = (photo: PrivatePhoto) => {
    setUnlockPhotoTarget(photo);
    setPhotoUnlockError(null);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Por favor, preencha o título e descrição.');
      return;
    }

    const price = Number(priceCoins);
    if (isNaN(price) || price < 1) {
      setErrorMessage('O preço em moedas deve ser no mínimo 1.');
      return;
    }

    if (!imageUrl) {
      setErrorMessage('Por favor, faça o upload de uma imagem.');
      return;
    }

    // Submit
    const success = uploadPrivatePhoto(title, description, price, imageUrl);
    if (success) {
      setIsUploadOpen(false);
      setTitle('');
      setDescription('');
      setImageUrl('');
      setPriceCoins(15);
      setErrorMessage('');
      alert('Foto enviada com sucesso! Ela ficará oculta até ser aprovada por um administrador.');
    } else {
      setErrorMessage(`Limite de fotos privadas atingido! Você pode cadastrar no máximo ${config.maxPrivatePhotos} fotos.`);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-6 mt-8 font-sans">
      
      {/* SECTION TOPPER HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-850">
        <div>
          <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
            📸 Fotos Privadas ({hostPhotos.length}/{config.maxPrivatePhotos})
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Mídias pagas com moedas virtuais. Após o desbloqueio, o acesso expira automaticamente em <strong>{config.photoAccessHours} horas</strong>.
          </p>
        </div>

        {isOwnProfile && hostPhotos.length < config.maxPrivatePhotos && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow"
          >
            <Plus size={15} /> Cadastrar Nova Foto
          </button>
        )}
      </div>

      {/* PHOTO GALLERY GRID */}
      {approvedHostPhotos.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-950/20">
          <Lock size={35} className="mx-auto text-gray-700 mb-2" />
          <h4 className="text-sm font-bold text-gray-400">Nenhum conteúdo privado no momento</h4>
          <p className="text-5xs text-gray-500 font-mono uppercase tracking-wider mt-1">LOCKED PORTFOLIO</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedHostPhotos.map(photo => {
            const unlock = getUnlockDetails(photo.id);
            const canFullyView = isOwnProfile || unlock.isUnlocked;

            return (
              <div
                key={photo.id}
                className="group/photo bg-gray-950 border border-gray-850/80 rounded-xl overflow-hidden shadow-md flex flex-col relative"
              >
                
                {/* Visual Area */}
                <div className="relative h-48 bg-gray-900 overflow-hidden flex items-center justify-center">
                  
                  {/* Photo itself */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      canFullyView ? 'blur-0 scale-100' : 'blur-xl scale-110 opacity-40 select-none'
                    }`}
                    referrerPolicy="no-referrer"
                  />

                  {/* Locked Overlay cover */}
                  {!canFullyView && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-black/60">
                      <div className="w-11 h-11 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-amber-500 mb-2.5">
                        <Lock size={18} />
                      </div>
                      <span className="text-amber-500 font-mono font-black text-xs bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        🪙 {photo.coinPrice} moedas
                      </span>
                      <button
                        onClick={() => handleBuy(photo)}
                        className="mt-3 bg-pink-600 hover:bg-pink-700 text-white font-bold text-5xs px-4 py-1.5 rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow"
                      >
                        Desbloquear 24h
                      </button>
                    </div>
                  )}

                  {/* Expiry Countdown Indicator for active user */}
                  {unlock.isUnlocked && !isOwnProfile && (
                    <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-sm text-white font-mono text-5xs px-2.5 py-1 rounded-md flex items-center gap-1 z-35 shadow">
                      <Clock size={11} className="animate-pulse" /> {unlock.timeLeftStr}
                    </div>
                  )}

                  {/* Simulator Expire Quick Button to showcase blocking */}
                  {unlock.isUnlocked && !isOwnProfile && (
                    <button
                      onClick={() => expireUnlockInstant(unlock.lockId)}
                      title="Expirar Acesso Corrente (Simulador)"
                      className="absolute bottom-3 right-3 bg-gray-950/90 text-red-400 hover:text-red-500 hover:bg-gray-900 font-mono text-5xs px-2 py-1 rounded border border-gray-800 cursor-pointer z-35"
                    >
                      Expirar Hack
                    </button>
                  )}

                  {/* Pending Approval Badge (Owner eyes only) */}
                  {isOwnProfile && !photo.isApproved && (
                    <div className="absolute top-3 left-3 bg-orange-600/95 text-white font-mono text-5xs px-2.5 py-1 rounded flex items-center gap-1 z-35 shadow">
                      <AlertCircle size={11} /> Aguardando Moderador
                    </div>
                  )}
                  {isOwnProfile && photo.isApproved && (
                    <div className="absolute top-3 left-3 bg-emerald-600/95 text-white font-mono text-5xs px-2.5 py-1 rounded flex items-center gap-1 z-35 shadow">
                      <CheckCircle size={11} /> Ativa & Aprovada
                    </div>
                  )}
                </div>

                {/* Info Text details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-sm text-gray-200 line-clamp-1">{photo.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{photo.description}</p>
                  </div>

                  {/* Host direct removal form */}
                  {isOwnProfile && (
                    <div className="mt-4 pt-3 border-t border-gray-850 flex items-center justify-between">
                      <span className="text-xs text-amber-505 font-mono font-bold">Valor: 🪙 {photo.coinPrice}</span>
                      {confirmDeleteId === photo.id ? (
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[10px] text-red-550 font-bold">Excluir?</span>
                          <button
                            onClick={() => {
                              deletePrivatePhoto(photo.id);
                              setConfirmDeleteId(null);
                            }}
                            className="bg-red-650 hover:bg-red-700 text-white font-bold text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-gray-800 hover:bg-gray-750 text-gray-300 text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(photo.id)}
                          className="text-red-400 hover:text-red-500 p-1.5 hover:bg-gray-900 rounded cursor-pointer transition-colors"
                          title="Apagar Álbum"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD PHOTO SHEETS MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-gray-805 bg-gray-955/60 flex items-center justify-between">
              <h3 className="font-display font-extrabold text-white text-md">Cadastrar Foto Privada</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 cursor-pointer"
              >
                <XCloseIcon size={18} onClick={() => setIsUploadOpen(false)} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs text-gray-100">
              
              {errorMessage && (
                <div className="p-2.5 bg-red-950/50 border border-red-500/20 rounded text-red-400 font-mono text-center">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Título da Foto</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Selfie Exclusiva pós academia 🏋️‍♀️"
                  maxLength={50}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Registro inédito reservado de bastidores especiais."
                  maxLength={120}
                  rows={2}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1">Preço (Moedas)</label>
                  <input
                    type="number"
                    value={priceCoins}
                    onChange={e => setPriceCoins(Math.max(1, Number(e.target.value)))}
                    min={1}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-mono uppercase tracking-wider mb-1.5">Enviar Imagem Privada</label>
                  <div 
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isDragActive 
                        ? 'border-pink-500 bg-pink-500/10' 
                        : 'border-gray-800 bg-gray-950 hover:bg-gray-900/40'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragActive(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                    onClick={() => document.getElementById('private-photo-input')?.click()}
                  >
                    <input 
                      id="private-photo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(file);
                      }}
                    />
                    {imageUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={imageUrl} alt="Uploaded private preview" className="max-h-24 rounded object-cover border border-pink-500" referrerPolicy="no-referrer" />
                        <span className="text-3xs text-pink-400 font-mono">Arraste outro arquivo ou clique para alterar</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <Upload size={20} className="text-gray-500" />
                        <span className="font-semibold text-gray-300">Carregar Imagem Privada</span>
                        <span className="text-4xs text-gray-500">Arraste e solte o arquivo ou de um clique</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-3xs text-gray-500 font-mono leading-relaxed bg-gray-950/60 p-3 rounded-lg border border-gray-850">
                ⚠️ <strong>Aviso Importante:</strong> Para garantir a harmonia da plataforma, fotos novas cadastradas necessitam de aprovação de um Administrador nas abas de moderação antes de ficarem visíveis a outros visitantes espectadores.
              </p>

              <div className="pt-3 border-t border-gray-800 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="bg-gray-800 hover:bg-gray-750 text-gray-300 px-4 py-2 rounded-lg cursor-pointer font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 rounded-lg font-bold cursor-pointer shadow shadow-pink-500/20"
                >
                  Enviar para Moderação
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {unlockPhotoTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] select-none animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-pink-950/50 text-pink-500 mb-4 border border-pink-900/30 animate-pulse">
              <Coins size={24} />
            </div>
            <h3 className="font-display font-black text-white text-md mb-2">Desbloquear Foto Privada</h3>
            <p className="text-xs text-gray-400 mb-2 leading-relaxed">
              Deseja desbloquear a foto <strong className="text-white">"{unlockPhotoTarget.title}"</strong> por <span className="text-amber-500 font-bold">🪙 {unlockPhotoTarget.coinPrice} moedas</span>?
            </p>
            <p className="text-[11px] text-gray-500 mb-5">
              Seu acesso será garantido pelas próximas <strong className="text-gray-300">{config.photoAccessHours} horas</strong>.
            </p>

            {photoUnlockError && (
              <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-xl mb-5 text-left">
                <p className="text-red-400 text-3xs font-mono font-bold uppercase tracking-wider mb-0.5">Erro no Saldo</p>
                <p className="text-red-300 text-[11px]">{photoUnlockError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const success = buyPhotoUnlock(unlockPhotoTarget.id);
                  if (success) {
                    setUnlockPhotoTarget(null);
                  } else {
                    setPhotoUnlockError('Saldo de moedas insuficiente! Acesse o botão Comprar Moedas para recarregar sua carteira.');
                  }
                }}
                className="flex-1 bg-gradient-to-r from-pink-600 to-pink-500 hover:opacity-95 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all shadow-lg"
              >
                Confirmar Desbloqueio
              </button>
              <button
                type="button"
                onClick={() => setUnlockPhotoTarget(null)}
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

// Generic small cross icon component internally
const XCloseIcon: React.FC<{ size: number; onClick: () => void }> = ({ size, onClick }) => {
  return (
    <svg onClick={onClick} className="cursor-pointer" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
};
