export type PaymentStatus = 'pago' | 'atrasado' | 'venceHoje' | 'aguardando' | 'semDia' | 'naoIniciado';

export type PaymentAluno = {
  dataPagamento?: string | number | null;
  pagamentoPago?: boolean | null;
  pagamentoReferencia?: string | null;
  pagamentosPagos?: string[] | null;
  cadastroAppAt?: string | null;
  createdAt?: string;
};

export function normalizePaymentDay(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 31) return String(value);
  const text = String(value).trim();
  if (/^\d{1,2}$/.test(text)) {
    const day = Number(text);
    return day >= 1 && day <= 31 ? String(day) : null;
  }
  const isoMatch = text.match(/^\d{4}-\d{2}-(\d{2})/);
  if (isoMatch) {
    const day = Number(isoMatch[1]);
    return day >= 1 && day <= 31 ? String(day) : null;
  }
  return null;
}

export function currentPaymentReference(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function previousPaymentReference(date = new Date()): string {
  const previous = new Date(date);
  previous.setMonth(previous.getMonth() - 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
}

export function formatPaymentReference(reference: string): string {
  const [year, month] = reference.split('-');
  if (!year || !month) return reference;
  const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isPaidForReference(aluno: PaymentAluno, reference: string): boolean {
  return (
    Boolean(aluno.pagamentosPagos?.includes(reference)) ||
    (aluno.pagamentoPago === true && aluno.pagamentoReferencia === reference)
  );
}

function resolvePaymentDayInMonth(day: number, year: number, monthIndex: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

export function paymentStatus(aluno: PaymentAluno, reference: string, now = new Date()): PaymentStatus {
  const day = Number(normalizePaymentDay(aluno.dataPagamento));
  if (!Number.isInteger(day) || day < 1 || day > 31) return 'semDia';

  if (isPaidForReference(aluno, reference)) return 'pago';

  const [year, month] = reference.split('-').map(Number);
  if (!year || !month) return 'semDia';

  const due = resolvePaymentDayInMonth(day, year, month - 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueDay.getTime() === today.getTime()) return 'venceHoje';
  if (dueDay.getTime() < today.getTime()) return 'atrasado';
  return 'aguardando';
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'pago':
      return 'Pago';
    case 'atrasado':
      return 'Atrasado';
    case 'venceHoje':
      return 'Vence hoje';
    case 'aguardando':
      return 'Aguardando';
    case 'naoIniciado':
      return 'Nao iniciado';
    default:
      return 'Sem dia';
  }
}
