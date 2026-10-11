/** Podpis avtorja — prikazan v vsakem oknu aplikacije. */
export default function Credit({ className = '' }: { className?: string }) {
  return <p className={`text-[11px] text-ink-soft ${className}`}>Created by Matjaž Tekavec</p>;
}
