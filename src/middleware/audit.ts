import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from './auth';

export const logAuditEvent = async (
  req: AuthenticatedRequest,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any
): Promise<void> => {
  try {
    if (!req.user) return;
    const ipAddress = (req?.headers ? (req.headers['x-forwarded-for'] as string) : '') || req?.socket?.remoteAddress || '';
    await AuditLog.create({
      adminId: req.user.userId,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action,
      resource,
      resourceId: resourceId || '',
      details: details || {},
      ipAddress,
    });
  } catch (err: any) {
    console.error('[AuditLog] Failed to log administrative event:', err.message);
  }
};
