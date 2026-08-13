export type UserType = 1 | 2 | 'admin' | 'professor' | 'aluno';

export type SessionUser = {
  id: string;
  nome: string;
  email: string;
  celular?: string;
  tipo: UserType;
  ativo: boolean;
  alunoId?: string | null;
  foto?: string | null;
  faixaAtual?: string | null;
  graus?: number | null;
};

export type AuthPayload = {
  accessToken: string;
  user: SessionUser;
};

export type AlunoBody = {
  nome: string;
  apelido?: string;
  foto?: string;
  emailResponsavel?: string;
  nomeResponsavel?: string;
  celular: string;
  dataNascimento: string;
  dataPagamento?: string;
  faixaAtual?: string;
  graus?: number;
  tiposAulaIds: string[];
};

export type Aluno = {
  id: string;
  nome: string;
  apelido?: string | null;
  foto?: string | null;
  emailResponsavel?: string;
  nomeResponsavel?: string | null;
  celular?: string;
  dataNascimento?: string;
  dataPagamento?: string | null;
  pagamentoPago?: boolean | null;
  pagamentoReferencia?: string | null;
  pagamentosPagos?: string[] | null;
  faixaAtual?: string | null;
  graus?: number | null;
  tiposAulaIds?: string[];
  tiposAula?: { id: string; nome: string }[] | null;
  ativo?: boolean;
  userId?: string | null;
  user?: Pick<SessionUser, 'id' | 'nome' | 'email' | 'ativo'> | null;
  cadastroAppAt?: string | null;
  totalPresencas?: number;
  ultimaPresenca?: string | null;
  createdAt?: string;
};

export type PendingUser = SessionUser & { ativo: boolean };

export type VinculoAlunoResumo = {
  id: string;
  nome: string;
  apelido?: string | null;
  celular?: string;
  ativo?: boolean;
  faixaAtual?: string | null;
  primario?: boolean;
};

export type UsuarioAtivoComVinculos = PendingUser & {
  alunos: VinculoAlunoResumo[];
  alunosCount: number;
  maxAlunos: number;
};

export type VinculosUsuario = {
  user: PendingUser;
  alunos: VinculoAlunoResumo[];
  alunoPrimarioId: string | null;
  maxAlunos: number;
};

export type AulaCategoria = 'kids' | 'juvenil' | 'adulto';
export type AulaRecorrencia = 'avulsa' | 'recorrente';

export type TipoAula = {
  id: string;
  nome: string;
  createdAt?: string;
};

export type PresencaAulaDoDia = {
  aulaId: string;
  hora: string;
  categorias: AulaCategoria[];
  tipoAula: { id: string; nome: string };
};

export type PresencaDiaAluno = Aluno & {
  presente: boolean;
  presentePorAula?: Record<string, boolean>;
};

export type PresencaDia = {
  data: string;
  aulas: PresencaAulaDoDia[];
  aulaSelecionada?: PresencaAulaDoDia | null;
  alunos: PresencaDiaAluno[];
};

export type AulaCalendarioMes = {
  id: string;
  data: string;
  hora: string;
  tipoAula: { id: string; nome: string };
  categorias: AulaCategoria[];
  recorrencia: AulaRecorrencia;
  totalPresentes?: number;
};

export type CalendarioMes = {
  mes: string;
  aulas: AulaCalendarioMes[];
};

export type AulaCalendarioBody = {
  tipoAulaId?: string;
  novoTipoAula?: string;
  recorrencia: AulaRecorrencia;
  diasSemana?: number[];
  data?: string;
  hora: string;
  categorias: AulaCategoria[];
};

export type DepoimentoAdmin = {
  id: string;
  nome: string;
  texto: string;
  faixa?: string | null;
  foto?: string | null;
  userId?: string | null;
  ativo: boolean;
  ordem: number;
  createdAt?: string;
};

export type VideoUpdate = {
  id: string;
  titulo: string;
  descricao?: string | null;
  url: string;
  createdAt?: string;
};

export type EquipeAluno = Pick<
  Aluno,
  'id' | 'nome' | 'apelido' | 'foto' | 'dataNascimento' | 'faixaAtual' | 'graus' | 'tiposAula'
> & {
  isMe?: boolean;
  showFaixa?: boolean;
  dataPagamento?: string | null;
  pagamentoPago?: boolean | null;
  pagamentoReferencia?: string | null;
  pagamentosPagos?: string[] | null;
  createdAt?: string;
  cadastroAppAt?: string | null;
};

export type MeuAluno = EquipeAluno &
  Pick<Aluno, 'dataPagamento' | 'pagamentoPago' | 'pagamentoReferencia' | 'pagamentosPagos' | 'createdAt' | 'cadastroAppAt'>;
