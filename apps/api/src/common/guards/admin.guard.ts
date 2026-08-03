import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.papel !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem acessar isto');
    }
    return true;
  }
}
