import {
  LayoutDashboardIcon,
  BellIcon,
  InboxIcon,
  UsersIcon,
  FileTextIcon,
  PackageIcon,
  PaletteIcon,
  FactoryIcon,
  WarehouseIcon,
  LayersIcon,
  ShirtIcon,
  TruckIcon,
  ReceiptIcon,
  WalletIcon,
  TrendingUpIcon,
  BarChart3Icon,
  UserCogIcon,
  ShieldCheckIcon } from
'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '../types/api';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[] | 'ALL';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
{
  label: 'Overview',
  items: [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, roles: 'ALL' },
  { to: '/notifications', label: 'Notifications', icon: BellIcon, roles: 'ALL' }]

},
{
  label: 'Sales',
  items: [
  { to: '/inquiries', label: 'Leads & inquiries', icon: InboxIcon, roles: ['ADMIN', 'SALES'] },
  { to: '/customers', label: 'Customers', icon: UsersIcon, roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'DELIVERY', 'PRODUCTION'] },
  { to: '/quotations', label: 'Quotations', icon: FileTextIcon, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { to: '/orders', label: 'Orders', icon: PackageIcon, roles: 'ALL' }]

},
{
  label: 'Operations',
  items: [
  { to: '/artwork', label: 'Artwork', icon: PaletteIcon, roles: ['ADMIN', 'SALES', 'PRODUCTION'] },
  { to: '/production', label: 'Production', icon: FactoryIcon, roles: ['ADMIN', 'SALES', 'PRODUCTION'] },
  { to: '/inventory', label: 'Inventory', icon: WarehouseIcon, roles: ['ADMIN', 'STORE_KEEPER', 'SALES', 'PRODUCTION'] },
  { to: '/materials', label: 'Materials', icon: LayersIcon, roles: ['ADMIN', 'STORE_KEEPER', 'ACCOUNTS', 'SALES', 'PRODUCTION'] },
  { to: '/catalog', label: 'Product catalogue', icon: ShirtIcon, roles: 'ALL' },
  { to: '/delivery', label: 'Delivery', icon: TruckIcon, roles: ['ADMIN', 'DELIVERY', 'SALES'] }]

},
{
  label: 'Finance',
  items: [
  { to: '/invoices', label: 'Invoices', icon: ReceiptIcon, roles: ['ADMIN', 'ACCOUNTS'] },
  { to: '/payments', label: 'Payments', icon: WalletIcon, roles: ['ADMIN', 'ACCOUNTS'] },
  { to: '/profit', label: 'Profit & expenses', icon: TrendingUpIcon, roles: ['ADMIN', 'ACCOUNTS'] },
  { to: '/reports', label: 'Reports', icon: BarChart3Icon, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] }]

},
{
  label: 'Administration',
  items: [
  { to: '/users', label: 'Staff & roles', icon: UserCogIcon, roles: ['ADMIN'] },
  { to: '/audit-log', label: 'Audit log', icon: ShieldCheckIcon, roles: ['ADMIN'] }]

}];


export function canAccess(item: NavItem, role?: Role): boolean {
  if (item.roles === 'ALL') return true;
  return !!role && item.roles.includes(role);
}