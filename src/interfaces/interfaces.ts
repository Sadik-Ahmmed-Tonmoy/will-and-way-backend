// ========== INTERFACES ==========
export interface User {
  _id: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  fullName?: string;
  profileImage?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'BANNED';
  logInProcess?: 'EMAIL' | 'GOOGLE' | 'APPLE';
  isVerified: boolean;
  isProfileCompleted: boolean;
  subscriptionPlan?: 'SINGLE_PACK' | 'DOUBLE_PACK' | 'FAMILY_PACK' | 'CUSTOM';
  subscriptionStatus?: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';
  subscriptionEndDate?: Date;
  vehicleLimit: number;
  fcmToken?: string;
  language: string;
  timezone: string;
  notificationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OTP {
  _id: string;
  email: string;
  code: string;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

export interface Vehicle {
  _id: string;
  userId: string;
  vehicleNumber: string;
  nickname?: string;
  type: 'CAR' | 'BIKE' | 'TRUCK' | 'OTHER';
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  bloodGroup?: 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE';
  emergencyContact?: string;
  notes?: string;
  qrSlug: string;
  qrCodeUrl: string;
  isActive: boolean;
  totalScans: number;
  successfulScans: number;
  lastScanned?: Date;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanHistory {
  _id: string;
  vehicleId: string;
  scanType: 'CALL' | 'WHATSAPP' | 'VIEW' | 'EMERGENCY';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  location?: string;
  scannedBy?: string;
  deviceInfo?: string;
  contactPhone?: string;
  contactName?: string;
  message?: string;
  duration?: number;
  notes?: string;
  scannedAt: Date;
  userId: string;
}

export interface PaymentMethod {
  _id: string;
  userId: string;
  type: 'BKASH' | 'NAGAD' | 'CARD' | 'BANK';
  provider: string;
  lastFour: string;
  expiryDate?: string;
  isDefault: boolean;
  gatewayToken?: string;
  gatewayId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  _id: string;
  userId: string;
  invoiceId: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: 'BKASH' | 'NAGAD' | 'CARD' | 'BANK';
  paymentStatus: 'COMPLETED' | 'PENDING' | 'FAILED';
  paymentGateway?: string;
  gatewayId?: string;
  plan?: 'SINGLE_PACK' | 'DOUBLE_PACK' | 'FAMILY_PACK' | 'CUSTOM';
  duration?: number;
  vehicleLimit?: number;
  metadata?: Record<string, any>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'SCAN_ALERT' | 'BILLING_REMINDER' | 'SYSTEM_UPDATE' | 'SECURITY_ALERT';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  createdAt: Date;
}

export interface Settings {
  _id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  scanAlerts: boolean;
  billingReminders: boolean;
  marketingEmails: boolean;
  profileVisibility: string;
  showVehicleDetails: boolean;
  showContactInfo: boolean;
  showScanHistory: boolean;
  dataSharing: boolean;
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  passwordHistory: number;
  theme: string;
  fontSize: string;
  density: string;
  animations: boolean;
  reduceMotion: boolean;
  autoDeleteScans: number;
  autoDeleteVehicles: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemLog {
  _id: string;
  level: string;
  message: string;
  module: string;
  userId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AppConfig {
  _id: string;
  key: string;
  value: any;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========== DTOs ==========
export interface CreateUserDTO {
  email: string;
  password?: string;
  phoneNumber?: string;
  fullName?: string;
  logInProcess?: 'EMAIL' | 'GOOGLE' | 'APPLE';
}

export interface UpdateUserDTO {
  phoneNumber?: string;
  fullName?: string;
  profileImage?: string;
  language?: string;
  timezone?: string;
}

export interface CreateVehicleDTO {
  vehicleNumber: string;
  nickname?: string;
  type: 'CAR' | 'BIKE' | 'TRUCK' | 'OTHER';
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  bloodGroup?: BloodGroup;
  emergencyContact?: string;
  notes?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
}

export interface UpdateVehicleDTO {
  nickname?: string;
  emergencyContact?: string;
  notes?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
  isActive?: boolean;
}

export interface CreateScanDTO {
  vehicleId: string;
  scanType: 'CALL' | 'WHATSAPP' | 'VIEW' | 'EMERGENCY';
  location?: string;
  scannedBy?: string;
  deviceInfo?: string;
  contactPhone?: string;
  contactName?: string;
  message?: string;
  duration?: number;
  notes?: string;
}

export interface CreatePaymentMethodDTO {
  type: 'BKASH' | 'NAGAD' | 'CARD' | 'BANK';
  provider: string;
  lastFour: string;
  expiryDate?: string;
  gatewayToken?: string;
  gatewayId?: string;
  metadata?: Record<string, any>;
}

export interface CreateTransactionDTO {
  invoiceId: string;
  description: string;
  amount: number;
  currency?: string;
  paymentMethod: 'BKASH' | 'NAGAD' | 'CARD' | 'BANK';
  paymentGateway?: string;
  gatewayId?: string;
  plan?: 'SINGLE_PACK' | 'DOUBLE_PACK' | 'FAMILY_PACK' | 'CUSTOM';
  duration?: number;
  vehicleLimit?: number;
  metadata?: Record<string, any>;
  notes?: string;
}

// ========== RESPONSES ==========
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StatsResponse {
  totalVehicles: number;
  totalScans: number;
  activeVehicles: number;
  subscriptionStatus: {
    active: number;
    expired: number;
    cancelled: number;
  };
}

// ========== ENUM TYPES ==========
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'BANNED';
export type LogInProcess = 'EMAIL' | 'GOOGLE' | 'APPLE';
export type OTPPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
export type VehicleType = 'CAR' | 'BIKE' | 'TRUCK' | 'OTHER';
export type ScanType = 'CALL' | 'WHATSAPP' | 'VIEW' | 'EMERGENCY';
export type ScanStatus = 'SUCCESS' | 'FAILED' | 'PENDING';
export type SubscriptionPlan = 'SINGLE_PACK' | 'DOUBLE_PACK' | 'FAMILY_PACK' | 'CUSTOM';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';
export type BloodGroup = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE';
export type PaymentMethodUsed = 'BKASH' | 'NAGAD' | 'CARD' | 'BANK';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';
export type NotificationType = 'SCAN_ALERT' | 'BILLING_REMINDER' | 'SYSTEM_UPDATE' | 'SECURITY_ALERT';