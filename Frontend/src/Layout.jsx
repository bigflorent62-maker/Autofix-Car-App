import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Car, 
  User, 
  Menu, 
  X,
  Calendar,
  Building2,
  LogOut,
  Settings,
  Shield
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [testWorkshopId, setTestWorkshopId] = useState(localStorage.getItem('testWorkshopId') || '');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: workshops } = useQuery({
    queryKey: ['allWorkshops'],
    queryFn: () => base44.entities.Workshop.list(),
  });

  const isWorkshop = user?.user_type === 'workshop';
  const isAdmin = user?.role === 'admin';

  const handleWorkshopChange = (workshopId) => {
    if (workshopId === 'none') {
      localStorage.removeItem('testWorkshopId');
      setTestWorkshopId('');
    } else {
      localStorage.setItem('testWorkshopId', workshopId);
      setTestWorkshopId(workshopId);
    }
    window.location.reload();
  };

  const hideLayout = ['AIDiagnosis', 'Chat'].includes(currentPageName);

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl hidden sm:block">Workshop Connect</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to={createPageUrl('SearchWorkshops')}
                className="text-slate-600 hover:text-slate-900"
              >
                Cerca Officine
              </Link>
              <Link 
                to={createPageUrl('AIDiagnosis')}
                className="text-slate-600 hover:text-slate-900"
              >
                Diagnosi AI
              </Link>
              {isWorkshop && (
                <Link 
                  to={createPageUrl('WorkshopDashboard')}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link 
                  to={createPageUrl('AdminDashboard')}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Test Workshop Selector */}
            {workshops && workshops.length > 0 && (
              <div className="hidden md:block mr-2">
                <Select value={testWorkshopId} onValueChange={handleWorkshopChange}>
                  <SelectTrigger className="w-48 bg-yellow-50 border-yellow-400">
                    <SelectValue placeholder="🧪 Test Officina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuna (default)</SelectItem>
                    {workshops.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center gap-2">
              {user && <NotificationBell userEmail={user.email} />}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="hidden sm:block">{user.full_name?.split(' ')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isWorkshop && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('MyAppointments')}>
                            <Calendar className="h-4 w-4 mr-2" />
                            I miei appuntamenti
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {isWorkshop && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('WorkshopDashboard')}>
                            <Building2 className="h-4 w-4 mr-2" />
                            Dashboard Officina
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('WorkshopSettings')}>
                            <Settings className="h-4 w-4 mr-2" />
                            Impostazioni
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('AdminDashboard')}>
                            <Shield className="h-4 w-4 mr-2" />
                            Pannello Admin
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => base44.auth.logout()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Esci
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => base44.auth.redirectToLogin()}>
                  Accedi
                </Button>
              )}

              {/* Mobile menu button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="px-4 py-4 space-y-2">
              <Link 
                to={createPageUrl('SearchWorkshops')}
                className="block py-2 text-slate-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cerca Officine
              </Link>
              <Link 
                to={createPageUrl('AIDiagnosis')}
                className="block py-2 text-slate-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Diagnosi AI
              </Link>
              {user && !isWorkshop && (
                <Link 
                  to={createPageUrl('MyAppointments')}
                  className="block py-2 text-slate-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  I miei appuntamenti
                </Link>
              )}
              {isWorkshop && (
                <Link 
                  to={createPageUrl('WorkshopDashboard')}
                  className="block py-2 text-slate-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard Officina
                </Link>
              )}
              {isAdmin && (
                <Link 
                  to={createPageUrl('AdminDashboard')}
                  className="block py-2 text-slate-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pannello Admin
                </Link>
              )}
              {!user && (
                <Link 
                  to={createPageUrl('WorkshopRegister')}
                  className="block py-2 text-blue-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registra la tua officina
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">Workshop Connect</span>
            </div>
            <nav className="flex gap-6 text-sm text-slate-400">
              <Link to={createPageUrl('SearchWorkshops')} className="hover:text-white">
                Cerca Officine
              </Link>
              <Link to={createPageUrl('WorkshopRegister')} className="hover:text-white">
                Per le Officine
              </Link>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Workshop Connect. Tutti i diritti riservati.
          </div>
        </div>
      </footer>
    </div>
  );
}