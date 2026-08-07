import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout, RequireAuth, RequireProfessor } from '@/components/AdminLayout';
import { AuthProvider } from '@/lib/AuthContext';
import { LandingPage } from '@/pages/Landing';
import { AdminAlunoFormPage } from '@/pages/admin/AlunoForm';
import { AdminAlunosPage } from '@/pages/admin/Alunos';
import { AdminAutorizacoesPage } from '@/pages/admin/Autorizacoes';
import { AdminCalendarioPage } from '@/pages/admin/Calendario';
import { AdminConfiguracoesPage } from '@/pages/admin/Configuracoes';
import { AdminConfiguracoesCadastrarProfessorPage } from '@/pages/admin/ConfiguracoesCadastrarProfessor';
import { AdminConfiguracoesEditarPage } from '@/pages/admin/ConfiguracoesEditar';
import { AdminConfiguracoesVinculosPage } from '@/pages/admin/ConfiguracoesVinculos';
import { AdminDepoimentosPage } from '@/pages/admin/Depoimentos';
import { AdminEquipePage } from '@/pages/admin/Equipe';
import { AdminHomePage } from '@/pages/admin/Home';
import { AdminLoginPage } from '@/pages/admin/Login';
import { AdminPagamentosPage } from '@/pages/admin/Pagamentos';
import { AdminPresencasPage } from '@/pages/admin/Presencas';
import { AdminRegisterPage } from '@/pages/admin/Register';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />
          <Route path="/admin" element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="calendario" element={<AdminCalendarioPage />} />
              <Route path="depoimentos" element={<AdminDepoimentosPage />} />
              <Route path="configuracoes" element={<AdminConfiguracoesPage />} />
              <Route path="configuracoes/editar" element={<AdminConfiguracoesEditarPage />} />
              <Route path="configuracoes/vinculos" element={<AdminConfiguracoesVinculosPage />} />
              <Route path="equipe" element={<AdminEquipePage />} />
              <Route element={<RequireProfessor />}>
                <Route
                  path="configuracoes/cadastrar-professor"
                  element={<AdminConfiguracoesCadastrarProfessorPage />}
                />
                <Route path="alunos" element={<AdminAlunosPage />} />
                <Route path="alunos/novo" element={<AdminAlunoFormPage />} />
                <Route path="alunos/:id" element={<AdminAlunoFormPage />} />
                <Route path="autorizacoes" element={<AdminAutorizacoesPage />} />
                <Route path="presencas" element={<AdminPresencasPage />} />
                <Route path="pagamentos" element={<AdminPagamentosPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
