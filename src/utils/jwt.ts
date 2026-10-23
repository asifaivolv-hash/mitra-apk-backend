import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'mitra_super_secure_access_secret_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'mitra_super_secure_refresh_secret_2026';

export type SupportedRole =
  | 'member'
  | 'resident'
  | 'community_manager'
  | 'manager'
  | 'committee'
  | 'admin'
  | 'central_admin'
  | 'superadmin';

export interface TokenPayload {
  userId: string;
  email: string;
  role: SupportedRole;
  name: string;
  communityId?: string;
  assignedCommunities?: string[];
  unit?: {
    block: string;
    flat: string;
  };
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1d' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};
