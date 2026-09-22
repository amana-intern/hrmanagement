import type { NavGroup } from '../components/Sidebar/SidebarNavBase';

export function resolveBreadcrumb(pathname: string, groups: NavGroup[]): { section: string; page: string } | null {
  if (!groups || !Array.isArray(groups)) return null;
  for (const group of groups) {
    const link = group.links.find((l) => l.href === pathname || l.activePaths?.includes(pathname));
    if (link) return { section: group.title, page: link.label };
  }
  return null;
}
