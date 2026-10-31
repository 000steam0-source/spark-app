import { memo } from "react";
import { SidebarNavItems } from "./SidebarNavItems";
import { SidebarSettingsButton } from "./SidebarSettingsButton";
import { useBlockCustomizationStyle } from "@/features/settings/store/customizationStore";

export interface SidebarProps {
  searchOpen: boolean;
  onSearchToggle: () => void;
}

function Sidebar({ searchOpen, onSearchToggle }: SidebarProps) {
  const sidebarStyle = useBlockCustomizationStyle("sidebar");

  return (
    <div
      className="spark-rail h-full w-[76px] rounded-[24px] flex flex-col items-center overflow-hidden bg-bg-glass backdrop-blur-[24px]"
      style={sidebarStyle}
    >
      <nav className="flex flex-1 flex-col items-center gap-[4px] pt-[10px]">
        <SidebarNavItems
          searchOpen={searchOpen}
          onSearchToggle={onSearchToggle}
        />
      </nav>

      <div className="mx-auto mb-[6px] h-px w-[36px] bg-border-alpha-14" />

      <div className="flex shrink-0 flex-col items-center pb-[10px]">
        <SidebarSettingsButton />
      </div>
    </div>
  );
}

export default memo(Sidebar);
