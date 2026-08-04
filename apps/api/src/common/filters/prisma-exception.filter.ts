import { ArgumentsHost, BadRequestException, Catch, ConflictException, ExceptionFilter, HttpException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaExceptionFilter');

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = this.toHttpException(exception);
    if (!(mapped instanceof HttpException)) {
      this.logger.error(`Erro Prisma não mapeado (${exception.code}): ${exception.message}`);
    }
    const status = mapped instanceof HttpException ? mapped.getStatus() : 500;
    const body = mapped instanceof HttpException ? mapped.getResponse() : { statusCode: 500, message: 'Internal server error' };
    response.status(status).json(body);
  }

  private toHttpException(exception: Prisma.PrismaClientKnownRequestError): HttpException {
    const campo = Array.isArray(exception.meta?.target) ? exception.meta.target.join(', ') : exception.meta?.column_name;

    switch (exception.code) {
      case 'P2000':
        return new BadRequestException(`Valor informado é muito longo${campo ? ` para o campo "${campo}"` : ''}.`);
      case 'P2002':
        return new ConflictException(`Já existe um registro com este valor${campo ? ` (${campo})` : ''}.`);
      case 'P2003':
        return new BadRequestException('Referência inválida: o registro relacionado não existe.');
      case 'P2025':
        return new NotFoundException('Registro não encontrado.');
      default:
        return new HttpException('Internal server error', 500);
    }
  }
}
