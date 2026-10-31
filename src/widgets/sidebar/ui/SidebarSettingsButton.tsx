import { sidebarNavItems } from "@/features/navigation/data/navigation";
import { useTranslation } from "@/languages";
import { useModalStore } from "@/features/library";
import { railItemClass, RailIcon, RailLabel } from "./SidebarNavItems";

export function SidebarSettingsButton() {
  const { t } = useTranslation();
  const settingsOpen = useModalStore((state) => state.settingsOpen);
  const toggleSettings = useModalStore((state) => state.toggleSettings);

  const settingsItem = sidebarNavItems.find((item) => item.id === "settings");
  if (!settingsItem) return null;

  const Icon = settingsItem.Icon;
  const label = t("common.sidebar.settings") || settingsItem.label;

  return (
    <button
      type="button"
      aria-pressed={settingsOpen}
      aria-label={label}
      onClick={toggleSettings}
      className={railItemClass(settingsOpen)}
    >
      <RailIcon active={settingsOpen}>
        <Icon size={22} />
      </RailIcon>
      <RailLabel active={settingsOpen}>{label}</RailLabel>
    </button>
  );
}
