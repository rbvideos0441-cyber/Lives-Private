/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  UserNotification
} from '../types';

export const INITIAL_CONFIG: PlatformConfig = {
  platformName: "Aovivo Vip",
  logoText: "STREAMVIP",
  mainBannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
  whatsappUrl: "https://wa.me/5511999999999?text=Ola!%20Gostaria%20de%20adquirir%20um%20pacote%20de%20moedas%20para%20a%20plataforma.",
  maxPrivatePhotos: 6,
  photoAccessHours: 24,
  minPrivateLivePrice: 10,
  platformFeePercent: 30, // 30% platform comission, 70% host comission
  coinToBrlRate: 0.05, // 1 coin = R$ 0,05
  pendingDays: 7, // 7 days lock
};

export const INITIAL_COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack-1', name: 'Bronze Pop', coinsCount: 100, priceBRL: 10.00 },
  { id: 'pack-2', name: 'Prata Star', coinsCount: 250, priceBRL: 22.00 }, // R$ 3 discount
  { id: 'pack-3', name: 'Ouro Gold (Mais Vendido)', coinsCount: 600, priceBRL: 50.00 }, // R$ 10 discount
  { id: 'pack-4', name: 'Platina Diamante', coinsCount: 1500, priceBRL: 120.00 }, // R$ 30 discount
  { id: 'pack-5', name: 'VIP Imperial', coinsCount: 4000, priceBRL: 300.00 }, // R$ 100 discount
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-superadmin',
    username: 'superadmin_julio',
    email: 'julio@streamvip.com',
    role: 'SUPER_ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    bio: 'Super Administrador e fundador da StreamVip. Gerenciamento geral do sistema.',
    coinsBalance: 9999,
    followersCount: 154,
    followingIds: ['host-juliana'],
    isBlocked: false,
    isHostApproved: false,
    isHostRequestPending: false,
    livesCount: 0,
    permissions: {
      manageUsers: true,
      manageHosts: true,
      manageLives: true,
      manageCoins: true,
      manageSettings: true,
      manageAdmins: true,
    },
    financialWallet: {
      balanceAvailable: 0,
      balancePending: 0,
      totalReceived: 0,
      totalWithdrawn: 0
    }
  },
  {
    id: 'host-juliana',
    username: 'juliana_bella',
    email: 'juliana@gmail.com',
    role: 'HOST',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    bio: 'Olá amores! Sejam muito bem-vindos ao meu perfil oficial. Lives de segunda a sexta à noite! Venha conversar comigo 💖✨',
    coinsBalance: 320,
    followersCount: 15200,
    followingIds: [],
    isBlocked: false,
    isHostApproved: true,
    isHostRequestPending: false,
    livesCount: 47,
    permissions: {
      manageUsers: false,
      manageHosts: false,
      manageLives: false,
      manageCoins: false,
      manageSettings: false,
      manageAdmins: false,
    },
    financialWallet: {
      balanceAvailable: 1540, // coins
      balancePending: 680,
      totalReceived: 4220,
      totalWithdrawn: 2000
    }
  }
];

export const INITIAL_PHOTOS: PrivatePhoto[] = [
  // Photos of Juliana
  {
    id: 'photo-j-1',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    title: 'Fotografia Profissional Ensaios Externos 📸',
    description: 'Ensaio fotográfico elegante feito no Parque Augusta ao pôr-do-sol.',
    coinPrice: 30,
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=850&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'photo-j-2',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    title: 'Selfie de Bastidores Exclusiva 🤫',
    description: 'Bastidores super descontraídos antes de iniciar a grande transmissão de ontem!',
    coinPrice: 15,
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=850&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'photo-j-3',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    title: 'Look Festa de Sábado Noite de Gala ✨',
    description: 'Amei esse vestido e decidi compartilhar todos os detalhes com vocês! Acesso temporário.',
    coinPrice: 40,
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=850&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'photo-j-4',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    title: 'Preparação para Ensaio em Estúdio 💄',
    description: 'Um registro espontâneo super calmo tirado pelo espelho do camarim.',
    coinPrice: 20,
    imageUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=850&auto=format&fit=crop&q=80',
    isApproved: false // Awaiting approval!
  },

  // Photos of Juliana
  {
    id: 'photo-j-1',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    title: 'Fotografia Profissional Ensaios Externos 📸',
    description: 'Ensaio fotográfico elegante feito no Parque Augusta ao pôr-do-sol.',
    coinPrice: 30,
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722553e1?w=850&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'photo-j-2',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    title: 'Selfie de Bastidores Exclusiva 🤫',
    description: 'Bastidores super descontraídos antes de iniciar a grande transmissão de ontem!',
    coinPrice: 15,
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=850&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'photo-j-3',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    title: 'Look Festa de Sábado Noite de Gala ✨',
    description: 'Amei esse vestido e decidi compartilhar todos os detalhes com vocês! Acesso temporário.',
    coinPrice: 40,
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=850&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'photo-j-4',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    title: 'Preparação para Ensaio em Estúdio 💄',
    description: 'Um registro espontâneo super calmo tirado pelo espelho do camarim.',
    coinPrice: 20,
    imageUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=850&auto=format&fit=crop&q=80',
    isApproved: false // Awaiting approval!
  }
];

export const INITIAL_LIVES: LiveStream[] = [
  {
    id: 'live-juliana',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'Sextando Conversas e Muitas Risadas! 🥂💕',
    description: 'Vem bater um papo descontraído sobre a semana, responder perguntas e interagir com vocês!',
    isPrivate: false,
    entryPrice: 0,
    viewersCount: 142,
    likesCount: 385,
    isLive: true,
    streamStartedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 mins ago
  }
];

export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'withdraw-1',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    fullName: 'Juliana Bella Souza',
    pixKey: 'juliana.bella@gmail.com',
    pixType: 'EMAIL',
    amountCoins: 1000,
    amountBRL: 100.00,
    status: 'PAID',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
  },
  {
    id: 'withdraw-2',
    hostId: 'host-juliana',
    hostName: 'juliana_bella',
    fullName: 'Juliana Bella Souza',
    pixKey: 'juliana.bella@gmail.com',
    pixType: 'EMAIL',
    amountCoins: 1000,
    amountBRL: 100.00,
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  }
];

export const INITIAL_FINANCIAL_MOVEMENTS: FinancialMovement[] = [];

export const INITIAL_ADMIN_LOGS: AdminActionLog[] = [
  {
    id: 'log-1',
    adminId: 'user-superadmin',
    adminName: 'superadmin_julio',
    action: 'Criou pacotes de moedas e configurou WhatsApp comercial.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-3',
    adminId: 'user-superadmin',
    adminName: 'superadmin_julio',
    action: 'Marcou saque #withdraw-1 como pago no valor de R$100.00 para Juliana Bella Souza.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_ACTIVITIES: UserActivityLog[] = [
  {
    id: 'act-3',
    userId: 'host-juliana',
    activityType: 'START_STREAM',
    description: 'Iniciou a transmissão ao vivo "Sextando Conversas e Muitas Risadas!".',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  }
];

export const INITIAL_NOTIFICATIONS: UserNotification[] = [
  {
    id: 'notif-1',
    userId: 'host-juliana',
    title: 'Solicitação de Saque',
    message: 'Seu saque de 1000 moedas (R$100,00) foi enviado para análise.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: false
  }
];
