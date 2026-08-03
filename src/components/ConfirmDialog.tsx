import type { ReactNode } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog card stack"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <img src="/logo.png" alt="Equipe Paraba" className="confirm-logo" />
        <h2 id="confirm-dialog-title" style={{ margin: 0, textAlign: 'center' }}>
          {title}
        </h2>
        {description ? (
          <div className="muted" style={{ margin: 0, textAlign: 'center', lineHeight: 1.45 }}>
            {description}
          </div>
        ) : null}
        <div className="row" style={{ justifyContent: 'center', marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
