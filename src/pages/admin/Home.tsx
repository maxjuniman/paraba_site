import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import {
  currentPaymentReference,
  formatPaymentReference,
  normalizePaymentDay,
  paymentStatus,
  paymentStatusLabel,
} from '@/lib/paymentStatus';
import { parabaService } from '@/lib/parabaService';
import { isProfessor } from '@/lib/session';
import type { Aluno, EquipeAluno, MeuAluno, PendingUser } from '@/lib/types';

type Birthday = { id: string; nome: string; dia: number; idade: number };

function monthlyBirthdays(
  alunos: Array<Pick<Aluno | EquipeAluno, 'id' | 'nome' | 'apelido' | 'dataNascimento'>>
): Birthday[] {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return alunos
    .map((aluno) => {
      const [y, m, d] = (aluno.dataNascimento ?? '').split('-').map(Number);
      if (!y || !m || !d || m !== month) return null;
      return {
        id: aluno.id,
        nome: aluno.apelido || aluno.nome,
        dia: d,
        idade: year - y,
      };
    })
    .filter((item): item is Birthday => item != null)
    .sort((a, b) => a.dia - b.dia || a.nome.localeCompare(b.nome));
}

export function AdminHomePage() {
  const { user } = useAuth();
  const professor = isProfessor(user);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [pendingDepoimentos, setPendingDepoimentos] = useState(0);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [equipe, setEquipe] = useState<EquipeAluno[]>([]);
  const [meuPagamento, setMeuPagamento] = useState<MeuAluno | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError('');
        if (professor) {
          const [pendentes, list, depoimentos] = await Promise.all([
            parabaService.listarUsuariosPendentes(),
            parabaService.listarAlunos(),
            parabaService.listarDepoimentos(),
          ]);
          setPending(pendentes);
          setPendingDepoimentos(depoimentos.filter((item) => !item.ativo).length);
          setAlunos(list.filter((aluno) => aluno.ativo !== false));
          setEquipe([]);
          setMeuPagamento(null);
        } else {
          setPendingDepoimentos(0);
          const [listaEquipe, meuAluno] = await Promise.all([
            parabaService.listarEquipe(),
            parabaService.obterMeuAluno().catch(() => null),
          ]);
          setEquipe(listaEquipe);
          setMeuPagamento(meuAluno);
          setPending([]);
          setAlunos([]);
        }
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [professor]);

  const birthdays = useMemo(
    () => monthlyBirthdays(professor ? alunos : equipe),
    [professor, alunos, equipe]
  );
  const activeCount = alunos.length;
  const paymentReference = currentPaymentReference();
  const meuStatus = meuPagamento ? paymentStatus(meuPagamento, paymentReference) : null;
  const paymentDay = meuPagamento ? normalizePaymentDay(meuPagamento.dataPagamento) : null;

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Olá, {user?.nome?.split(' ')[0] ?? (professor ? 'Professor' : 'Aluno')}</h1>
          <p>
            {professor
              ? 'Painel web da Equipe Paraba — mesmo backend do aplicativo.'
              : 'Área do aluno — as mesmas informações do aplicativo.'}
          </p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="muted">Carregando...</p> : null}

      {professor && pendingDepoimentos > 0 ? (
        <Link to="/admin/depoimentos" className="warning-box" style={{ display: 'block' }}>
          {pendingDepoimentos === 1
            ? 'Há 1 depoimento aguardando aprovação.'
            : `Há ${pendingDepoimentos} depoimentos aguardando aprovação.`}{' '}
          Abrir depoimentos →
        </Link>
      ) : null}

      {professor ? (
        <div className="row" style={{ alignItems: 'stretch' }}>
          <article className="card" style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ marginTop: 0 }}>Alunos ativos</h2>
            <p style={{ fontSize: 36, fontWeight: 900, margin: '8px 0' }}>{activeCount}</p>
            <Link className="btn btn-secondary" to="/admin/alunos">
              Ver alunos
            </Link>
          </article>
          <article className="card" style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ marginTop: 0 }}>Autorizações pendentes</h2>
            <p style={{ fontSize: 36, fontWeight: 900, margin: '8px 0' }}>{pending.length}</p>
            <Link className="btn btn-secondary" to="/admin/autorizacoes">
              Abrir autorizações
            </Link>
          </article>
        </div>
      ) : (
        <article className="card stack">
          <h2 style={{ margin: 0 }}>Meu pagamento</h2>
          {meuPagamento ? (
            <>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>
                {meuStatus ? paymentStatusLabel(meuStatus) : '—'}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Referência {formatPaymentReference(paymentReference)}
                {paymentDay ? ` · dia ${paymentDay}` : ''}
              </p>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Nenhum cadastro de aluno vinculado à sua conta.
            </p>
          )}
        </article>
      )}

      <article className="card stack">
        <h2 style={{ margin: 0 }}>Aniversariantes do mês</h2>
        {birthdays.length === 0 ? (
          <p className="muted">Nenhum aniversariante neste mês.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {birthdays.map((item) => (
              <li key={item.id}>
                Dia {String(item.dia).padStart(2, '0')} · {item.nome} faz {item.idade} anos
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
