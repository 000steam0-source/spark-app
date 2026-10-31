import { Link, useLocation } from "react-router-dom";
import { sidebarNavItems } from "@/features/navigation/data/navigation";
import { useTranslation } from "@/languages";
import { cn } from "@/shared/lib";

export interface SidebarNavItemsProps {
  searchOpen: boolean;
  onSearchToggle: () => void;
}

export const railItemClass = (active: boolean) =>
  cn(
    "spark-rail-item group relative flex w-[60px] flex-col items-center gap-[5px] rounded-[18px] border-0 bg-transparent px-0 pt-[9px] pb-[7px] cursor-pointer select-none no-underline transition-[background-color,color,transform] duration-200 active:scale-[0.94]",
    active
      ? "text-text-primary"
      : "text-text-tertiary hover:text-text-primary hover:bg-bg-toolbox",
  );

export function RailIcon({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-[34px] w-[44px] items-center justify-center rounded-[13px] transition-[background-color,color,box-shadow] duration-200",
        active
          ? "spark-gradient-bg text-spark-on shadow-[0_8px_20px_-10px_var(--spark-glow)]"
          : "bg-transparent",
      )}
    >
      {children}
    </span>
  );
}

export function RailLabel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "max-w-[60px] truncate text-[11px] leading-none tracking-[0.01em]",
        active ? "font-[750]" : "font-[600]",
      )}
    >
      {children}
    </span>
  );
}

export function SidebarNavItems({
  searchOpen,
  onSearchToggle,
}: SidebarNavItemsProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "/home";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <>
      {sidebarNavItems
        .filter((item) => item.id !== "settings")
        .map((item) => {
          const active = item.id === "search" ? searchOpen : item.href ? isRouteActive(item.href) : false;
          const Icon = item.Icon;
          const label = t(`common.sidebar.${item.id}`) || item.label;
          const inner = (
            <>
              <RailIcon active={active}>
                <Icon size={22} />
              </RailIcon>
              <RailLabel active={active}>{label}</RailLabel>
            </>
          );

          if (item.id === "search") {
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={searchOpen}
                aria-label={label}
                onClick={onSearchToggle}
                className={railItemClass(active)}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.href!}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={railItemClass(active)}
            >
              {inner}
            </Link>
          );
        })}
    </>
  );
}
