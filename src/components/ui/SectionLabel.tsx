export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-accent-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
      {children}
    </span>
  );
}
