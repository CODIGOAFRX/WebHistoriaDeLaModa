import type { CSSProperties, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;
  return (
    <Tag className={`reveal ${className}`.trim()} style={style}>
      {children}
    </Tag>
  );
}
