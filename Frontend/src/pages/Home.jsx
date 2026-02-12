import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  MessageCircle, 
  Wrench, 
  Star, 
  MapPin, 
  CheckCircle,
  ArrowRight,
  Car
} from 'lucide-react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    window.location.href = createPageUrl('SearchWorkshops') + `?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920')] bg-cover bg-center opacity-20" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              La piattaforma per la tua auto
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Diagnosi AI, recensioni verificate e prenotazione semplice. 
              Tutto in un'unica piattaforma.
            </p>
            
            {/* Two main action buttons */}
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
              <Link to={createPageUrl('AIDiagnosis')}>
                <Card className="border-2 border-white/20 bg-white/10 backdrop-blur hover:bg-white/20 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4 mx-auto">
                      <MessageCircle className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Non sai qual è il problema?</h3>
                    <p className="text-blue-100 text-sm">
                      L'assistente AI ti guida nella diagnosi
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl('SearchWorkshops')}>
                <Card className="border-2 border-white/20 bg-white/10 backdrop-blur hover:bg-white/20 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4 mx-auto">
                      <Wrench className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Sai già cosa ti serve?</h3>
                    <p className="text-blue-100 text-sm">
                      Cerca officine e prenota direttamente
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Search bar below */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Cerca per città o zona..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12 text-lg bg-white text-slate-900"
                />
              </div>
              <Button 
                onClick={handleSearch}
                size="lg" 
                className="h-12 px-8 bg-orange-500 hover:bg-orange-600"
              >
                <Search className="mr-2 h-5 w-5" />
                Cerca
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Perché sceglierci
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Che tu sappia già cosa serve alla tua auto o abbia bisogno di aiuto per capirlo, 
            ti guidiamo verso la soluzione migliore.
          </p>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-semibold">Recensioni Verificate</p>
              <p className="text-sm text-slate-500">Solo clienti reali</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="font-semibold">Valutazioni Trasparenti</p>
              <p className="text-sm text-slate-500">Approvate dall'admin</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-semibold">Chat Diretta</p>
              <p className="text-sm text-slate-500">Comunica con l'officina</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-semibold">Diagnosi AI</p>
              <p className="text-sm text-slate-500">Scopri il problema</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Workshops */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sei un'officina?
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Unisciti alla nostra piattaforma e raggiungi nuovi clienti. 
            Iscrizione base gratuita, piano premium per massima visibilità.
          </p>
          <Link to={createPageUrl('WorkshopRegister')}>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              Registra la tua officina
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}