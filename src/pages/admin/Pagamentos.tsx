import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [modalAluno, setModalAluno] = useState<Aluno | null>(null);
  const [modalDay, setModalDay] = useState('');
  const [modalError, setModalError] = useState('');

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

  const closeModal = () => {
    if (busyId) return;
    setModalAluno(null);
    setModalDay('');
    setModalError('');
  };

  const openMarkPaidModal = (aluno: Aluno) => {
    setError('');
    setModalError('');
    setModalAluno(aluno);
    setModalDay(normalizePaymentDay(String(aluno.dataPagamento ?? '')));
  };

  const unmarkPaid = async (aluno: Aluno) => {
    try {
      setError('');
      setBusyId(aluno.id);
      const updated = await parabaService.atualizarStatusPagamento({
        alunoId: aluno.id,
        pago: false,
        referencia: reference,
      });
      setAlunos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmMarkPaid = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!modalAluno) return;

    const dataPagamento = modalDay.trim();
    if (!dataPagamento || !isValidPaymentDay(dataPagamento)) {
      setModalError('Informe o dia em que foi pago (1 a 31).');
      return;
    }

    try {
      setModalError('');
      setError('');
      setBusyId(modalAluno.id);
      const updated = await parabaService.atualizarStatusPagamento({
        alunoId: modalAluno.id,
        pago: true,
        referencia: reference,
        dataPagamento,
      });
      setAlunos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setModalAluno(null);
      setModalDay('');
    } catch (err) {
      setModalError(apiErrorMessage(err));
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
                return (
                  <tr key={aluno.id}>
                    <td>
                      <strong>{aluno.nome}</strong>
                      {aluno.apelido ? <div className="muted">{aluno.apelido}</div> : null}
                    </td>
                    <td>{aluno.dataPagamento ? `Dia ${aluno.dataPagamento}` : '—'}</td>
                    <td>{paymentStatusLabel(status)}</td>
                    <td>
                      <button
                        type="button"
                        className={`btn ${status === 'pago' ? 'btn-secondary' : 'btn-primary'}`}
                        disabled={busyId === aluno.id}
                        onClick={() => {
                          if (status === 'pago') {
                            void unmarkPaid(aluno);
                            return;
                          }
                          openMarkPaidModal(aluno);
                        }}
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

      {modalAluno ? (
        <div className="confirm-overlay" role="presentation" onClick={closeModal}>
          <form
            className="confirm-dialog card stack"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-day-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => void confirmMarkPaid(event)}
          >
            <img src="/logo.png" alt="Equipe Paraba" className="confirm-logo" />
            <h2 id="payment-day-title" style={{ margin: 0, textAlign: 'center' }}>
              Marcar pagamento
            </h2>
            <p className="muted" style={{ margin: 0, textAlign: 'center', lineHeight: 1.45 }}>
              Em que dia do mês <strong>{modalAluno.nome}</strong> pagou?
            </p>
            {modalError ? <div className="error-box">{modalError}</div> : null}
            <div>
              <label className="label" htmlFor="payment-day">
                Dia (1 a 31)
              </label>
              <input
                id="payment-day"
                className="input"
                inputMode="numeric"
                autoFocus
                placeholder="Ex: 10"
                value={modalDay}
                disabled={busyId === modalAluno.id}
                onChange={(e) => setModalDay(normalizePaymentDay(e.target.value))}
              />
            </div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busyId === modalAluno.id}
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busyId === modalAluno.id}
              >
                {busyId === modalAluno.id ? 'Salvando...' : 'Confirmar pagamento'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
