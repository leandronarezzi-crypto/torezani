export interface EntradaChangelog {
  versao: string;
  data: string;
  itens: string[];
}

export const CHANGELOG: EntradaChangelog[] = [
  {
    versao: '2.0.0',
    data: '2026-08-02',
    itens: [
      'Sistema reescrito: NestJS + Prisma na API, Next.js + Tailwind no painel.',
      'Modo escuro em todas as telas.',
      'Central de notificações com manutenções e casco/pintura vencendo.',
      'Sidebar recolhível com preferência salva no navegador.',
    ],
  },
];

export const VERSAO_ATUAL = CHANGELOG[0].versao;
