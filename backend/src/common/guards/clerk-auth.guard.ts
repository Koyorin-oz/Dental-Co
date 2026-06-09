import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import * as jwt from 'jsonwebtoken';

// Cache verified tokens in memory for their remaining TTL (avoids repeated Clerk network calls)
const tokenCache = new Map<string, { user: Record<string, unknown>; exp: number }>();

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authHeader.split(' ')[1];
    const now = Math.floor(Date.now() / 1000);

    // Serve from cache if still valid
    const cached = tokenCache.get(token);
    if (cached && cached.exp > now + 10) {
      request.user = cached.user;
      return true;
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const meta = payload as Record<string, unknown>;
      const role =
        (meta.metadata as { role?: string })?.role ??
        (meta.publicMetadata as { role?: string })?.role;

      const user = { clerkId: payload.sub, role, sessionId: payload.sid };

      // Decode exp without re-verifying — payload is already verified above
      const decoded = jwt.decode(token) as { exp?: number } | null;
      const exp = decoded?.exp ?? now + 60;
      tokenCache.set(token, { user, exp });

      // Prune expired entries when cache grows large
      if (tokenCache.size > 500) {
        for (const [k, v] of tokenCache) {
          if (v.exp <= now) tokenCache.delete(k);
        }
      }

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
