type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="border-b pb-7 sm:pb-8">
      {eyebrow ? (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-[-0.035em] text-[#252525] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">
        {description}
      </p>
    </header>
  );
}
