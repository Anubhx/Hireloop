import { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center mb-4 text-text-muted">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="font-display text-sm font-semibold text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-text-muted max-w-[260px]">{description}</p>
    </div>
  );
}
