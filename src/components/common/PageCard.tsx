import type { ReactNode } from "react";

type Props = {
  title: string;
  note?: string;
  children: ReactNode;
};

export function PageCard({ title, note, children }: Props) {
  return (
    <section className="card">
      <div className="card-title">
        <h2>{title}</h2>
        {note ? <small>{note}</small> : null}
      </div>
      {children}
    </section>
  );
}
