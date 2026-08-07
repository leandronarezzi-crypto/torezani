import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GRAVACAO_PESSOAL_KEY } from '../decorators/gravacao-pessoal.decorator';

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class WriteGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (READ_ONLY_METHODS.has(request.method)) return true;
    if (request.user?.papel !== 'VISUALIZADOR') return true;

    const gravacaoPessoal = this.reflector.getAllAndOverride<boolean>(GRAVACAO_PESSOAL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (gravacaoPessoal) return true;

    throw new ForbiddenException('Seu acesso é somente leitura');
  }
}
