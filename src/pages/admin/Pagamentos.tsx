import { useEffect, useMemo, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import {
  currentPaymentReference,
  formatPaymentReference,
  paymentStatus,
  paymentStatusLabel,
  previousPaymentReference,
  type PaymentStatus,
} from '@/lib/paymentStatus';
import { parabaService } from '@/lib/parabaService';
import type { Aluno } from '@/lib/types';

type StatusFilter = 'todos' | PaymentStatus;

function normalizePaymentDay(value: string): string {
  return value.replace(/\D/g, '').slice(0, 2);
}

function isValidPaymentDay(value: string): boolean {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

export function AdminPagamentosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'current' | 'lastUnpaid'>('current');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dayDrafts, setDayDrafts] = useState<Record<string, string>>({});

  const reference =
    viewMode === 'lastUnpaid' ? previousPaymentReference() : currentPaymentReference();

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setAlunos(await parabaService.listarAlunos());
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => {
    const active = alunos.filter((aluno) => aluno.ativo !== false);
    const base =
      viewMode === 'lastUnpaid'
        ? active.filter((aluno) => {
            const status = paymentStatus(aluno, reference);
            return status === 'atrasado' || status === 'venceHoje' || status === 'aguardando';
          })
        : active;

    const q = search.trim().toLowerCase();
    return base
      .filter((aluno) => {
        const status = paymentStatus(aluno, reference);
        if (statusFilter !== 'todos' && status !== statusFilter) return false;
        if (!q) return true;
        return (
          aluno.nome.toLowerCase().includes(q) || (aluno.apelido ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [alunos, reference, search, statusFilter, viewMode]);

  const dayValueFor = (aluno: Aluno) =>
    dayDrafts[aluno.id] ?? normalizePaymentDay(String(aluno.dataPagamento ?? ''));

  const applyUpdatedAluno = (updated: Aluno) => {
    setAlunos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setDayDrafts((prev) => {
      const next = { ...prev };
      delete next[updated.id];
      return next;
    });
  };

  const togglePago = async (aluno: Aluno) => {
    const status = paymentStatus(aluno, reference);
    const paid = status === 'pago';
    const dataPagamento = dayValueFor(aluno).trim();

    if (!paid) {
      if (!dataPagamento) {
        setError('Informe o dia de pagamento (1 a 31) antes de marcar como pago.');
        return;
      }
      if (!isValidPaymentDay(dataPagamento)) {
        setError('Informe o dia de pagamento entre 1 e 31.');
        return;
      }
    }

    try {
      setError('');
      setBusyId(aluno.id);
      const updated = await parabaService.atualizarStatusPagamento({
        alunoId: aluno.id,
        pago: !paid,
        referencia: reference,
        ...(!paid && dataPagamento ? { dataPagamento } : {}),
      });
      applyUpdatedAluno(updated);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const savePaymentDay = async (aluno: Aluno) => {
    const dataPagamento = dayValueFor(aluno).trim();
    const current = normalizePaymentDay(String(aluno.dataPagamento ?? ''));
    if (dataPagamento === current) return;

    if (!dataPagamento || !isValidPaymentDay(dataPagamento)) {
      setError('Informe o dia de pagamento entre 1 e 31.');
      setDayDrafts((prev) => ({ ...prev, [aluno.id]: current }));
      return;
    }

    try {
      setError('');
      setBusyId(aluno.id);
      const updated = await parabaService.atualizarDataPagamento({
        alunoId: aluno.id,
        dataPagamento,
      });
      applyUpdatedAluno(updated);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Pagamentos</h1>
          <p>{formatPaymentReference(reference)}</p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="card stack">
        <div className="row">
          <button
            type="button"
            className={`chip ${viewMode === 'current' ? 'active' : ''}`}
            onClick={() => setViewMode('current')}
          >
            Mês atual
          </button>
          <button
            type="button"
            className={`chip ${viewMode === 'lastUnpaid' ? 'active' : ''}`}
            onClick={() => setViewMode('lastUnpaid')}
          >
            Em aberto / atraso
          </button>
        </div>
        <input
          className="input"
          placeholder="Buscar aluno"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="row">
          {(['todos', 'pago', 'atrasado', 'venceHoje', 'aguardando'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              className={`chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'todos' ? 'Todos' : paymentStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? <p className="muted">Carregando...</p> : null}
        {!loading && visible.length === 0 ? <p className="empty">Nenhum aluno nesta visão.</p> : null}
        {visible.length > 0 ? (
          <table className="data">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Dia</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((aluno) => {
                const status = paymentStatus(aluno, reference);
                const dayValue = dayValueFor(aluno);
                return (
                  <tr key={aluno.id}>
                    <td>
                      <strong>{aluno.nome}</strong>
                      {aluno.apelido ? <div className="muted">{aluno.apelido}</div> : null}
                    </td>
                    <td style={{ width: 120 }}>
                      <input
                        className="input"
                        inputMode="numeric"
                        placeholder="Dia"
                        aria-label={`Dia de pagamento de ${aluno.nome}`}
                        value={dayValue}
                        disabled={busyId === aluno.id}
                        onChange={(e) =>
                          setDayDrafts((prev) => ({
                            ...prev,
                            [aluno.id]: normalizePaymentDay(e.target.value),
                          }))
                        }
                        onBlur={() => void savePaymentDay(aluno)}
                        style={{ maxWidth: 88, minHeight: 40, padding: '8px 10px' }}
                      />
                    </td>
                    <td>{paymentStatusLabel(status)}</td>
                    <td>
                      <button
                        type="button"
                        className={`btn ${status === 'pago' ? 'btn-secondary' : 'btn-primary'}`}
                        disabled={busyId === aluno.id}
                        onClick={() => void togglePago(aluno)}
                      >
                        {status === 'pago' ? 'Desmarcar pago' : 'Marcar pago'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
