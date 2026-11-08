import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Package,
  Users,
  Scale,
  GitBranch,
  Truck,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';

export const NAV_ITEMS = [
  { path: '/command-center', label: 'Command Centre', number: '01', icon: LayoutDashboard },
  { path: '/network-map', label: 'Network Map', number: '02', icon: MapPin },
  { path: '/resources', label: 'Resources & Inventory', number: '03', icon: Package },
  { path: '/demand', label: 'Demand & Beneficiaries', number: '04', icon: Users },
  { path: '/allocation', label: 'Allocation Planning', number: '05', icon: Scale },
  { path: '/recovery', label: 'Recovery Simulator', number: '06', icon: GitBranch },
  { path: '/dispatch', label: 'Dispatch & Verification', number: '07', icon: Truck },
  { path: '/audit', label: 'Audit & Reports', number: '08', icon: History },
];

/** Clean custom SVG ResQNet brand mark */
function BrandLogo({ className = 'w-7 h-7' }) {
  return (
    <div className={`relative flex items-center justify-center rounded-lg bg-teal text-white shrink-0 shadow-subtle ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        {/* Shield outline */}
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        {/* Logistics network node cross */}
        <path d="M12 8v8" strokeWidth="2.5" />
        <path d="M8 12h8" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

export function Sidebar({ isMobile = false }) {
  const {
    sidebarCollapsed,
    toggleSidebar,
    operatorRole,
    setIsSettingsOpen,
    setMobileMenuOpen,
  } = useAppStore();

  const isCollapsed = !isMobile && sidebarCollapsed;

  return (
    <aside
      className={`
        bg-navy-primary text-steel-muted flex flex-col transition-all duration-200 select-none z-30 shrink-0
        ${isMobile
          ? 'fixed inset-y-0 left-0 w-72 shadow-2xl border-r border-navy-secondary'
          : `fixed top-0 bottom-0 left-0 border-r border-navy-secondary ${isCollapsed ? 'w-16' : 'w-64'}`
        }
      `}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-navy-secondary flex items-center justify-between">
        <NavLink
          to="/command-center"
          onClick={() => isMobile && setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 truncate group"
        >
          <BrandLogo />
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-bold text-sm tracking-wide text-white">ResQNet</span>
                <span className="text-[9px] font-mono font-semibold px-1 py-0.2 bg-teal/30 text-teal-light rounded">
                  OPS
                </span>
              </div>
              <div className="text-[10px] text-steel-muted font-normal truncate mt-0.5">
                Crisis Operations Command
              </div>
            </div>
          )}
        </NavLink>

        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-navy-secondary"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2 pt-1 pb-2 text-[10px] font-mono uppercase tracking-wider text-steel font-semibold">
            NAVIGATION MODULES
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-teal text-white shadow-subtle font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-navy-secondary'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200">
                    {item.number}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}

        {/* Phase 1 Design Showcase Shortcut */}
        <div className="pt-2 border-t border-navy-secondary/60 mt-2">
          <NavLink
            to="/design-system"
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-teal/30 text-teal-light border border-teal/40'
                  : 'text-teal-light/75 hover:text-white hover:bg-navy-secondary'
              }`
            }
            title={isCollapsed ? 'Design System' : undefined}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-teal" />
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1 truncate">
                <span className="truncate">Design Showcase</span>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-teal/30 text-teal-light rounded">
                  P1
                </span>
              </div>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Footer Controls: Settings, User Profile, Collapse */}
      <div className="p-2 border-t border-navy-secondary space-y-1">
        {/* Settings Action Button */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs text-slate-300 hover:text-white hover:bg-navy-secondary transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
          title="Operations Settings"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>System Settings</span>}
        </button>

        {/* Operator Profile Card */}
        <div
          className={`
            px-2.5 py-2 rounded-md bg-navy-secondary/60 border border-navy-secondary flex items-center gap-2.5
            ${isCollapsed ? 'justify-center p-1.5' : ''}
          `}
        >
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-navy-dark border border-steel flex items-center justify-center text-xs font-bold text-white">
              SV
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-status-success ring-1 ring-navy-primary" />
          </div>

          {!isCollapsed && (
            <div className="truncate flex-1">
              <div className="text-xs font-semibold text-white truncate leading-tight">
                {operatorRole}
              </div>
              <div className="text-[10px] text-steel-muted font-mono leading-none truncate mt-0.5">
                AUTHORIZED COORDINATOR
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse/Expand Control */}
        {!isMobile && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-navy-secondary transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px]">Collapse Menu</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
