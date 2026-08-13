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
import type { Aluno, EquipeAluno, MeuAluno, PendingUser, TipoAula } from '@/lib/types';

type Birthday = { id: string; nome: string; dia: number; idade: number };

type ContagemTipoAula = {
  id: string;
  nome: string;
  total: number;
};

function contagemPorTipoAula(alunos: Aluno[], tipos: TipoAula[]): ContagemTipoAula[] {
  const counts = new Map<string, number>();
  for (const aluno of alunos) {
    const ids = aluno.tiposAulaIds ?? aluno.tiposAula?.map((tipo) => tipo.id) ?? [];
    const unique = [...new Set(ids)];
    if (unique.length === 0) {
      counts.set('__none__', (counts.get('__none__') ?? 0) + 1);
      continue;
    }
    for (const id of unique) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const rows: ContagemTipoAula[] = tipos
    .map((tipo) => ({
      id: tipo.id,
      nome: tipo.nome,
      total: counts.get(tipo.id) ?? 0,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'));

  const semTipo = counts.get('__none__') ?? 0;
  if (semTipo > 0) {
    rows.push({ id: '__none__', nome: 'Sem tipo', total: semTipo });
  }

  return rows;
}

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
  const [tipos, setTipos] = useState<TipoAula[]>([]);
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
          const [pendentes, list, tiposAula, depoimentos] = await Promise.all([
            parabaService.listarUsuariosPendentes(),
            parabaService.listarAlunos(),
            parabaService.listarTiposAula(),
            parabaService.listarDepoimentos(),
          ]);
          setPending(pendentes);
          setPendingDepoimentos(depoimentos.filter((item) => !item.ativo).length);
          setAlunos(list.filter((aluno) => aluno.ativo !== false));
          setTipos(tiposAula);
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
          setTipos([]);
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
  const porTipo = useMemo(() => contagemPorTipoAula(alunos, tipos), [alunos, tipos]);
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
            {porTipo.length > 0 ? (
              <ul style={{ margin: '0 0 14px', paddingLeft: 18 }}>
                {porTipo.map((item) => (
                  <li key={item.id}>
                    {item.nome}: <strong>{item.total}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ margin: '0 0 14px' }}>
                Nenhum tipo de aula cadastrado.
              </p>
            )}
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
