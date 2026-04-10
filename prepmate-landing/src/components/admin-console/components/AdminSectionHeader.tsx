import React from "react";

import { Button } from "../../ui/button";

interface AdminSectionHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

const AdminSectionHeader: React.FC<AdminSectionHeaderProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button
          variant="outline"
          className="border-slate-300 bg-white"
          onClick={onAction}
          disabled={actionDisabled}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default AdminSectionHeader;
