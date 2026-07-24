import Badge from './Badge';

export default function ContractDaysBadge({ days }: { days: number }) {
  return days > 90 ? <Badge variant="success">{days} days</Badge>
    : days > 60 ? <Badge variant="warning">{days} days</Badge>
    : days > 30 ? <Badge variant="pending">{days} days</Badge>
    : <Badge variant="danger" pulse>{days} days</Badge>;
}
