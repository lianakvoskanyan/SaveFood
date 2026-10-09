type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  const classes = className ? `surface-card ${className}` : "surface-card";

  return <article className={classes}>{children}</article>;
}
