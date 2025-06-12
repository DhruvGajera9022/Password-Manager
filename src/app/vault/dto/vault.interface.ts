export interface IVaultData {
  _id: string;
  userId: string;
  siteName: string;
  username: string;
  encryptedPassword: string;
  email?: string;
  phone?: string;
  notes?: string;
  favorite?: boolean;
  url?: string;
  tags?: string[];
  category?: string;
  avatarUrl?: string;
  lastUsedAt?: Date;
}
