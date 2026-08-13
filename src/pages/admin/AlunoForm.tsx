import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { brDateToIso, formatDate, formatPhone, isValidBrazilMobile, isoToBrDate } from '@/lib/formatters';
import { parabaService } from '@/lib/parabaService';
import type { TipoAula } from '@/lib/types';

const FAIXAS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];
const GRAUS = [0, 1, 2, 3, 4];

const emptyForm = {
  nome: '',
  apelido: '',
  nomeResponsavel: '',
  emailResponsavel: '',
  celular: '',
  dataNascimento: '',
  dataPagamento: '',
  faixaAtual: '',
  graus: 0,
  tiposAulaIds: [] as string[],
};

export function AdminAlunoFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [tipos, setTipos] = useState<TipoAula[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const tiposAula = await parabaService.listarTiposAula();
        setTipos(tiposAula);

        if (!id) return;

        const alunos = await parabaService.listarAlunos();
        const aluno = alunos.find((item) => item.id === id);
        if (!aluno) {
          setError('Aluno nao encontrado.');
          return;
        }
        const raw = aluno as typeof aluno & { email_responsavel?: string | null };
        setUserEmail(aluno.user?.email ?? '');
        setForm({
          nome: aluno.nome,
          apelido: aluno.apelido ?? '',
          nomeResponsavel: aluno.nomeResponsavel ?? '',
          emailResponsavel: aluno.emailResponsavel ?? raw.email_responsavel ?? '',
          celular: aluno.celular ? formatPhone(aluno.celular) : '',
          dataNascimento: isoToBrDate(aluno.dataNascimento),
          dataPagamento: aluno.dataPagamento ?? '',
          faixaAtual: aluno.faixaAtual ?? '',
          graus: aluno.graus ?? 0,
          tiposAulaIds: aluno.tiposAulaIds ?? aluno.tiposAula?.map((tipo) => tipo.id) ?? [],
        });
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const toggleTipo = (tipoId: string) => {
    setForm((previous) => ({
      ...previous,
      tiposAulaIds: previous.tiposAulaIds.includes(tipoId)
        ? previous.tiposAulaIds.filter((item) => item !== tipoId)
        : [...previous.tiposAulaIds, tipoId],
    }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.nome.trim()) {
      setError('Informe o nome do aluno.');
      return;
    }
    const dataNascimento = brDateToIso(form.dataNascimento);
    if (!dataNascimento) {
      setError('Informe a data de nascimento no formato DD/MM/AAAA.');
      return;
    }
    if (!isValidBrazilMobile(form.celular)) {
      setError('Informe um celular valido com DDD.');
      return;
    }
    if (form.tiposAulaIds.length === 0) {
      setError('Selecione ao menos um tipo de aula.');
      return;
    }

    const dataPagamento = form.dataPagamento.replace(/\D/g, '').slice(0, 2);
    if (dataPagamento) {
      const day = Number(dataPagamento);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        setError('Dia de pagamento deve ser entre 1 e 31.');
        return;
      }
    }

    try {
      setSaving(true);
      const body = {
        nome: form.nome.trim(),
        apelido: form.apelido.trim() || undefined,
        nomeResponsavel: form.nomeResponsavel.trim() || undefined,
        emailResponsavel: form.emailResponsavel.trim() || undefined,
        celular: form.celular.trim(),
        dataNascimento,
        dataPagamento: dataPagamento || undefined,
        faixaAtual: form.faixaAtual || undefined,
        graus: form.graus,
        tiposAulaIds: form.tiposAulaIds,
      };
      if (id) await parabaService.atualizarAluno(id, body);
      else await parabaService.cadastrarAluno(body);
      navigate('/admin/alunos');
    } catch (err) {
      setError(apiErrorMessage(err, 'Nao foi possivel salvar o aluno.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>{isEditing ? 'Editar aluno' : 'Novo aluno'}</h1>
          <p>Mesmos dados do cadastro no aplicativo.</p>
        </div>
        <Link className="btn btn-ghost" to="/admin/alunos">
          Voltar
        </Link>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="muted">Carregando...</p> : null}

      {!loading ? (
        <form className="card stack" onSubmit={onSubmit}>
          <div>
            <label className="label">Nome</label>
            <input
              className="input"
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Apelido (opcional)</label>
            <input
              className="input"
              value={form.apelido}
              onChange={(e) => setForm((p) => ({ ...p, apelido: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Nome do responsável (opcional)</label>
            <input
              className="input"
              value={form.nomeResponsavel}
              onChange={(e) => setForm((p) => ({ ...p, nomeResponsavel: e.target.value }))}
            />
          </div>
          {userEmail ? (
            <div>
              <label className="label">E-mail do usuário (app)</label>
              <input className="input" type="email" value={userEmail} disabled />
            </div>
          ) : null}
          <div>
            <label className="label">E-mail do responsável (opcional)</label>
            <input
              className="input"
              type="email"
              value={form.emailResponsavel}
              onChange={(e) => setForm((p) => ({ ...p, emailResponsavel: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Celular</label>
            <input
              className="input"
              value={form.celular}
              onChange={(e) => setForm((p) => ({ ...p, celular: formatPhone(e.target.value) }))}
              required
            />
          </div>
          <div className="row">
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="label">Nascimento</label>
              <input
                className="input"
                value={form.dataNascimento}
                onChange={(e) => setForm((p) => ({ ...p, dataNascimento: formatDate(e.target.value) }))}
                placeholder="DD/MM/AAAA"
                required
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="label">Dia pagamento</label>
              <input
                className="input"
                value={form.dataPagamento}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dataPagamento: e.target.value.replace(/\D/g, '').slice(0, 2) }))
                }
                placeholder="1 a 31"
              />
            </div>
          </div>
          <div>
            <label className="label">Tipo de aula</label>
            {tipos.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Nenhum tipo cadastrado. Crie um tipo em Calendário antes de salvar o aluno.
              </p>
            ) : (
              <div className="row">
                {tipos.map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    className={`chip ${form.tiposAulaIds.includes(tipo.id) ? 'active' : ''}`}
                    onClick={() => toggleTipo(tipo.id)}
                  >
                    {tipo.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Faixa</label>
            <div className="row">
              {FAIXAS.map((faixa) => (
                <button
                  key={faixa}
                  type="button"
                  className={`chip ${form.faixaAtual === faixa ? 'active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, faixaAtual: faixa }))}
                >
                  {faixa}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Graus</label>
            <div className="row">
              {GRAUS.map((grau) => (
                <button
                  key={grau}
                  type="button"
                  className={`chip ${form.graus === grau ? 'active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, graus: grau }))}
                >
                  {grau}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar aluno'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
