import { CheckCircle, AlertCircle } from "lucide-react";

interface CheckItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}

export default function CheckItem({ icon, label, value, ok }: CheckItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="text-accent-purple">{icon}</span>
        <span className="text-body-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-body-sm text-text-primary">{value}</span>
        {ok
          ? <CheckCircle className="w-4 h-4 text-accent-green" />
          : <AlertCircle className="w-4 h-4 text-accent-amber" />}
      </div>
    </div>
  );
}