import { useEffect, useMemo, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { todayIso } from '@/lib/formatters';
import { parabaService } from '@/lib/parabaService';
import { getStudentCategoryByBirthDate } from '@/lib/studentCategories';
import type { PresencaAulaDoDia, PresencaDiaAluno } from '@/lib/types';

function alunoMatchesAula(aluno: PresencaDiaAluno, aula: PresencaAulaDoDia): boolean {
  const tipoId = aula.tipoAula?.id;
  if (tipoId) {
    const ids = aluno.tiposAulaIds ?? aluno.tiposAula?.map((tipo) => tipo.id) ?? [];
    if (!ids.includes(tipoId)) return false;
  }

  if (!aula.categorias?.length) return true;
  const category = getStudentCategoryByBirthDate(aluno.dataNascimento);
  if (!category) return false;
  return aula.categorias.includes(category.id);
}

export function AdminPresencasPage() {
  const [date, setDate] = useState(todayIso());
  const [aulas, setAulas] = useState<PresencaAulaDoDia[]>([]);
  const [allAlunos, setAllAlunos] = useState<PresencaDiaAluno[]>([]);
  const [selectedAulaId, setSelectedAulaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const selectedAula = useMemo(
    () => aulas.find((aula) => aula.aulaId === selectedAulaId) ?? null,
    [aulas, selectedAulaId]
  );

  const alunos = useMemo(() => {
    if (!selectedAula) return [];
    return allAlunos
      .filter((aluno) => alunoMatchesAula(aluno, selectedAula))
      .map((aluno) => ({
        ...aluno,
        presente: aluno.presentePorAula?.[selectedAula.aulaId] ?? false,
      }));
  }, [allAlunos, selectedAula]);

  const presentes = alunos.filter((a) => a.presente).length;

  const load = async (dataPresenca: string) => {
    try {
      setLoading(true);
      setError('');
      const result = await parabaService.listarPresencas(dataPresenca);
      setAulas(result.aulas);
      setSelectedAulaId((current) => {
        if (current && result.aulas.some((aula) => aula.aulaId === current)) return current;
        return result.aulaSelecionada?.aulaId ?? result.aulas[0]?.aulaId ?? null;
      });
      setAllAlunos(result.alunos);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(date);
  }, [date]);

  const toggle = async (alunoId: string) => {
    if (!selectedAulaId) return;
    try {
      setBusyId(alunoId);
      const result = await parabaService.alternarPresenca(date, selectedAulaId, alunoId);
      setAllAlunos((previous) =>
        previous.map((aluno) => {
          if (aluno.id !== alunoId) return aluno;
          return {
            ...aluno,
            ...result.aluno,
            presentePorAula: {
              ...(aluno.presentePorAula ?? {}),
              [selectedAulaId]: result.aluno.presente,
            },
          };
        })
      );
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
          <h1>Lista de presença</h1>
          <p>Escolha o dia e a aula para marcar presença.</p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="card stack">
        <label className="label">Dia da aula</label>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label className="label">Aulas do dia</label>
        {aulas.length === 0 ? <p className="muted">Nenhuma aula neste dia.</p> : null}
        <div className="row">
          {aulas.map((aula) => (
            <button
              key={aula.aulaId}
              type="button"
              className={`chip ${selectedAulaId === aula.aulaId ? 'active' : ''}`}
              onClick={() => setSelectedAulaId(aula.aulaId)}
            >
              {aula.hora} · {aula.tipoAula.nome}
            </button>
          ))}
        </div>
        {selectedAula ? (
          <p className="muted">
            {presentes} de {alunos.length} presentes
          </p>
        ) : null}
      </div>

      {loading ? <p className="muted">Carregando...</p> : null}

      <div className="card table-wrap">
        {!loading && selectedAula && alunos.length === 0 ? (
          <p className="empty">Nenhum aluno nesta categoria.</p>
        ) : null}
        {alunos.length > 0 ? (
          <table className="data">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td>
                    <strong>
                      {aluno.apelido ? `${aluno.nome} (${aluno.apelido})` : aluno.nome}
                    </strong>
                  </td>
                  <td style={{ color: aluno.presente ? 'var(--secondary)' : 'var(--text-muted)', fontWeight: 700 }}>
                    {aluno.presente ? 'Presente' : 'Ausente'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`btn ${aluno.presente ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={busyId === aluno.id}
                      onClick={() => void toggle(aluno.id)}
                    >
                      {aluno.presente ? 'Desmarcar' : 'Marcar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
