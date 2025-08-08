import { FastifyInstance } from 'fastify';
import { JwtPayload } from '@calendar-todo/shared-types';

export class JwtService {
  constructor(private app: FastifyInstance) {}

  async sign(payload: JwtPayload): Promise<string> {
    return await this.app.jwt.sign(payload);
  }

  async verify(token: string): Promise<JwtPayload> {
    return await this.app.jwt.verify(token) as JwtPayload;
  }

  async signRefreshToken(payload: JwtPayload): Promise<string> {
    return await this.app.jwt.sign(payload, {
      expiresIn: this.app.config.JWT_REFRESH_EXPIRES_IN,
    });
  }

  async decode(token: string): Promise<JwtPayload | null> {
    try {
      return this.app.jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }
}