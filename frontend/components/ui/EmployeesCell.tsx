import { StatusPill } from "../StatusPill";
import { useEmployeeStatus } from "@/hooks/useContract";
import { ContractAddress } from "@/hooks/useContract";

export function StatusCell({ address }: { address: ContractAddress }) {
  const { isActive, isLoading } = useEmployeeStatus(address);
  if (isLoading) return <span className="text-text-tertiary text-body-sm">…</span>;
  return <StatusPill status={isActive ? "active" : "inactive"} />;
}

export function AddedAtCell({ address }: { address: ContractAddress }) {
  const { addedAt, isLoading } = useEmployeeStatus(address);
  if (isLoading) return <span className="text-text-tertiary text-body-sm">…</span>;
  return (
    <span className="text-body-sm text-text-secondary">
      {addedAt ? addedAt.toLocaleDateString() : "—"}
    </span>
  );
}