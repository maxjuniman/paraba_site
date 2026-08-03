import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout, RequireProfessor } from '@/components/AdminLayout';
import { AuthProvider } from '@/lib/AuthContext';
import { LandingPage } from '@/pages/Landing';
import { AdminAlunoFormPage } from '@/pages/admin/AlunoForm';
import { AdminAlunosPage } from '@/pages/admin/Alunos';
import { AdminAutorizacoesPage } from '@/pages/admin/Autorizacoes';
import { AdminCalendarioPage } from '@/pages/admin/Calendario';
import { AdminConfiguracoesPage } from '@/pages/admin/Configuracoes';
import { AdminDepoimentosPage } from '@/pages/admin/Depoimentos';
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
          <Route path="/admin" element={<RequireProfessor />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="alunos" element={<AdminAlunosPage />} />
              <Route path="alunos/novo" element={<AdminAlunoFormPage />} />
              <Route path="alunos/:id" element={<AdminAlunoFormPage />} />
              <Route path="autorizacoes" element={<AdminAutorizacoesPage />} />
              <Route path="presencas" element={<AdminPresencasPage />} />
              <Route path="pagamentos" element={<AdminPagamentosPage />} />
              <Route path="calendario" element={<AdminCalendarioPage />} />
              <Route path="depoimentos" element={<AdminDepoimentosPage />} />
              <Route path="configuracoes" element={<AdminConfiguracoesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
