/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  getDocFromServer
} from 'firebase/firestore';
import {
  UserProfile,
  PrivatePhoto,
  CoinPackage,
  LiveStream,
  PlatformConfig,
  WithdrawalRequest,
  FinancialMovement,
  AdminActionLog,
  UserActivityLog,
  UserNotification,
  PhotoUnlock,
  ChatMessage,
  UserRole
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_COIN_PACKAGES,
  INITIAL_USERS,
  INITIAL_PHOTOS,
  INITIAL_LIVES,
  INITIAL_WITHDRAWALS,
  INITIAL_FINANCIAL_MOVEMENTS,
  INITIAL_ADMIN_LOGS,
  INITIAL_ACTIVITIES,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';

// Firestore error profiling as requested by Firebase Integration Skill rules
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'client-logged-session',
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface PlatformContextProps {
  currentUser: UserProfile | null;
  users: UserProfile[];
  photos: PrivatePhoto[];
  photoLocks: PhotoUnlock[];
  lives: LiveStream[];
  coinPackages: CoinPackage[];
  withdrawals: WithdrawalRequest[];
  financials: FinancialMovement[];
  adminLogs: AdminActionLog[];
  activities: UserActivityLog[];
  notifications: UserNotification[];
  config: PlatformConfig;
  chatMessages: ChatMessage[];
  
  // Real authentication controls
  login: (emailOrUsername: string, password?: string) => { success: boolean; error?: string };
  registerUser: (username: string, email: string, password?: string, role?: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  
  // User Actions
  updateProfile: (username: string, email: string, bio: string, avatarUrl: string, bannerUrl: string) => { success: boolean; error?: string };
  requestHostRole: () => void;
  purchaseCoinsSimulated: (packId: string) => void;
  buyPhotoUnlock: (photoId: string) => boolean;
  followToggle: (hostId: string) => void;
  likeLiveStream: (liveId: string) => void;
  payPrivateLiveEntry: (liveId: string) => boolean;
  sendGiftToHost: (hostId: string, giftName: string, price: number) => boolean;
  
  // Live Broadcaster actions
  startLiveStream: (title: string, description: string, isPrivate: boolean, entryPrice: number) => LiveStream;
  stopActiveStream: (liveId: string) => void;
  sendChatMessage: (liveId: string, text: string) => void;
  deleteChatMessage: (msgId: string) => void;
  kickOrBlockUser: (targetUserId: string, liveId: string) => void;
  
  // Host Content Upload
  uploadPrivatePhoto: (title: string, description: string, price: number, imageUrl: string) => boolean;
  deletePrivatePhoto: (photoId: string) => void;
  
  // Host Withdraw actions
  requestWithdrawal: (fullName: string, pixKey: string, pixType: any, amountCoins: number) => { success: boolean; error?: string };
  
  // Admin Operations
  approveHost: (userId: string) => void;
  rejectHost: (userId: string) => void;
  suspendHost: (userId: string) => void;
  addCoinsToUser: (userId: string, amount: number) => void;
  removeCoinsFromUser: (userId: string, amount: number) => void;
  editUserRole: (userId: string, newRole: UserRole, permissions?: any) => void;
  toggleUserBlock: (userId: string) => void;
  deleteUser: (userId: string) => void;
  forceEndLive: (liveId: string) => void;
  approvePhoto: (photoId: string) => void;
  rejectPhoto: (photoId: string) => void;
  updatePlatformConfig: (updated: Partial<PlatformConfig>) => void;
  updateCoinPackages: (updated: CoinPackage[]) => void;
  
  // Withdrawal approvals
  processWithdrawal: (withdrawId: string, action: 'APPROVED' | 'PAID' | 'REJECTED') => void;
  
  // Simulated tools
  clearPendingBalances: () => void;
  expireUnlockInstant: (lockId: string) => void;
}

const PlatformContext = createContext<PlatformContextProps | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State Hydration with localStorage
  const loadState = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(`liveplatform_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const saveState = (key: string, value: any) => {
    try {
      localStorage.setItem(`liveplatform_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn(`[SafeStorage] Could not write ${key} to localStorage:`, e);
    }
  };

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => loadState<UserProfile | null>('current_user', null)); 
  const [users, setUsers] = useState<UserProfile[]>(() => loadState('users', INITIAL_USERS));
  const [photos, setPhotos] = useState<PrivatePhoto[]>(() => loadState('photos', INITIAL_PHOTOS));
  const [photoLocks, setPhotoLocks] = useState<PhotoUnlock[]>(() => loadState('photo_locks', []));
  const [lives, setLives] = useState<LiveStream[]>(() => loadState('lives', INITIAL_LIVES));
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>(() => loadState('coin_packages', INITIAL_COIN_PACKAGES));
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => loadState('withdrawals', INITIAL_WITHDRAWALS));
  const [financials, setFinancials] = useState<FinancialMovement[]>(() => loadState('financials', INITIAL_FINANCIAL_MOVEMENTS));
  const [adminLogs, setAdminLogs] = useState<AdminActionLog[]>(() => loadState('admin_logs', INITIAL_ADMIN_LOGS));
  const [activities, setActivities] = useState<UserActivityLog[]>(() => loadState('activities', INITIAL_ACTIVITIES));
  const [notifications, setNotifications] = useState<UserNotification[]>(() => loadState('notifications', INITIAL_NOTIFICATIONS));
  const [config, setConfig] = useState<PlatformConfig>(() => {
    const loaded = loadState<PlatformConfig>('config', INITIAL_CONFIG);
    if (!loaded.coinToBrlRate || loaded.coinToBrlRate === 0.10) {
      loaded.coinToBrlRate = 0.05;
    }
    return loaded;
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    // Start with basic welcome messages
    return [
      { id: 'm2', liveId: 'live-juliana', userId: 'user-superadmin', userName: 'superadmin_julio', userRole: 'SUPER_ADMIN', text: 'Live incrível, parabéns pela transmissão!', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    ];
  });

  // 2. State synchronization with localStorage
  useEffect(() => {
    saveState('current_user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveState('users', users);
  }, [users]);

  useEffect(() => {
    saveState('photos', photos);
  }, [photos]);

  useEffect(() => {
    saveState('photo_locks', photoLocks);
  }, [photoLocks]);

  useEffect(() => {
    saveState('lives', lives);
  }, [lives]);

  useEffect(() => {
    saveState('coin_packages', coinPackages);
  }, [coinPackages]);

  useEffect(() => {
    saveState('withdrawals', withdrawals);
  }, [withdrawals]);

  useEffect(() => {
    saveState('financials', financials);
  }, [financials]);

  useEffect(() => {
    saveState('admin_logs', adminLogs);
  }, [adminLogs]);

  useEffect(() => {
    saveState('activities', activities);
  }, [activities]);

  useEffect(() => {
    saveState('notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    saveState('config', config);
  }, [config]);

  // Request browser notification permissions for system alerts on application load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('[PWA] Notification registration response:', permission);
      });
    }
  }, []);

  // 3. Real-time live streams Firestore subscription with auto-seeding
  useEffect(() => {
    const livesRef = collection(db, 'lives');
    
    const unsubscribe = onSnapshot(livesRef, async (snapshot) => {
      if (snapshot.empty) {
        // Automatically populate initial live streams on the first provision
        for (const initialLive of INITIAL_LIVES) {
          try {
            await setDoc(doc(db, 'lives', initialLive.id), {
              ...initialLive,
              streamSource: 'SIMULATION'
            });
          } catch (err) {
            console.warn('Auto-seeding live stream failed:', err);
          }
        }
      } else {
        const liveList: LiveStream[] = [];
        snapshot.forEach((docItem) => {
          const data = docItem.data();
          liveList.push(data as LiveStream);
        });
        setLives(liveList);
      }
    }, (error) => {
      console.warn('Failed to stream lives collection from Firestore:', error);
    });

    return () => unsubscribe();
  }, []);

  // Keep currentUser state in sync with users database array
  useEffect(() => {
    if (!currentUser) return;
    const freshUser = users.find(u => u.id === currentUser.id);
    if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
      setCurrentUser(freshUser);
    }
  }, [users, currentUser?.id]);

  // General Loggers
  const addLog = (adminName: string, actionText: string) => {
    if (!currentUser) return;
    const newLog: AdminActionLog = {
      id: `adminlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminId: currentUser.id,
      adminName,
      action: actionText,
      timestamp: new Date().toISOString()
    };
    setAdminLogs(prev => [newLog, ...prev]);
  };

  const addUserActivity = (userId: string, type: any, desc: string) => {
    const newAct: UserActivityLog = {
      id: `act-${Date.now()}`,
      userId,
      activityType: type,
      description: desc,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const sendNotification = (userId: string, title: string, message: string) => {
    const newNotif: UserNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Dispatch Native OS system pushes in real-time when recipient corresponds to current active logged-in session
    if (currentUser && currentUser.id === userId && 'Notification' in window && Notification.permission === 'granted') {
      try {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body: message,
            icon: '/icon-any.svg',
            badge: '/icon-any.svg',
            vibrate: [100, 50, 100],
            tag: newNotif.id,
            data: { url: '/' }
          } as any);
        });
      } catch (e) {
        new Notification(title, {
          body: message,
          icon: '/icon-any.svg'
        });
      }
    }
  };

  // --- Real Auth Actions ---
  const login = (emailOrUsername: string, password?: string): { success: boolean; error?: string } => {
    const found = users.find(u => 
      (u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
       u.username.toLowerCase() === emailOrUsername.toLowerCase())
    );
    if (!found) {
      return { success: false, error: 'Usuário não encontrado.' };
    }
    // For initial mock users without a password, allow standard '123456' or any password to keep demo simple; for registered users, verify exactly.
    if (found.password && found.password !== password) {
      return { success: false, error: 'Senha incorreta.' };
    }
    setCurrentUser(found);
    addUserActivity(found.id, 'LOGIN', 'Logou na plataforma de forma real.');
    return { success: true };
  };

  const registerUser = (username: string, email: string, password?: string, role?: UserRole): { success: boolean; error?: string } => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanRole: UserRole = role || 'USER';
    
    if (!cleanUsername || !cleanEmail || !password) {
      return { success: false, error: 'Preencha todos os campos obrigatórios.' };
    }

    const exists = users.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, error: 'Nome de usuário ou e-mail já cadastrado.' };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      email: cleanEmail,
      password: password,
      role: cleanRole,
      avatarUrl: cleanRole === 'HOST' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' 
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80',
      bio: cleanRole === 'HOST' ? 'Nova Host VIP Oficial. Seja muito bem-vindo ao meu canal! Toggle follow e venha interagir 💄✨' : 'VIP Spectator recém cadastrado na plataforma!',
      coinsBalance: cleanRole === 'HOST' ? 0 : 200, // Real user gets 200 free coins on signup to buy content or test!
      followersCount: 0,
      followingIds: [],
      isBlocked: false,
      isHostApproved: cleanRole === 'HOST', // approved instantly so they can broadcast/test without admin friction
      isHostRequestPending: false,
      livesCount: 0,
      permissions: {
        manageUsers: false,
        manageHosts: false,
        manageLives: false,
        manageCoins: false,
        manageSettings: false,
        manageAdmins: false,
      },
      financialWallet: {
        balanceAvailable: 0,
        balancePending: 0,
        totalReceived: 0,
        totalWithdrawn: 0
      }
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    addUserActivity(newUser.id, 'SIGNUP', 'Criou uma nova conta na plataforma.');
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // --- User Profile Edit ---
  const updateProfile = (username: string, email: string, bio: string, avatarUrl: string, bannerUrl: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      return { success: false, error: 'O nome de usuário não pode ficar vazio.' };
    }
    
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'O e-mail de contato informado é inválido.' };
    }

    const collision = users.find(u => u.id !== currentUser.id && (u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail));
    if (collision) {
      return { success: false, error: 'Nome de usuário ou e-mail já está em uso por outro cadastro.' };
    }

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, username: cleanUsername, email: cleanEmail, bio, avatarUrl, bannerUrl };
      }
      return u;
    }));
    
    addUserActivity(currentUser.id, 'PROFILE_EDIT', 'Editou as informações públicas do perfil.');
    return { success: true };
  };

  // --- Promoted to pending Candidate ---
  const requestHostRole = () => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, isHostRequestPending: true };
      }
      return u;
    }));
    addUserActivity(currentUser.id, 'REQUEST_HOST', 'Solicitou o cargo de Host da plataforma.');
    
    // Notify all admins
    users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').forEach(admin => {
      sendNotification(admin.id, 'Solicitação de Host Pendente', `O usuário @${currentUser.username} solicitou o cargo de Host.`);
    });
  };

  // --- Purchase packages simulating redirect ---
  const purchaseCoinsSimulated = (packId: string) => {
    const pack = coinPackages.find(p => p.id === packId);
    if (!pack) return;
    
    // Simulate updating points locally
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, coinsBalance: u.coinsBalance + pack.coinsCount };
      }
      return u;
    }));

    addUserActivity(currentUser.id, 'BUY_COINS', `Adquiriu pacote de ${pack.coinsCount} moedas por R$ ${pack.priceBRL.toFixed(2)}.`);
    sendNotification(currentUser.id, 'Moedas creditadas! 🪙', `Você comprou e recebeu ${pack.coinsCount} moedas virtuais com sucesso!`);
  };

  // --- Unlock private photo (Validity 24h) ---
  const buyPhotoUnlock = (photoId: string): boolean => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return false;

    // Check balance
    if (currentUser.coinsBalance < photo.coinPrice) {
      return false;
    }

    // Deduct coins & record unlock
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, coinsBalance: u.coinsBalance - photo.coinPrice };
      }
      return u;
    }));

    // Generate Photo Unlock tracker
    const newLock: PhotoUnlock = {
      id: `lock-${Date.now()}`,
      photoId,
      userId: currentUser.id,
      unlockedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + config.photoAccessHours * 60 * 60 * 1000).toISOString()
    };
    setPhotoLocks(prev => [...prev, newLock]);

    // Financial split math
    const gross = photo.coinPrice;
    const platformPercent = config.platformFeePercent;
    const platformCut = Math.round((gross * platformPercent) / 100);
    const hostCut = gross - platformCut;

    // Credit host Wallet and transaction financials
    setUsers(prev => prev.map(u => {
      if (u.id === photo.hostId) {
        const wallet = u.financialWallet || { balanceAvailable: 0, balancePending: 0, totalReceived: 0, totalWithdrawn: 0 };
        return {
          ...u,
          financialWallet: {
            ...wallet,
            balancePending: wallet.balancePending + hostCut,
            totalReceived: wallet.totalReceived + hostCut
          }
        };
      }
      return u;
    }));

    const newMovement: FinancialMovement = {
      id: `fm-${Date.now()}`,
      transactionType: 'UNLOCK_PHOTO',
      hostId: photo.hostId,
      hostName: photo.hostName,
      userId: currentUser.id,
      userName: currentUser.username,
      grossCoins: gross,
      platformCutCoins: platformCut,
      hostCutCoins: hostCut,
      platformPercent,
      timestamp: new Date().toISOString(),
      isPending: true,
      clearanceTimestamp: new Date(Date.now() + config.pendingDays * 24 * 60 * 60 * 1000).toISOString()
    };

    setFinancials(prev => [newMovement, ...prev]);
    addUserActivity(currentUser.id, 'UNLOCK_PHOTO', `Desbloqueou o álbum privado "${photo.title}" de mídias do Host @${photo.hostName}.`);
    sendNotification(photo.hostId, 'Venda de Conteúdo 📸', `O usuário @${currentUser.username} desbloqueou sua foto "${photo.title}". Você recebeu +${hostCut} moedas (pendente).`);

    return true;
  };

  // --- Toggle Follow ---
  const followToggle = (hostId: string) => {
    const isFollowing = currentUser.followingIds.includes(hostId);
    
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const followingIds = isFollowing
          ? u.followingIds.filter(id => id !== hostId)
          : [...u.followingIds, hostId];
        return { ...u, followingIds };
      }
      if (u.id === hostId) {
        return { ...u, followersCount: Math.max(0, u.followersCount + (isFollowing ? -1 : 1)) };
      }
      return u;
    }));

    addUserActivity(currentUser.id, 'FOLLOW', `${isFollowing ? 'Deixou de seguir' : 'Começou a seguir'} o host @${users.find(u => u.id === hostId)?.username}.`);

    // Dispatch realtime alert notification on follow increment
    if (!isFollowing) {
      sendNotification(hostId, 'Novo Seguidor! 🎉', `@${currentUser.username} começou a te seguir.`);
    }
  };

  // --- Like active live stream ---
  const likeLiveStream = (liveId: string) => {
    setLives(prev => prev.map(l => {
      if (l.id === liveId) {
        const incremented = l.likesCount + 1;
        // Asynchronously update Firestore
        try {
          updateDoc(doc(db, 'lives', liveId), { likesCount: incremented }).catch(err => {
            console.error('Firestore like count update failed:', err);
          });
        } catch (e) {
          console.error(e);
        }
        return { ...l, likesCount: incremented };
      }
      return l;
    }));
  };

  // --- Pay for direct entry to private live ---
  const payPrivateLiveEntry = (liveId: string): boolean => {
    const live = lives.find(l => l.id === liveId);
    if (!live || !live.isPrivate) return false;

    if (currentUser.coinsBalance < live.entryPrice) {
      return false;
    }

    // Deduct coins from user
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, coinsBalance: u.coinsBalance - live.entryPrice };
      }
      return u;
    }));

    // Math split
    const gross = live.entryPrice;
    const platformPercent = config.platformFeePercent;
    const platformCut = Math.round((gross * platformPercent) / 100);
    const hostCut = gross - platformCut;

    // Credit host
    setUsers(prev => prev.map(u => {
      if (u.id === live.hostId) {
        const wallet = u.financialWallet || { balanceAvailable: 0, balancePending: 0, totalReceived: 0, totalWithdrawn: 0 };
        return {
          ...u,
          financialWallet: {
            ...wallet,
            balancePending: wallet.balancePending + hostCut,
            totalReceived: wallet.totalReceived + hostCut
          }
        };
      }
      return u;
    }));

    // Add entry log
    const newMovement: FinancialMovement = {
      id: `fm-live-${Date.now()}`,
      transactionType: 'LIVE_ENTRY',
      hostId: live.hostId,
      hostName: live.hostName,
      userId: currentUser.id,
      userName: currentUser.username,
      grossCoins: gross,
      platformCutCoins: platformCut,
      hostCutCoins: hostCut,
      platformPercent,
      timestamp: new Date().toISOString(),
      isPending: true,
      clearanceTimestamp: new Date(Date.now() + config.pendingDays * 24 * 60 * 60 * 1000).toISOString()
    };

    setFinancials(prev => [newMovement, ...prev]);
    addUserActivity(currentUser.id, 'ENTER_LIVE_PRIVATE', `Pagou taxa de ${live.entryPrice} moedas para entrar na Live Privada de @${live.hostName}.`);
    sendNotification(live.hostId, 'Entrada em Live Privada 🎟️', `@${currentUser.username} entrou na sua live privada. Você recebeu +${hostCut} moedas (pendentes).`);

    // Add viewer to live
    setLives(prev => prev.map(l => {
      if (l.id === liveId) {
        const updatedViewers = l.viewersCount + 1;
        // Asynchronously update Firestore
        try {
          updateDoc(doc(db, 'lives', liveId), { viewersCount: updatedViewers }).catch(err => {
            console.error('Firestore viewersCount increment error:', err);
          });
        } catch (e) {
          console.error(e);
        }
        return { ...l, viewersCount: updatedViewers };
      }
      return l;
    }));

    return true;
  };

  // --- Send Gift to Host with Split ---
  const sendGiftToHost = (hostId: string, giftName: string, price: number): boolean => {
    if (!currentUser) return false;
    if (currentUser.coinsBalance < price) return false;

    // Deduct coins from spectator
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, coinsBalance: u.coinsBalance - price };
      }
      return u;
    }));

    // Math split
    const gross = price;
    const platformPercent = config.platformFeePercent;
    const platformCut = Math.round((gross * platformPercent) / 100);
    const hostCut = gross - platformCut;

    // Get host username string if possible
    const hostUser = users.find(u => u.id === hostId);
    const hostName = hostUser ? hostUser.username : 'Host';

    // Credit host financialWallet
    setUsers(prev => prev.map(u => {
      if (u.id === hostId) {
        const wallet = u.financialWallet || { balanceAvailable: 0, balancePending: 0, totalReceived: 0, totalWithdrawn: 0 };
        return {
          ...u,
          financialWallet: {
            ...wallet,
            balanceAvailable: wallet.balanceAvailable + hostCut,
            totalReceived: wallet.totalReceived + hostCut
          }
        };
      }
      return u;
    }));

    // Add entry log
    const newMovement: FinancialMovement = {
      id: `fm-gift-${Date.now()}`,
      transactionType: 'LIVE_GIFT',
      hostId,
      hostName,
      userId: currentUser.id,
      userName: currentUser.username,
      grossCoins: gross,
      platformCutCoins: platformCut,
      hostCutCoins: hostCut,
      platformPercent,
      timestamp: new Date().toISOString(),
      isPending: false, // immediate release for gifts
      clearanceTimestamp: new Date().toISOString()
    };

    setFinancials(prev => [newMovement, ...prev]);
    addUserActivity(currentUser.id, 'SEND_GIFT', `Enviou presente "${giftName}" de ${price} moedas para o Host @${hostName}.`);
    sendNotification(hostId, 'Presente Recebido 🎁', `@${currentUser.username} te enviou "${giftName}". Você recebeu +${hostCut} moedas (disponível p/ saque).`);

    return true;
  };

  // --- Start Direct Web Live Stream ---
  const startLiveStream = (title: string, description: string, isPrivate: boolean, entryPrice: number): LiveStream => {
    const newLive: LiveStream = {
      id: `live-${currentUser.id}`,
      hostId: currentUser.id,
      hostName: currentUser.username,
      hostAvatar: currentUser.avatarUrl,
      title,
      description,
      isPrivate,
      entryPrice: isPrivate ? Math.max(config.minPrivateLivePrice, entryPrice) : 0,
      viewersCount: Math.floor(Math.random() * 15 + 5), // starting simulated viewers
      likesCount: 0,
      isLive: true,
      streamStartedAt: new Date().toISOString(),
      streamSource: 'WEBCAM' // Default to real webcam mode as preferred by the user!
    };

    // Replace outstanding live stream locally
    setLives(prev => [newLive, ...prev.filter(l => l.hostId !== currentUser.id)]);

    // Write to Firestore asynchronously
    try {
      const liveDocRef = doc(db, 'lives', newLive.id);
      setDoc(liveDocRef, newLive).catch(err => {
        console.error('Firestore startLiveStream error:', err);
      });
    } catch (e) {
      console.error('Firestore create reference failed:', e);
    }

    // Increment livesCount
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, livesCount: u.livesCount + 1 };
      }
      return u;
    }));

    addUserActivity(currentUser.id, 'START_STREAM', `Iniciou uma nova transmissão ao vivo ${isPrivate ? 'Privada' : 'Pública'}: "${title}".`);

    // Dispatch native system alerts on start status to followers and admins
    users.forEach(u => {
      if (u.id !== currentUser.id && (u.followingIds.includes(currentUser.id) || u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')) {
        sendNotification(u.id, '🎥 Live Iniciada!', `@${currentUser.username} está AO VIVO agora: "${title}"`);
      }
    });

    return newLive;
  };

  const stopActiveStream = (liveId: string) => {
    setLives(prev => prev.map(l => {
      if (l.id === liveId) {
        return { ...l, isLive: false };
      }
      return l;
    }));

    // Disable broadcast status on Firestore
    try {
      const liveDocRef = doc(db, 'lives', liveId);
      updateDoc(liveDocRef, { isLive: false }).catch(err => {
        console.error('Firestore stopActiveStream error:', err);
      });
    } catch (e) {
      console.error('Firestore stop reference failed:', e);
    }

    addUserActivity(currentUser.id, 'START_STREAM', 'Encerrou sua transmissão ao vivo ativa.');
  };

  // --- Chat controls & Moderation ---
  const sendChatMessage = (liveId: string, text: string) => {
    if (!currentUser) return;
    const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newMsg: ChatMessage = {
      id: msgId,
      liveId,
      userId: currentUser.id,
      userName: currentUser.username,
      userRole: currentUser.role,
      text,
      timestamp: new Date().toISOString()
    };

    // Update in-memory array
    setChatMessages(prev => [...prev, newMsg]);

    // Commit to Firestore live chat streams subcollection
    try {
      const msgRef = doc(db, 'lives', liveId, 'chats', msgId);
      setDoc(msgRef, newMsg).catch(err => {
        console.error('Firestore sendChatMessage error:', err);
      });
    } catch (e) {
      console.error('Firestore chat reference failed:', e);
    }

    // Trigger real-time notifications for mentions, presents, or high importance inputs
    const currentLiveStream = lives.find(l => l.id === liveId);
    if (currentLiveStream && currentLiveStream.hostId !== currentUser.id) {
      if (text.includes('enviou um presente:') || text.includes('🎁')) {
        sendNotification(currentLiveStream.hostId, '🎁 Presente Recebido!', `@${currentUser.username} ${text}`);
      } else if (text.includes('@' + currentLiveStream.hostName) || text.length > 55) {
        sendNotification(currentLiveStream.hostId, '💬 Mensagem Importante', `@${currentUser.username}: "${text}"`);
      }
    }
  };

  const deleteChatMessage = (msgId: string) => {
    setChatMessages(prev => prev.filter(m => m.id !== msgId));
    addLog(currentUser.username, `Deletou mensagem de chat #${msgId} como ação de moderação.`);
  };

  const kickOrBlockUser = (targetUserId: string, liveId: string) => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return;

    // Simulate kicking from chat
    setChatMessages(prev => prev.filter(m => !(m.userId === targetUserId && m.liveId === liveId)));
    
    // Notify target
    sendNotification(targetUserId, 'Aviso de Moderação', `Você foi temporariamente mutado/silenciado no chat da live.`);
    addLog(currentUser.username, `Silenciou usuário @${target.username} no chat da live.`);
  };

  // --- Host Photo Management ---
  const uploadPrivatePhoto = (title: string, description: string, price: number, imageUrl: string): boolean => {
    // Count active photos of current host
    const myPhotos = photos.filter(p => p.hostId === currentUser.id);
    if (myPhotos.length >= config.maxPrivatePhotos) {
      return false; // strictly respect Host limit of 6
    }

    const newPhoto: PrivatePhoto = {
      id: `photo-${Date.now()}`,
      hostId: currentUser.id,
      hostName: currentUser.username,
      title,
      description,
      coinPrice: price,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=850&auto=format&fit=crop&q=80",
      isApproved: false // Awaiting administrator approval
    };

    setPhotos(prev => [...prev, newPhoto]);
    addUserActivity(currentUser.id, 'PROFILE_EDIT', `Enviou uma nova foto privada para aprovação do admin: "${title}".`);
    
    // Send notifications to admins
    users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').forEach(admin => {
      sendNotification(admin.id, 'Conteúdo pendente de aprovação', `@${currentUser.username} postou nova foto privada "${title}".`);
    });

    return true;
  };

  const deletePrivatePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    addUserActivity(currentUser.id, 'PROFILE_EDIT', `Deletou uma de suas fotos privadas.`);
  };

  // --- Withdraw requested ---
  const requestWithdrawal = (fullName: string, pixKey: string, pixType: any, amountCoins: number) => {
    const wallet = currentUser.financialWallet;
    if (!wallet || wallet.balanceAvailable < amountCoins) {
      return { success: false, error: 'Saldo disponível insuficiente para realizar este saque.' };
    }

    // Deduct available
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          financialWallet: {
            ...wallet,
            balanceAvailable: wallet.balanceAvailable - amountCoins,
            totalWithdrawn: wallet.totalWithdrawn + amountCoins
          }
        };
      }
      return u;
    }));

    const newRequest: WithdrawalRequest = {
      id: `withdraw-${Date.now()}`,
      hostId: currentUser.id,
      hostName: currentUser.username,
      fullName,
      pixKey,
      pixType,
      amountCoins,
      amountBRL: amountCoins * config.coinToBrlRate,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    setWithdrawals(prev => [newRequest, ...prev]);
    addUserActivity(currentUser.id, 'PROFILE_EDIT', `Solicitou saque de ${amountCoins} moedas (R$ ${(amountCoins * config.coinToBrlRate).toFixed(2)}) via PIX.`);

    // Notify admins
    users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').forEach(admin => {
      sendNotification(admin.id, 'Novo Saque Solicitado 💰', `O host @${currentUser.username} solicitou saque PIX de ${amountCoins} moedas.`);
    });

    return { success: true };
  };

  // --- Admin Approvals & Core Controls ---
  const approveHost = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role: 'HOST' as UserRole, isHostApproved: true, isHostRequestPending: false };
      }
      return u;
    }));
    const approvedUser = users.find(u => u.id === userId);
    addLog(currentUser.username, `Aprovou solicitação de Host para @${approvedUser?.username}.`);
    sendNotification(userId, 'Host Aprovado! 🌟', 'Parabéns! Sua solicitação de Host foi aprovada. Você já pode iniciar suas lives no painel!');
  };

  const rejectHost = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, isHostRequestPending: false };
      }
      return u;
    }));
    const rejectedUser = users.find(u => u.id === userId);
    addLog(currentUser.username, `Recusou solicitação de Host para @${rejectedUser?.username}.`);
    sendNotification(userId, 'Solicitação Rejeitada ❌', 'Infelizmente, sua solicitação de Host não cumpre nossos termos de uso.');
  };

  const suspendHost = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role: 'USER' as UserRole, isHostApproved: false, isHostRequestPending: false };
      }
      return u;
    }));
    const suspendedUser = users.find(u => u.id === userId);
    addLog(currentUser.username, `Suspeendeu o cargo de Host do usuário @${suspendedUser?.username}.`);
    sendNotification(userId, 'Cargo de Host Suspenso ⚠️', 'Seu cargo de Host foi suspenso por violar os termos de conduta.');
  };

  const addCoinsToUser = (userId: string, amount: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, coinsBalance: u.coinsBalance + amount };
      }
      return u;
    }));
    const target = users.find(u => u.id === userId);
    addLog(currentUser.username, `Adicionou ${amount} moedas ao saldo de @${target?.username}.`);
    sendNotification(userId, 'Moedas Adicionadas! 🪙', `Um administrador creditou ${amount} moedas adicionais em sua carteira.`);
  };

  const removeCoinsFromUser = (userId: string, amount: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, coinsBalance: Math.max(0, u.coinsBalance - amount) };
      }
      return u;
    }));
    const target = users.find(u => u.id === userId);
    addLog(currentUser.username, `Removeu ${amount} moedas do saldo de @${target?.username}.`);
    sendNotification(userId, 'Moedas Debitadas 🪙', `Um administrador removeu ${amount} moedas de sua carteira.`);
  };

  const editUserRole = (userId: string, newRole: UserRole, permissionsInput?: any) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const defaultPermissions = {
          manageUsers: newRole === 'SUPER_ADMIN' || newRole === 'ADMIN',
          manageHosts: newRole === 'SUPER_ADMIN' || newRole === 'ADMIN',
          manageLives: newRole === 'SUPER_ADMIN' || newRole === 'ADMIN',
          manageCoins: newRole === 'SUPER_ADMIN',
          manageSettings: newRole === 'SUPER_ADMIN',
          manageAdmins: newRole === 'SUPER_ADMIN',
        };
        return {
          ...u,
          role: newRole,
          permissions: permissionsInput || defaultPermissions
        };
      }
      return u;
    }));
    const target = users.find(u => u.id === userId);
    addLog(currentUser.username, `Alterou cargo de @${target?.username} para ${newRole}.`);
    sendNotification(userId, 'Cargo Atualizado 🛠️', `Seu nível de conta foi alterado para: ${newRole}.`);
  };

  const toggleUserBlock = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, isBlocked: !u.isBlocked };
      }
      return u;
    }));
    const target = users.find(u => u.id === userId);
    const becameBlocked = !target?.isBlocked;
    addLog(currentUser.username, `${becameBlocked ? 'Bloqueou' : 'Desbloqueou'} o acesso do usuário @${target?.username}.`);
    sendNotification(userId, becameBlocked ? 'Conta Bloqueada 🚫' : 'Conta Ativada ✅', becameBlocked ? 'Sua conta foi temporariamente bloqueada pela administração.' : 'Sua conta foi reativada.');
  };

  const deleteUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    addLog(currentUser.username, `Excluiu permanentemente a conta de @${target?.username}.`);
  };

  const forceEndLive = (liveId: string) => {
    setLives(prev => prev.map(l => {
      if (l.id === liveId) {
        return { ...l, isLive: false };
      }
      return l;
    }));
    const live = lives.find(l => l.id === liveId);
    addLog(currentUser.username, `Encerrou forçadamente a transmissão ao vivo do host @${live?.hostName}.`);
    if (live) sendNotification(live.hostId, 'Live Encerrada por Admin ⚠️', `Sua live ativa foi encerrada por um administrador.`);
  };

  const approvePhoto = (photoId: string) => {
    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return { ...p, isApproved: true };
      }
      return p;
    }));
    const photo = photos.find(p => p.id === photoId);
    addLog(currentUser.username, `Aprovou a foto privada "${photo?.title}" de @${photo?.hostName}.`);
    if (photo) sendNotification(photo.hostId, 'Conteúdo Aprovado! 📸', `Sua foto privada "${photo.title}" foi aprovada e está disponível para compra!`);
  };

  const rejectPhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    addLog(currentUser.username, `Rejeitou a foto privada "${photo?.title}" de @${photo?.hostName}.`);
    if (photo) sendNotification(photo.hostId, 'Conteúdo Rejeitado 📸', `Sua foto "${photo.title}" foi excluída e rejeitada pela moderação.`);
  };

  const updatePlatformConfig = (updated: Partial<PlatformConfig>) => {
    setConfig(prev => ({ ...prev, ...updated }));
    addLog(currentUser.username, `Atualizou configurações gerais do sistema.`);
  };

  const updateCoinPackages = (updated: CoinPackage[]) => {
    setCoinPackages(updated);
    addLog(currentUser.username, `Atualizou tabela de precificação dos pacotes de moedas.`);
  };

  const processWithdrawal = (withdrawId: string, action: 'APPROVED' | 'PAID' | 'REJECTED') => {
    setWithdrawals(prev => prev.map(w => {
      if (w.id === withdrawId) {
        return { ...w, status: action };
      }
      return w;
    }));

    const req = withdrawals.find(w => w.id === withdrawId);
    if (!req) return;

    if (action === 'REJECTED') {
      // Return coins back to host wallet
      setUsers(prev => prev.map(u => {
        if (u.id === req.hostId) {
          const wallet = u.financialWallet;
          return {
            ...u,
            financialWallet: {
              ...wallet,
              balanceAvailable: wallet.balanceAvailable + req.amountCoins,
              totalWithdrawn: Math.max(0, wallet.totalWithdrawn - req.amountCoins)
            }
          };
        }
        return u;
      }));
      sendNotification(req.hostId, 'Saque Rejeitado ❌', `Seu saque solicitando R$ ${req.amountBRL.toFixed(2)} foi rejeitado e as moedas foram devolvidas.`);
    } else if (action === 'APPROVED') {
      sendNotification(req.hostId, 'Saque Aprovado 💰', `Seu saque de R$ ${req.amountBRL.toFixed(2)} foi aprovado e o pagamento está sendo processado.`);
    } else if (action === 'PAID') {
      sendNotification(req.hostId, 'Saque Pago via PIX 🎉', `Seu PIX no valor de R$ ${req.amountBRL.toFixed(2)} foi concluído com sucesso.`);
    }

    addLog(currentUser.username, `Alterou status do saque #${withdrawId} para: ${action}.`);
  };

  // --- Clear Lock Pending in Simulator ---
  const clearPendingBalances = () => {
    // Collect all pending movements and convert them instantly to available
    const pendingMovements = financials.filter(f => f.isPending);
    
    // Distribute them
    setUsers(prev => prev.map(u => {
      // Find payments due for this host
      const hostReceipts = pendingMovements.filter(f => f.hostId === u.id);
      if (hostReceipts.length === 0) return u;

      const sumNetCoins = hostReceipts.reduce((acc, current) => acc + current.hostCutCoins, 0);
      const wallet = u.financialWallet || { balanceAvailable: 0, balancePending: 0, totalReceived: 0, totalWithdrawn: 0 };
      
      return {
        ...u,
        financialWallet: {
          ...wallet,
          balanceAvailable: wallet.balanceAvailable + sumNetCoins,
          balancePending: Math.max(0, wallet.balancePending - sumNetCoins)
        }
      };
    }));

    // Update financials to isPending: false
    setFinancials(prev => prev.map(f => ({ ...f, isPending: false })));
    addLog(currentUser.username, `Forçou a liberação adiantada de todos os saldos de moedas pendentes para os Hosts no simulador.`);
  };

  // --- Expire image unlocks instantly to showcase access restrictions ---
  const expireUnlockInstant = (lockId: string) => {
    setPhotoLocks(prev => prev.filter(p => p.id !== lockId));
    addLog(currentUser.username, `Expirou manualmente o passe de visualização da foto #${lockId}.`);
    sendNotification(currentUser.id, 'Acesso Expirado ⏰', `Seu período de 24 horas para visualizar a foto privada expirou e o conteúdo foi bloqueado novamente.`);
  };

  return (
    <PlatformContext.Provider value={{
      currentUser,
      users,
      photos,
      photoLocks,
      lives,
      coinPackages,
      withdrawals,
      financials,
      adminLogs,
      activities,
      notifications,
      config,
      chatMessages,
      
      login,
      registerUser,
      logout,
      
      updateProfile,
      requestHostRole,
      purchaseCoinsSimulated,
      buyPhotoUnlock,
      followToggle,
      likeLiveStream,
      payPrivateLiveEntry,
      sendGiftToHost,
      
      startLiveStream,
      stopActiveStream,
      sendChatMessage,
      deleteChatMessage,
      kickOrBlockUser,
      
      uploadPrivatePhoto,
      deletePrivatePhoto,
      
      requestWithdrawal,
      
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
      
      processWithdrawal,
      
      clearPendingBalances,
      expireUnlockInstant
    }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
