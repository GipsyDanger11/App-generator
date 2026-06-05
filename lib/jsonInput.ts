// Helpers for writing JSON columns in Prisma.
import { Prisma } from '@prisma/client';

export function jsonInput(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}
