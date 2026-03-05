import { X } from "lucide-react";

export default function ModalShell({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md bg-bg-secondary border border-border-light rounded-xl shadow-2xl">
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
            <h3 className="text-h3 font-semibold text-text-primary">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors">
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}