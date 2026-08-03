import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { parabaService } from '@/lib/parabaService';
import type { Aluno, PendingUser } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

type Birthday = { id: string; nome: string; dia: number; idade: number };

function monthlyBirthdays(alunos: Aluno[]): Birthday[] {
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
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [pendentes, list] = await Promise.all([
          parabaService.listarUsuariosPendentes(),
          parabaService.listarAlunos(),
        ]);
        setPending(pendentes);
        setAlunos(list.filter((aluno) => aluno.ativo !== false));
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const birthdays = useMemo(() => monthlyBirthdays(alunos), [alunos]);
  const activeCount = alunos.length;

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Olá, {user?.nome?.split(' ')[0] ?? 'Professor'}</h1>
          <p>Painel web da Equipe Paraba — mesmo backend do aplicativo.</p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="muted">Carregando...</p> : null}

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
