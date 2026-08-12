export default function StatCard({
  value,
  label,
  color,
  icon,
  className = '',
}: {
  value: string | number;
  label: string;
  color?: string;
  icon?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-amana-neutral-200 shadow-sm
                 hover:shadow-md hover:-translate-y-0.5 hover:border-amana-primary-500/20 transition-all duration-300 ${className}`}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <div
        className={`w-full h-14 rounded-lg flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-amana-primary-500/5 to-amana-primary-200/20 ${
          color || 'text-amana-primary-500'
        }`}
      >
        {value}
      </div>
      <span className="text-xs font-semibold text-center text-amana-neutral-400 leading-tight">{label}</span>
    </div>
  );
}
