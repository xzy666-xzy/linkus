import { ChevronLeft, FileText, X } from 'lucide-react';
import type { ComponentProps, ReactNode, Ref } from 'react';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & {
  variant?: 'primary' | 'outline' | 'text-link';
}) {
  return (
    <button
      type="button"
      {...props}
      className={
        (variant === 'outline' ? 'control-outline' : variant) + ' ' + className
      }
    />
  );
}

export function Card({ className = '', ...props }: ComponentProps<'section'>) {
  return <section {...props} className={'card ' + className} />;
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: string;
  children: ReactNode;
}) {
  return <span className={'badge ' + tone}>{children}</span>;
}

export function Input(props: ComponentProps<'input'>) {
  return <input {...props} className={'field ' + (props.className ?? '')} />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="empty-state" role="status">
      <FileText aria-hidden="true" size={22} />
      <span>{children}</span>
    </div>
  );
}

export function PageHeader({
  title,
  back,
  onBack,
  description,
  children,
}: {
  title: string;
  back: string;
  onBack: () => void;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <button type="button" className="back" aria-label={back} onClick={onBack}>
        <ChevronLeft size={19} aria-hidden="true" />
      </button>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Modal({
  dialogRef,
  title,
  close,
  onClose,
  children,
}: {
  dialogRef: Ref<HTMLDialogElement>;
  title: string;
  close: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <dialog
      className="modal"
      ref={dialogRef}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="modal-body">
        <button
          type="button"
          className="modal-close"
          aria-label={close}
          onClick={(event) => event.currentTarget.closest('dialog')?.close()}
        >
          <X size={20} aria-hidden="true" />
        </button>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
