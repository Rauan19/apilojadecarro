/**
 * Validação de CPF/CNPJ pelo dígito verificador.
 *
 * Usado antes de mandar o documento pro Mercado Pago: número com DV errado
 * volta como "Invalid user identification number" (código 2067), e o erro
 * chega no dono da loja sem dizer o que fazer.
 */

/** Só os dígitos, sem pontos, barras ou traços. */
export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function isValidCpf(value: string | null | undefined): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11) return false;
  // 111.111.111-11 e afins passam na conta do DV, mas não são válidos.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map(Number);

  for (let position = 9; position < 11; position += 1) {
    let sum = 0;
    for (let index = 0; index < position; index += 1) {
      sum += digits[index] * (position + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    const expected = remainder === 10 ? 0 : remainder;
    if (expected !== digits[position]) return false;
  }

  return true;
}

export function isValidCnpj(value: string | null | undefined): boolean {
  const cnpj = onlyDigits(value);

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const digits = cnpj.split('').map(Number);

  const checkDigit = (length: number): number => {
    let weight = length - 7;
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += digits[index] * weight;
      weight -= 1;
      if (weight < 2) weight = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return checkDigit(12) === digits[12] && checkDigit(13) === digits[13];
}

/** Aceita CPF (11 dígitos) ou CNPJ (14), ambos com DV correto. */
export function isValidCpfOrCnpj(value: string | null | undefined): boolean {
  const digits = onlyDigits(value);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}
