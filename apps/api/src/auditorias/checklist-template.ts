// Modelo do checklist de auditoria, extraído do plano de manutenção oficial
// (PLA-SGI-002 — Plano de Manutenção e Controle Torezani, Embarcações e Motores).
// Mesma lista para qualquer embarcação da frota — escalável por design: adicionar um
// barco novo não exige tocar neste arquivo.

export interface ChecklistTemplateItem {
  categoria: string;
  descricao: string;
  ordem: number;
}

export const CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  { categoria: 'Diário', descricao: 'Verificação dos níveis de óleo diesel', ordem: 0 },
  { categoria: 'Diário', descricao: 'Verificação do nível de óleo lubrificante do motor', ordem: 1 },
  { categoria: 'Diário', descricao: 'Verificação do nível de óleo lubrificante do reversor', ordem: 2 },
  { categoria: 'Diário', descricao: 'Verificação do estado e tensão das correias', ordem: 3 },
  { categoria: 'Diário', descricao: 'Verificação da existência de algum vazamento de óleo do motor', ordem: 4 },
  { categoria: 'Diário', descricao: 'Verificação do torque dos parafusos do flange do hélice', ordem: 5 },
  { categoria: 'Diário', descricao: 'Verificação de possíveis vazamentos de óleo lubrificante, água ou combustível', ordem: 6 },
  { categoria: '100 horas', descricao: 'Troca de óleo lubrificante do motor', ordem: 7 },
  { categoria: '100 horas', descricao: 'Troca de filtro lubrificante', ordem: 8 },
  { categoria: '100 horas', descricao: 'Troca do filtro de combustível', ordem: 9 },
  { categoria: '100 horas', descricao: 'Troca do pré-filtro de combustível', ordem: 10 },
  { categoria: '200 horas', descricao: 'Verificação e regulagem de válvulas', ordem: 11 },
  {
    categoria: '200 horas',
    descricao: 'Verificação de ruídos provenientes de rolamentos com desgaste, ou caso ocorra antes, executar manutenção',
    ordem: 12,
  },
  { categoria: '200 horas', descricao: 'Verificação do torque dos parafusos dos suportes do motor', ordem: 13 },
  { categoria: '720 horas', descricao: 'Troca de óleo lubrificante da caixa reversora', ordem: 14 },
  { categoria: '2160 horas', descricao: 'Verificação do sistema de injeção de combustível', ordem: 15 },
];
