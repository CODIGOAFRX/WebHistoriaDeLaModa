type PageIntroProps = {
  index: string;
  eyebrow: string;
  title: string;
  summary: string;
  aside?: string;
};

export function PageIntro({ index, eyebrow, title, summary, aside }: PageIntroProps) {
  return (
    <section className="page-intro shell">
      <div className="page-intro-index" aria-hidden="true">{index}</div>
      <div className="page-intro-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <p className="page-intro-summary">{summary}</p>
      {aside ? <p className="page-intro-aside">{aside}</p> : null}
    </section>
  );
}
