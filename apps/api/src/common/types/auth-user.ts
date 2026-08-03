import { Papel, StatusUsuario } from '@prisma/client';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  papel: Papel;
  status: StatusUsuario;
  criadoEm: Date;
}
