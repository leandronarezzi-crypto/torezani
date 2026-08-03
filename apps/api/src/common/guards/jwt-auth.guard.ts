import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: { message?: string } | undefined,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      const message = info?.message === 'jwt expired' ? 'Sessão expirada, faça login novamente' : 'Não autenticado';
      throw err instanceof Error ? err : new UnauthorizedException(message);
    }
    return user;
  }
}
