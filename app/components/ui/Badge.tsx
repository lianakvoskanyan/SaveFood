type BadgeProps = {
  children: React.ReactNode;
  tone?: "sage" | "forest" | "cream";
};

export function Badge({ children, tone = "sage" }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
