import type { ComponentType } from "react";
import {
  NavHomeIcon,
  NavSearchIcon,
  NavLibraryIcon,
  NavSettingsIcon,
} from "../ui/NavIcons";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

export const sidebarNavItems: NavItem[] = [
  { id: "home", label: "Home", href: "/", Icon: NavHomeIcon },
  { id: "search", label: "Search", Icon: NavSearchIcon },
  { id: "library", label: "Library", href: "/library", Icon: NavLibraryIcon },
  { id: "settings", label: "Settings", Icon: NavSettingsIcon },
];
