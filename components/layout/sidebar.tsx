import Image from "next/image";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar({
  isStaff = false,
  email,
  name,
  avatarUrl,
}: {
  isStaff?: boolean;
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <SidebarNav isStaff={isStaff} />
      <div className="flex items-center gap-3 border-t border-border p-3">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name ?? email ?? "Avatar"}
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-sm font-semibold text-forest-700 dark:bg-forest-800 dark:text-forest-100">
            {(name?.[0] ?? email?.[0] ?? "K").toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-foreground">
            {name ?? email ?? "Sua conta"}
          </div>
          <div className="text-xs text-muted-foreground">Plano único</div>
        </div>
      </div>
    </div>
  );
}
