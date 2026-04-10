import React from "react";

import { cn } from "../../../lib/utils";
import { Notice } from "../types";

interface AdminNoticeBannerProps {
  notice: Notice | null;
}

const AdminNoticeBanner: React.FC<AdminNoticeBannerProps> = ({ notice }) => {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        notice.type === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        notice.type === "error" && "border-rose-200 bg-rose-50 text-rose-700",
        notice.type === "info" && "border-sky-200 bg-sky-50 text-sky-700"
      )}
    >
      {notice.message}
    </div>
  );
};

export default AdminNoticeBanner;
