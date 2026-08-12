type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  text?: string;
  action?: { href: string; label: string };
};

export function SectionHeading({ eyebrow, title, text, action }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
      {action ? (
        <a className="text-link" href={action.href}>
          {action.label}
        </a>
      ) : null}
    </div>
  );
}
