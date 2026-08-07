import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isAluno, isProfessor } from '@/lib/session';
import './Configuracoes.css';

type SettingsRowProps = {
  to?: string;
  label: string;
  subtitle?: string;
  icon: ReactNode;
  onClick?: () => void;
  danger?: boolean;
};

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19.5c1.8-3.2 4.2-4.8 7-4.8s5.2 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M2.5 19c1.4-2.8 3.4-4.2 6.5-4.2s5.1 1.4 6.5 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.5 14.2c1.4-.5 2.8-.5 4.5.3 1.5.7 2.6 2 3.2 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4 3.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSchool() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 10.5 12 5l9 5.5-9 5.5-9-5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 13.2v4.1c0 .4.7 1.5 5 2.7 4.3-1.2 5-2.3 5-2.7v-4.1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 10.5V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 5H7.5A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19H10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsRow({ to, label, subtitle, icon, onClick, danger }: SettingsRowProps) {
  const className = `settings-row${danger ? ' is-danger' : ''}`;
  const content = (
    <>
      <span className="settings-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="settings-row-text">
        <span className="settings-row-label">{label}</span>
        {subtitle ? <span className="settings-row-sub">{subtitle}</span> : null}
      </span>
      {to || onClick ? (
        <span className="settings-chevron" aria-hidden="true">
          ›
        </span>
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link className={className} to={to}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

export function AdminConfiguracoesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const professor = isProfessor(user);
  const aluno = isAluno(user);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Configurações</h1>
          <p>Escolha uma opção para continuar.</p>
        </div>
      </header>

      <section className="card settings-profile">
        <strong>{user?.nome ?? 'Usuário'}</strong>
        <span>{user?.email ?? ''}</span>
      </section>

      <section className="card settings-list">
        <SettingsRow
          to="/admin/configuracoes/editar"
          icon={<IconUser />}
          label="Editar cadastro"
          subtitle={
            professor ? 'Nome, celular, foto, faixa e senha' : 'Nome, celular, foto e senha'
          }
        />

        {aluno ? (
          <>
            <div className="settings-divider" />
            <SettingsRow
              to="/admin/configuracoes/vinculos"
              icon={<IconPeople />}
              label="Alunos vinculados"
              subtitle="Ver e escolher o aluno primário"
            />
            <div className="settings-divider" />
            <SettingsRow
              to="/admin/depoimentos"
              icon={<IconChat />}
              label="Deixar depoimento"
              subtitle="Publicar no site da equipe"
            />
          </>
        ) : null}

        {professor ? (
          <>
            <div className="settings-divider" />
            <SettingsRow
              to="/admin/depoimentos"
              icon={<IconChat />}
              label="Meu depoimento"
              subtitle="Texto no carrossel do site"
            />
            <div className="settings-divider" />
            <SettingsRow
              to="/admin/configuracoes/vinculos"
              icon={<IconPeople />}
              label="Alunos vinculados"
              subtitle="Até 2 alunos por usuário"
            />
            <div className="settings-divider" />
            <SettingsRow
              to="/admin/configuracoes/cadastrar-professor"
              icon={<IconSchool />}
              label="Cadastrar professor"
              subtitle="Criar usuário para outro professor"
            />
          </>
        ) : null}
      </section>

      <section className="card settings-list">
        <SettingsRow icon={<IconLogout />} label="Sair" danger onClick={handleLogout} />
      </section>
    </div>
  );
}
