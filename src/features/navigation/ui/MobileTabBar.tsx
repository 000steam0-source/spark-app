import { SidebarNavItems } from "@/widgets/sidebar/ui/SidebarNavItems";
import { SidebarSettingsButton } from "@/widgets/sidebar/ui/SidebarSettingsButton";

interface MobileTabBarProps {
  searchOpen: boolean;
  onSearchToggle: () => void;
}

// Bottom navigation used on phones instead of the desktop side rail.
export default function MobileTabBar({ searchOpen, onSearchToggle }: MobileTabBarProps) {
  return (
    <nav className="spark-tabbar relative z-[56] flex shrink-0 items-stretch justify-around px-[6px] pt-[4px] pb-[2px]">
      <SidebarNavItems searchOpen={searchOpen} onSearchToggle={onSearchToggle} />
      <SidebarSettingsButton />
    </nav>
  );
}
