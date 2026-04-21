'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LibrarianSession, LibraryTenant } from '@/types/tenant';
import LogoutButton from '@/components/auth/LogoutButton';

interface ResponsiveSidebarProps {
  session: LibrarianSession;
  libraries: LibraryTenant[];
}

export default function ResponsiveSidebar({ session, libraries }: ResponsiveSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: 'Préstamos', href: '/dashboard' },
    { name: 'Inventario', href: '/dashboard/books' },
  ];

  return (
    <>
      {/* Mobile Header / Hamburger */}
      <div className="flex items-center justify-between bg-white px-6 py-4 lg:hidden border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">The Librarian</h1>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform bg-white p-6 transition-transform duration-300 ease-in-out lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:rounded-[2rem] lg:border lg:border-slate-200 lg:bg-white",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>

        <div className="flex flex-col h-full">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 text-center lg:text-left">Sesión iniciada</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 text-center lg:text-left break-words">{session.full_name}</h2>
              <p className="mt-1 text-sm text-slate-500 text-center lg:text-left truncate" title={session.email}>{session.email}</p>

              <nav className="mt-8 space-y-2">
                {links.map(link => {
                  const isActive = pathname === link.href;
                  return (
                    <Link 
                      key={link.href}
                      href={link.href} 
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
                        isActive 
                          ? "bg-slate-900 text-white shadow-lg" 
                          : "border border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 rounded-[1.75rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tus Bibliotecas</p>
                <div className="mt-3 space-y-2 overflow-y-auto max-h-[200px] pr-1">
                  {libraries.map((library) => (
                    <div key={library.id} className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-700 shadow-sm border border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{library.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400 truncate">{library.subdomain}.librarian.app</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          
            <div className="mt-auto pt-8">
              <LogoutButton />
            </div>
        </div>
      </aside>
    </>
  );
}
