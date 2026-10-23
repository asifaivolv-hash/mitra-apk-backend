import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload, SupportedRole } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const normalizeRole = (role: string): string => {
  const r = (role || '').toLowerCase();
  if (r === 'superadmin' || r === 'central_admin') return 'central_admin';
  if (r === 'admin') return 'admin';
  if (r === 'community_manager' || r === 'manager') return 'community_manager';
  if (r === 'committee') return 'committee';
  return 'member';
};

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.', error: err.message });
  }
};

export const requireRoles = (roles: Array<SupportedRole | string>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const userNormalized = normalizeRole(req.user.role);
    const normalizedRequired = roles.map(r => normalizeRole(r));

    const isAuthorized = normalizedRequired.includes(userNormalized) ||
      (normalizedRequired.includes('central_admin') && userNormalized === 'central_admin') ||
      (normalizedRequired.includes('admin') && (userNormalized === 'admin' || userNormalized === 'central_admin'));

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] permissions. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

/**
 * Community Scope Guard
 * Verifies that the manager or admin has rights to the specified community ID
 */
export const requireCommunityScope = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  const role = normalizeRole(req.user.role);
  // Central Admin has global access to all communities
  if (role === 'central_admin') {
    return next();
  }

  const targetCommunityId = (req.params.communityId || req.body.communityId || req.query.communityId || req.params.id) as string;

  if (!targetCommunityId) {
    return next();
  }

  // Check if target is user's primary or assigned community
  const primaryMatch = req.user.communityId && req.user.communityId.toString() === targetCommunityId.toString();
  const assignedMatch = req.user.assignedCommunities && req.user.assignedCommunities.some(c => c.toString() === targetCommunityId.toString());

  if (!primaryMatch && !assignedMatch) {
    res.status(403).json({
      success: false,
      message: 'Access Denied: You are not authorized to view or modify records for this community.',
    });
    return;
  }

  next();
};
