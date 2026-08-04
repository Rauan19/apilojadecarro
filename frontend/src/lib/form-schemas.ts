import { z } from "zod";
import {
  isValidCep,
  isValidDocument,
  isValidPhone,
  isValidState,
  isValidWebsite,
  onlyDigits,
} from "@/lib/masks";

/** Campo opcional: vazio passa; preenchido precisa validar */
const emptyOr = (check: (v: string) => boolean, message: string) =>
  z
    .string()
    .optional()
    .refine((v) => !v || !v.trim() || check(v), { message });

export const optionalPhoneSchema = emptyOr(isValidPhone, "Telefone inválido. Use (11) 99999-9999");
export const requiredPhoneSchema = z
  .string()
  .min(1, "Informe o telefone")
  .refine(isValidPhone, "Telefone inválido. Use (11) 99999-9999");

export const optionalEmailSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || z.string().email().safeParse(v).success, {
    message: "E-mail inválido",
  });

export const requiredEmailSchema = z.string().min(1, "Informe o e-mail").email("E-mail inválido");

export const optionalDocumentSchema = emptyOr(
  isValidDocument,
  "CPF/CNPJ inválido. Use 000.000.000-00 ou 00.000.000/0000-00"
);

export const optionalCepSchema = emptyOr(isValidCep, "CEP inválido. Use 00000-000");

export const optionalStateSchema = emptyOr(isValidState, "UF inválida. Ex: SP");

/** Placa livre no cadastro: opcional, sem bloquear o salvamento */
export const optionalPlateSchema = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim().toUpperCase() : ""));

export const optionalWebsiteSchema = emptyOr(
  isValidWebsite,
  "Website inválido. Ex: https://loja.com.br"
);

export const optionalRenavamSchema = z
  .string()
  .optional()
  .refine((v) => !v || !v.trim() || onlyDigits(v).length === 11, {
    message: "RENAVAM deve ter 11 dígitos",
  });
