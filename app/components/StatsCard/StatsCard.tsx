interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
}

export default function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-sm text-green-600 mt-2">{description}</p>
    </div>
  );
}