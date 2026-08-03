import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class WriteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (READ_ONLY_METHODS.has(request.method)) return true;
    if (request.user?.papel === 'VISUALIZADOR') {
      throw new ForbiddenException('Seu acesso é somente leitura');
    }
    return true;
  }
}
