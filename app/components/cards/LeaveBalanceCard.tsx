export default function LeaveBalanceCard({ count, label }: { count: string; label: string }) {
  return (
    <div
      className="flex h-24 flex-col items-center justify-center border border-amana-sec-6 rounded-xl bg-amana-white w-full
                 hover:border-amana-blue/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300"
    >
      <span className="text-xl font-semibold text-amana-blue">{count}</span>
      <span className="text-xs font-normal text-amana-sec-7 mt-1">{label}</span>
    </div>
  );
}
