'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({
  children,
  className = 'btn',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending}>
      {pending ? (
        <span className="button-loader">
          <span />
          <span />
          <span />
        </span>
      ) : (
        children
      )}
    </button>
  );
}