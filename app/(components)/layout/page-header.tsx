export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  if (!title && !subtitle && !action) {
    return null;
  }

  return (
    <div className="border-r border-b border-slate-200 bg-white px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
          {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>
    </div>
  );
}
