/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'USER' | 'HOST' | 'ADMIN' | 'SUPER_ADMIN';

export interface AdminPermissions {
  manageUsers: boolean;
  manageHosts: boolean;
  manageLives: boolean;
  manageCoins: boolean;
  manageSettings: boolean;
  manageAdmins: boolean;
}

export interface HostWallet {
  balanceAvailable: number;
  balancePending: number;
  totalReceived: number;
  totalWithdrawn: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  coinsBalance: number;
  followersCount: number;
  followingIds: string[]; // users this user is following
  isBlocked: boolean;
  isHostApproved: boolean; // false = pending request, true = approved host
  isHostRequestPending: boolean; // requested host role
  livesCount: number; // number of streams made
  permissions: AdminPermissions;
  financialWallet: HostWallet;
}

export interface PrivatePhoto {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  coinPrice: number;
  imageUrl: string;
  isApproved: boolean;
}

export interface PhotoUnlock {
  id: string;
  photoId: string;
  userId: string;
  unlockedAt: string; // ISO string
  expiresAt: string; // ISO string
}

export interface CoinPackage {
  id: string;
  name: string;
  coinsCount: number;
  priceBRL: number;
}

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  description: string;
  isPrivate: boolean;
  entryPrice: number; // in coins
  viewersCount: number;
  likesCount: number;
  isLive: boolean; // status online/offline
  streamStartedAt: string;
  streamSource?: 'WEBCAM' | 'SIMULATION';
  activeFilter?: string;
}

export interface ChatMessage {
  id: string;
  liveId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  timestamp: string; // ISO string
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  activityType: 'LOGIN' | 'FOLLOW' | 'BUY_COINS' | 'UNLOCK_PHOTO' | 'ENTER_LIVE_PRIVATE' | 'START_STREAM' | 'REQUEST_HOST' | 'PROFILE_EDIT';
  description: string;
  timestamp: string;
}

export interface WithdrawalRequest {
  id: string;
  hostId: string;
  hostName: string;
  fullName: string;
  pixKey: string;
  pixType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  amountCoins: number;
  amountBRL: number; // Converted based on coin rate or 1 coin = 0.10 BRL conversion (let's say 1 coin = R$ 0.10 or R$ 1.00 configured)
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  createdAt: string;
}

export interface FinancialMovement {
  id: string;
  transactionType: 'UNLOCK_PHOTO' | 'LIVE_ENTRY' | 'LIVE_GIFT';
  hostId: string;
  hostName: string;
  userId: string;
  userName: string;
  grossCoins: number;
  platformCutCoins: number;
  hostCutCoins: number;
  platformPercent: number;
  timestamp: string;
  isPending: boolean;
  clearanceTimestamp: string; // ISO string of when it becomes available
}

export interface AdminActionLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  timestamp: string;
}

export interface PlatformConfig {
  platformName: string;
  logoText: string;
  mainBannerUrl: string;
  whatsappUrl: string;
  maxPrivatePhotos: number;
  photoAccessHours: number;
  minPrivateLivePrice: number;
  platformFeePercent: number; // e.g. 30
  coinToBrlRate: number; // e.g. 0.1 means 10 coins = R$ 1.00
  pendingDays: number; // days before pending is cleared to available
}
