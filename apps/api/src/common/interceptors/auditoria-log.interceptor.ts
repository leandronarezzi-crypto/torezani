import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

/** Metodos que alteram dados. GET/HEAD/OPTIONS nao sao registrados. */
const METODOS_ESCRITA = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Campos que NUNCA podem ir para o log. */
const CAMPOS_SENSIVEIS = ['senha', 'senhaHash', 'senha_hash', 'password', 'token', 'accessToken'];

/** Rotas que nao geram log (ruido puro, sem valor de auditoria). */
const ROTAS_IGNORADAS = [/^\/api\/notifications\/.*\/read$/, /^\/api\/notifications\/read-all$/];

function sanitizar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(sanitizar);
  if (valor && typeof valor === 'object') {
    const saida: Record<string, unknown> = {};
    for (const [chave, item] of Object.entries(valor as Record<string, unknown>)) {
      saida[chave] = CAMPOS_SENSIVEIS.includes(chave) ? '***' : sanitizar(item);
    }
    return saida;
  }
  return valor;
}

/**
 * Extrai entidade e id a partir da rota.
 * /api/embarcacoes/12/motores -> entidade "motores", registroId null
 * /api/embarcacoes/12         -> entidade "embarcacoes", registroId "12"
 */
function extrairAlvo(rota: string): { entidade: string | null; registroId: string | null } {
  const partes = rota.replace(/^\/api\/?/, '').split('?')[0].split('/').filter(Boolean);
  let entidade: string | null = null;
  let registroId: string | null = null;
  for (const parte of partes) {
    if (/^\d+$/.test(parte)) registroId = parte;
    else {
      entidade = parte;
      registroId = null;
    }
  }
  return { entidade, registroId };
}

@Injectable()
export class AuditoriaLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    if (!METODOS_ESCRITA.has(req.method)) return next.handle();
    if (ROTAS_IGNORADAS.some((padrao) => padrao.test(req.originalUrl || req.url))) return next.handle();

    const inicio = Date.now();
    const rota: string = (req.originalUrl || req.url || '').slice(0, 300);
    const { entidade, registroId } = extrairAlvo(rota);

    const gravar = (statusCode: number, sucesso: boolean, erro?: string) => {
      const usuario = req.user;
      // Nunca deixar uma falha de log derrubar a requisicao do usuario.
      void this.prisma.logAlteracao
        .create({
          data: {
            usuarioId: usuario?.id ?? null,
            usuarioEmail: usuario?.email ?? null,
            usuarioPapel: usuario?.papel ?? null,
            metodo: req.method,
            rota,
            entidade,
            registroId,
            dados: sanitizar(req.body ?? {}) as never,
            statusCode,
            sucesso,
            erro: erro ? erro.slice(0, 500) : null,
            ip: (req.headers?.['x-forwarded-for'] || req.ip || '').toString().slice(0, 60) || null,
            duracaoMs: Date.now() - inicio,
          },
        })
        .catch((e) => console.error('[auditoria] falha ao gravar log:', e?.message));
    };

    return next.handle().pipe(
      tap({
        next: () => gravar(res.statusCode ?? 200, true),
        error: (err) => gravar(err?.status ?? 500, false, err?.message ?? String(err)),
      }),
    );
  }
}
