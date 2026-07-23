export default function StatCard({
  value,
  label,
  color,
  icon,
}: {
  value: string | number;
  label: string;
  color?: string;
  icon?: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-amana-sec-6 shadow-sm
                 hover:shadow-md hover:-translate-y-0.5 hover:border-amana-blue/20 transition-all duration-300"
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <div
        className={`w-full h-14 rounded-lg flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-amana-blue/5 to-amana-sec-2/20 ${
          color || 'text-amana-blue'
        }`}
      >
        {value}
      </div>
      <span className="text-xs font-semibold text-center text-amana-sec-7 leading-tight">{label}</span>
    </div>
  );
}
