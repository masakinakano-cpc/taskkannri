import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils';

const SidebarContext = createContext({
  isOpen: true,
  setIsOpen: () => {},
});

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children, ...props }) {
  const { isOpen } = useContext(SidebarContext);

  return (
    <aside
      className={cn(
        'bg-white border-r border-slate-200 transition-all duration-300',
        isOpen ? 'w-64' : 'w-0 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, children, ...props }) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarContent({ className, children, ...props }) {
  return (
    <div className={cn('flex-1 overflow-auto', className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroup({ children }) {
  return <div className="mb-4">{children}</div>;
}

export function SidebarGroupLabel({ className, children, ...props }) {
  return (
    <div className={cn('text-sm font-semibold text-slate-500 mb-2', className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroupContent({ children }) {
  return <div>{children}</div>;
}

export function SidebarMenu({ children }) {
  return <nav className="space-y-1">{children}</nav>;
}

export function SidebarMenuItem({ children }) {
  return <div>{children}</div>;
}

export function SidebarMenuButton({ className, asChild, children, ...props }) {
  const Comp = asChild ? 'div' : 'button';

  return (
    <Comp
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function SidebarTrigger({ className, children, ...props }) {
  const { setIsOpen } = useContext(SidebarContext);

  return (
    <button
      onClick={() => setIsOpen(prev => !prev)}
      className={cn('p-2 hover:bg-slate-100 rounded-lg', className)}
      {...props}
    >
      {children}
    </button>
  );
}
