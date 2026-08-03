import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { parabaService } from '@/lib/parabaService';
import { isProfessor } from '@/lib/session';
import type { AulaCalendarioMes, AulaCategoria, AulaRecorrencia, TipoAula } from '@/lib/types';

const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CATEGORIES: { id: AulaCategoria; label: string }[] = [
  { id: 'kids', label: 'Kids' },
  { id: 'juvenil', label: 'Juvenil' },
  { id: 'adulto', label: 'Adulto' },
];

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function AdminCalendarioPage() {
  const { user } = useAuth();
  const professor = isProfessor(user);
  const [mes, setMes] = useState(currentMonth());
  const [aulas, setAulas] = useState<AulaCalendarioMes[]>([]);
  const [tipos, setTipos] = useState<TipoAula[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tipoAulaId: '',
    novoTipoAula: '',
    recorrencia: 'recorrente' as AulaRecorrencia,
    diasSemana: [] as number[],
    data: '',
    hora: '19:00',
    categorias: ['kids', 'juvenil', 'adulto'] as AulaCategoria[],
  });

  const load = async () => {
    try {
      setLoading(true);
      const [calendar, tiposAula] = await Promise.all([
        parabaService.listarCalendarioMes(mes),
        professor ? parabaService.listarTiposAula() : Promise.resolve([] as TipoAula[]),
      ]);
      setAulas(calendar.aulas ?? []);
      setTipos(tiposAula);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [mes, professor]);

  const sorted = useMemo(
    () => [...aulas].sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora)),
    [aulas]
  );

  const toggleDia = (day: number) => {
    setForm((previous) => ({
      ...previous,
      diasSemana: previous.diasSemana.includes(day)
        ? previous.diasSemana.filter((item) => item !== day)
        : [...previous.diasSemana, day].sort(),
    }));
  };

  const toggleCategoria = (categoria: AulaCategoria) => {
    setForm((previous) => ({
      ...previous,
      categorias: previous.categorias.includes(categoria)
        ? previous.categorias.filter((item) => item !== categoria)
        : [...previous.categorias, categoria],
    }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.tipoAulaId && !form.novoTipoAula.trim()) {
      setError('Informe o tipo de aula.');
      return;
    }
    if (form.recorrencia === 'recorrente' && form.diasSemana.length === 0) {
      setError('Selecione ao menos um dia da semana.');
      return;
    }
    if (form.recorrencia === 'avulsa' && !form.data) {
      setError('Informe a data da aula avulsa.');
      return;
    }
    if (form.categorias.length === 0) {
      setError('Selecione ao menos uma categoria.');
      return;
    }

    try {
      setSaving(true);
      await parabaService.cadastrarAulaCalendario({
        tipoAulaId: form.tipoAulaId || undefined,
        novoTipoAula: form.novoTipoAula.trim() || undefined,
        recorrencia: form.recorrencia,
        diasSemana: form.recorrencia === 'recorrente' ? form.diasSemana : undefined,
        data: form.recorrencia === 'avulsa' ? form.data : undefined,
        hora: form.hora,
        categorias: form.categorias,
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Calendário</h1>
          <p>{professor ? 'Aulas do mês e cadastro de treinos.' : 'Aulas do mês — visualização.'}</p>
        </div>
        {professor ? (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Fechar formulário' : 'Nova aula'}
          </button>
        ) : null}
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="card row">
        <label className="label" style={{ margin: 0 }}>
          Mês
        </label>
        <input className="input" style={{ maxWidth: 220 }} type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
      </div>

      {professor && showForm ? (
        <form className="card stack" onSubmit={onSubmit}>
          <h2 style={{ margin: 0 }}>Nova aula</h2>
          <div>
            <label className="label">Tipo existente</label>
            <select
              className="input"
              value={form.tipoAulaId}
              onChange={(e) => setForm((p) => ({ ...p, tipoAulaId: e.target.value, novoTipoAula: '' }))}
            >
              <option value="">Selecione...</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Ou novo tipo</label>
            <input
              className="input"
              value={form.novoTipoAula}
              onChange={(e) => setForm((p) => ({ ...p, novoTipoAula: e.target.value, tipoAulaId: '' }))}
              placeholder="Ex.: Kids / No-Gi"
            />
          </div>
          <div className="row">
            <button
              type="button"
              className={`chip ${form.recorrencia === 'recorrente' ? 'active' : ''}`}
              onClick={() => setForm((p) => ({ ...p, recorrencia: 'recorrente' }))}
            >
              Recorrente
            </button>
            <button
              type="button"
              className={`chip ${form.recorrencia === 'avulsa' ? 'active' : ''}`}
              onClick={() => setForm((p) => ({ ...p, recorrencia: 'avulsa' }))}
            >
              Avulsa
            </button>
          </div>
          {form.recorrencia === 'recorrente' ? (
            <div className="row">
              {WEEK_LABELS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`chip ${form.diasSemana.includes(index) ? 'active' : ''}`}
                  onClick={() => toggleDia(index)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <input
              className="input"
              type="date"
              value={form.data}
              onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
            />
          )}
          <div>
            <label className="label">Horário</label>
            <input
              className="input"
              type="time"
              value={form.hora}
              onChange={(e) => setForm((p) => ({ ...p, hora: e.target.value }))}
              required
            />
          </div>
          <div className="row">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`chip ${form.categorias.includes(category.id) ? 'active' : ''}`}
                onClick={() => toggleCategoria(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar aula'}
          </button>
        </form>
      ) : null}

      <div className="card table-wrap">
        {loading ? <p className="muted">Carregando...</p> : null}
        {!loading && sorted.length === 0 ? <p className="empty">Nenhuma aula neste mês.</p> : null}
        {sorted.length > 0 ? (
          <table className="data">
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Categorias</th>
                {professor ? <th>Presentes</th> : null}
              </tr>
            </thead>
            <tbody>
              {sorted.map((aula) => (
                <tr key={`${aula.id}-${aula.data}-${aula.hora}`}>
                  <td>{aula.data.split('-').reverse().join('/')}</td>
                  <td>{aula.hora}</td>
                  <td>{aula.tipoAulaNome}</td>
                  <td>{aula.categorias?.join(', ') || 'Todas'}</td>
                  {professor ? <td>{aula.totalPresentes ?? 0}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
