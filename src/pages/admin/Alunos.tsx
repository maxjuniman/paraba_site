import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { isoToBrDate } from '@/lib/formatters';
import { parabaService } from '@/lib/parabaService';
import { getStudentCategoryByBirthDate, STUDENT_CATEGORY_FILTERS, type StudentCategoryId } from '@/lib/studentCategories';
import type { Aluno } from '@/lib/types';

export function AdminAlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StudentCategoryId>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setAlunos(await parabaService.listarAlunos());
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeCount = useMemo(() => alunos.filter((a) => a.ativo !== false).length, [alunos]);

  const filtered = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();
    return alunos
      .filter((aluno) => {
        const matchesName =
          !q ||
          aluno.nome.toLowerCase().includes(q) ||
          (aluno.apelido ?? '').toLowerCase().includes(q);
        const category = getStudentCategoryByBirthDate(aluno.dataNascimento);
        const matchesCategory = categoryFilter === 'all' || category?.id === categoryFilter;
        return matchesName && matchesCategory;
      })
      .sort((a, b) => {
        const aActive = a.ativo !== false ? 0 : 1;
        const bActive = b.ativo !== false ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }, [alunos, categoryFilter, nameFilter]);

  const toggleAtivo = async (aluno: Aluno) => {
    const next = aluno.ativo === false;
    const ok = window.confirm(
      next
        ? `Reativar ${aluno.nome}?`
        : `Desativar ${aluno.nome}? O aluno perde acesso ao app.`
    );
    if (!ok) return;
    try {
      setBusyId(aluno.id);
      const updated = await parabaService.atualizarStatusAluno(aluno.id, next);
      setAlunos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
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
          <h1>Alunos</h1>
          <p>
            {activeCount} ativo{activeCount === 1 ? '' : 's'}
            {alunos.length !== activeCount ? ` · ${alunos.length} no total` : ''}
          </p>
        </div>
        <Link className="btn btn-primary" to="/admin/alunos/novo">
          + Novo aluno
        </Link>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="card stack">
        <input
          className="input"
          placeholder="Filtrar por nome ou apelido"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
        <div className="row">
          {STUDENT_CATEGORY_FILTERS.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`chip ${categoryFilter === category.id ? 'active' : ''}`}
              onClick={() => setCategoryFilter(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? <p className="muted">Carregando...</p> : null}
        {!loading && filtered.length === 0 ? <p className="empty">Nenhum aluno encontrado.</p> : null}
        {filtered.length > 0 ? (
          <table className="data">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Categoria</th>
                <th>Celular</th>
                <th>Status</th>
                <th>App</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((aluno) => {
                const category = getStudentCategoryByBirthDate(aluno.dataNascimento);
                const active = aluno.ativo !== false;
                return (
                  <tr key={aluno.id} style={{ opacity: active ? 1 : 0.65 }}>
                    <td>
                      <strong>{aluno.nome}</strong>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {aluno.apelido ? `${aluno.apelido} · ` : ''}
                        Nasc. {isoToBrDate(aluno.dataNascimento) || '—'}
                        {aluno.nomeResponsavel ? ` · Resp. ${aluno.nomeResponsavel}` : ''}
                      </div>
                    </td>
                    <td>{category?.label ?? '—'}</td>
                    <td>{aluno.celular || '—'}</td>
                    <td>{active ? 'Ativo' : 'Inativo'}</td>
                    <td>{aluno.userId ? 'Vinculado' : 'Sem usuário'}</td>
                    <td>
                      <div className="row">
                        <Link className="btn btn-secondary" to={`/admin/alunos/${aluno.id}`}>
                          Editar
                        </Link>
                        <button
                          type="button"
                          className={`btn ${active ? 'btn-danger' : 'btn-primary'}`}
                          disabled={busyId === aluno.id}
                          onClick={() => void toggleAtivo(aluno)}
                        >
                          {active ? 'Desativar' : 'Reativar'}
                        </button>
                      </div>
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
