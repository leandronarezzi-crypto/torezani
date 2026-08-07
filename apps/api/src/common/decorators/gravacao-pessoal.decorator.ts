import { SetMetadata } from '@nestjs/common';

/**
 * Marca uma rota de escrita que NÃO altera dados do cliente — apenas o estado
 * pessoal do próprio usuário (ex.: marcar notificação como lida).
 *
 * Rotas com este decorator continuam liberadas para o papel VISUALIZADOR.
 * Use com parcimônia: o padrão do WriteGuard é BLOQUEAR toda escrita.
 */
export const GRAVACAO_PESSOAL_KEY = 'gravacaoPessoal';
export const GravacaoPessoal = () => SetMetadata(GRAVACAO_PESSOAL_KEY, true);
