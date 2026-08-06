import { api, unwrapData } from './api';
import type {
  Aluno,
  AlunoBody,
  AulaCalendarioBody,
  AuthPayload,
  CalendarioMes,
  DepoimentoAdmin,
  EquipeAluno,
  MeuAluno,
  PendingUser,
  PresencaDia,
  PresencaDiaAluno,
  SessionUser,
  TipoAula,
} from './types';

export const parabaService = {
  async login(email: string, senha: string): Promise<AuthPayload> {
    const { data } = await api.post<AuthPayload>('/auth/login', { email, senha });
    return data;
  },

  async obterMeuPerfil(): Promise<SessionUser> {
    const { data } = await api.get<{ data?: SessionUser } | SessionUser>('/auth/me');
    return unwrapData<SessionUser>(data);
  },

  async atualizarMeuPerfil(body: {
    nome: string;
    celular?: string;
    senhaAtual?: string;
    novaSenha?: string;
  }): Promise<SessionUser> {
    const { data } = await api.patch<{ data?: SessionUser } | SessionUser>('/auth/me', body);
    return unwrapData<SessionUser>(data);
  },

  async cadastrarProfessor(body: {
    nome: string;
    email: string;
    celular: string;
    senha: string;
    confirmacao_senha: string;
  }): Promise<AuthPayload & { data?: SessionUser }> {
    const { data } = await api.post<AuthPayload & { data?: SessionUser; message?: string }>(
      '/users/professores',
      body
    );
    return data;
  },

  async cadastrarUsuario(body: {
    nome: string;
    email: string;
    celular: string;
    senha: string;
    confirmacao_senha: string;
  }): Promise<{ message?: string; user?: SessionUser; data?: SessionUser; accessToken?: string }> {
    const { data } = await api.post<{ message?: string; user?: SessionUser; data?: SessionUser; accessToken?: string }>(
      '/auth/register',
      body
    );
    return data;
  },

  async listarUsuariosPendentes(): Promise<PendingUser[]> {
    const { data } = await api.get<{ data?: PendingUser[] } | PendingUser[]>('/users/pendentes');
    return Array.isArray(data) ? data : data.data ?? [];
  },

  async autorizarUsuario(
    userId: string,
    body: { aluno_id: string } | { aluno: AlunoBody }
  ): Promise<{ user: SessionUser; aluno: Aluno }> {
    const { data } = await api.post<{ data?: { user: SessionUser; aluno: Aluno } } | { user: SessionUser; aluno: Aluno }>(
      `/users/${userId}/autorizar`,
      body
    );
    return unwrapData(data);
  },

  async listarAlunos(): Promise<Aluno[]> {
    const { data } = await api.get<{ data?: Aluno[] } | Aluno[]>('/alunos');
    return Array.isArray(data) ? data : data.data ?? [];
  },

  async cadastrarAluno(body: AlunoBody): Promise<Aluno> {
    const { data } = await api.post<{ data?: Aluno } | Aluno>('/alunos', body);
    return unwrapData<Aluno>(data);
  },

  async atualizarAluno(alunoId: string, body: AlunoBody): Promise<Aluno> {
    const { data } = await api.patch<{ data?: Aluno } | Aluno>(`/alunos/${alunoId}`, body);
    return unwrapData<Aluno>(data);
  },

  async atualizarStatusAluno(alunoId: string, ativo: boolean): Promise<Aluno> {
    const { data } = await api.patch<{ data?: Aluno } | Aluno>(`/alunos/${alunoId}/ativo`, { ativo });
    return unwrapData<Aluno>(data);
  },

  async desvincularAlunoUser(alunoId: string): Promise<Aluno> {
    const { data } = await api.post<{ data?: Aluno } | Aluno>(`/alunos/${alunoId}/desvincular-user`);
    return unwrapData<Aluno>(data);
  },

  async atualizarStatusPagamento(body: {
    alunoId: string;
    pago: boolean;
    referencia: string;
  }): Promise<Aluno> {
    const { data } = await api.patch<{ data?: Aluno } | Aluno>(`/alunos/${body.alunoId}/pagamento-status`, {
      pago: body.pago,
      referencia: body.referencia,
    });
    return unwrapData<Aluno>(data);
  },

  async listarPresencas(dataPresenca: string): Promise<PresencaDia> {
    const { data } = await api.get<{ data?: PresencaDia } | PresencaDia>('/presencas', {
      params: { data: dataPresenca },
    });
    return unwrapData<PresencaDia>(data);
  },

  async alternarPresenca(
    dataPresenca: string,
    aulaId: string,
    alunoId: string
  ): Promise<{ aluno: PresencaDiaAluno }> {
    const { data } = await api.patch<{ data?: { aluno: PresencaDiaAluno } } | { aluno: PresencaDiaAluno }>(
      `/presencas/${dataPresenca}/aulas/${aulaId}/alunos/${alunoId}/toggle`
    );
    return unwrapData(data);
  },

  async listarTiposAula(): Promise<TipoAula[]> {
    const { data } = await api.get<{ data?: TipoAula[] } | TipoAula[]>('/calendario/tipos');
    return Array.isArray(data) ? data : data.data ?? [];
  },

  async listarCalendarioMes(mes: string): Promise<CalendarioMes> {
    const { data } = await api.get<{ data?: CalendarioMes } | CalendarioMes>('/calendario', {
      params: { mes },
    });
    return unwrapData<CalendarioMes>(data);
  },

  async cadastrarAulaCalendario(body: AulaCalendarioBody) {
    const { data } = await api.post('/calendario/aulas', body);
    return unwrapData(data);
  },

  async listarEquipe(): Promise<EquipeAluno[]> {
    const { data } = await api.get<{ data?: EquipeAluno[] } | EquipeAluno[]>('/equipe');
    return Array.isArray(data) ? data : data.data ?? [];
  },

  async obterMeuAluno(): Promise<MeuAluno> {
    const { data } = await api.get<{ data?: MeuAluno } | MeuAluno>('/equipe/me');
    return unwrapData<MeuAluno>(data);
  },

  async atualizarMinhaFotoEquipe(foto: string | null): Promise<EquipeAluno> {
    const { data } = await api.patch<{ data?: EquipeAluno } | EquipeAluno>('/equipe/me/foto', { foto });
    return unwrapData<EquipeAluno>(data);
  },

  async obterMeuDepoimento(): Promise<DepoimentoAdmin | null> {
    const { data } = await api.get<{ data?: DepoimentoAdmin | null }>('/depoimentos/me');
    return data?.data ?? null;
  },

  async salvarMeuDepoimento(texto: string): Promise<DepoimentoAdmin> {
    const { data } = await api.put<{ data?: DepoimentoAdmin } | DepoimentoAdmin>('/depoimentos/me', {
      texto,
    });
    return unwrapData<DepoimentoAdmin>(data);
  },

  async listarDepoimentos(): Promise<DepoimentoAdmin[]> {
    const { data } = await api.get<{ data?: DepoimentoAdmin[] } | DepoimentoAdmin[]>('/depoimentos');
    return Array.isArray(data) ? data : data.data ?? [];
  },

  async criarDepoimento(body: {
    nome?: string;
    texto: string;
    faixa?: string | null;
    ativo?: boolean;
  }): Promise<DepoimentoAdmin> {
    const { data } = await api.post<{ data?: DepoimentoAdmin } | DepoimentoAdmin>('/depoimentos', body);
    return unwrapData<DepoimentoAdmin>(data);
  },

  async atualizarDepoimento(
    id: string,
    body: Partial<{ nome: string; texto: string; faixa: string | null; ativo: boolean; ordem: number }>
  ): Promise<DepoimentoAdmin> {
    const { data } = await api.patch<{ data?: DepoimentoAdmin } | DepoimentoAdmin>(
      `/depoimentos/${id}`,
      body
    );
    return unwrapData<DepoimentoAdmin>(data);
  },

  async desativarDepoimento(id: string): Promise<DepoimentoAdmin> {
    return this.atualizarDepoimento(id, { ativo: false });
  },

  async excluirDepoimento(id: string): Promise<void> {
    await api.delete(`/depoimentos/${id}`);
  },
};
