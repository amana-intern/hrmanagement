interface BarItem {
  label: string;
  value: number;
}

export default function HorizontalBarChart({
  data,
  maxValue,
  barColor = 'from-amana-blue to-amana-sec-3',
  labelWidth = 'w-24',
}: {
  data: BarItem[];
  maxValue?: number;
  barColor?: string;
  labelWidth?: string;
}) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <span className={`text-sm font-semibold text-amana-black ${labelWidth} truncate`}>{item.label}</span>
          <div className="flex-1 h-6 bg-amana-sec-6 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-amana-blue w-6 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
