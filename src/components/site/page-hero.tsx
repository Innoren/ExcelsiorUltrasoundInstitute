type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--eui-border)] bg-[var(--eui-ink)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(45,212,191,0.18),_transparent_50%),linear-gradient(160deg,#0b1f24_0%,#12363c_55%,#0f766e_140%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--eui-teal-glow)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}
