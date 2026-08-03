import { Prisma } from '@prisma/client';

/** Converte Decimal do Prisma (ou null) para number puro, para a API sempre devolver JSON numérico. */
export function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}
