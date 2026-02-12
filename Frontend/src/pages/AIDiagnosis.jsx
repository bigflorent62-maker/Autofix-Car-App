import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Send, 
  Car, 
  Loader2,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  Building2,
  Star,
  MapPin
} from 'lucide-react';

export default function AIDiagnosis() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ciao! Sono qui per aiutarti a capire il problema della tua auto e trovare l\'officina giusta.\n\nIniziamo: che auto hai? (marca, modello e anno)' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [recommendedWorkshop, setRecommendedWorkshop] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Estrai info veicolo se non presente
      if (!vehicleInfo) {
        const vehicleResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Estrai informazioni veicolo da: "${userInput}"
          
Accetta errori di battitura e formati diversi.
Esempi: "fiat punto 2015" → marca: Fiat, modello: Punto, anno: 2015`,
          response_json_schema: {
            type: 'object',
            properties: {
              marca: { type: 'string' },
              modello: { type: 'string' },
              anno: { type: 'number' }
            }
          }
        });

        if (vehicleResponse.marca && vehicleResponse.modello && vehicleResponse.anno) {
          setVehicleInfo(vehicleResponse);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Perfetto: ${vehicleResponse.marca} ${vehicleResponse.modello} ${vehicleResponse.anno}.\n\nOra dimmi: quando e come si manifesta il problema?` 
          }]);
        } else {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Scusa, non ho capito. Indica marca, modello e anno (es: Fiat Punto 2015)' 
          }]);
        }
      } 
      // Diagnosi e ricerca officina
      else if (vehicleInfo && !diagnosis) {
        const chatHistory = messages
          .map(m => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`)
          .join('\n\n');

        const diagnosisResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Sei un assistente per diagnosi auto. Devi essere RAPIDO ed EFFICIENTE.

Veicolo: ${vehicleInfo.marca} ${vehicleInfo.modello} ${vehicleInfo.anno}

Conversazione:
${chatHistory}

Messaggio: "${userInput}"

REGOLE FERREE:
- Massimo 2 domande brevi per messaggio
- Massimo 4 scambi totali per diagnosi
- Dopo aver identificato il problema, chiedi SUBITO: "In che città/zona ti trovi?"
- Quando ricevi la località (anche solo il nome della città), COMPLETA SUBITO la diagnosi

RICONOSCIMENTO LOCALITÀ:
- Qualsiasi nome di città italiana è valido (Milano, Roma, Torino, Bologna, ecc.)
- Anche zone/quartieri vanno bene
- Se l'utente scrive solo il nome città, è sufficiente → diagnosi_completa: true

FLUSSO:
1-4) Fai domande essenziali (quando? come? sempre?)
5) Identifica servizio + chiedi località
6) Quando hai la località → COMPLETA IMMEDIATAMENTE con diagnosi_completa: true

Categorie: "Meccanica generale", "Elettrauto", "Carrozzeria", "Gommista", "Tagliando", "Revisione", "Climatizzatore", "Freni"

Output quando hai la località:
- diagnosi_completa: true
- categoria_servizio: categoria corretta
- sintesi_problema: breve descrizione
- citta_utente: estrai la città dal messaggio

Output senza località:
- diagnosi_completa: false
- risposta: domanda breve`,
          response_json_schema: {
            type: 'object',
            properties: {
              risposta: { type: 'string' },
              diagnosi_completa: { type: 'boolean' },
              categoria_servizio: { type: 'string' },
              sintesi_problema: { type: 'string' },
              citta_utente: { type: 'string' }
            }
          }
        });

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: diagnosisResponse.risposta 
        }]);

        // Se diagnosi completa, cerca officina
        if (diagnosisResponse.diagnosi_completa && diagnosisResponse.categoria_servizio) {
          setDiagnosis({
            category: diagnosisResponse.categoria_servizio,
            summary: diagnosisResponse.sintesi_problema
          });
          
          // Cerca officina più adatta
          const workshops = await base44.entities.Workshop.filter({ status: 'active' });
          
          let qualifiedWorkshops = workshops.filter(w => 
            w.services?.includes(diagnosisResponse.categoria_servizio)
          );

          // Filtra per città se fornita
          if (diagnosisResponse.citta_utente) {
            const cityMatch = qualifiedWorkshops.filter(w => 
              w.city?.toLowerCase().includes(diagnosisResponse.citta_utente.toLowerCase())
            );
            if (cityMatch.length > 0) {
              qualifiedWorkshops = cityMatch;
            }
          }

          // Ordina per rating nella categoria specifica
          qualifiedWorkshops.sort((a, b) => {
            const ratingA = a.category_ratings?.[diagnosisResponse.categoria_servizio]?.rating || a.average_rating || 0;
            const ratingB = b.category_ratings?.[diagnosisResponse.categoria_servizio]?.rating || b.average_rating || 0;
            return ratingB - ratingA;
          });

          if (qualifiedWorkshops.length > 0) {
            const bestWorkshop = qualifiedWorkshops[0];
            setRecommendedWorkshop(bestWorkshop);
            
            const rating = bestWorkshop.category_ratings?.[diagnosisResponse.categoria_servizio]?.rating || bestWorkshop.average_rating || 0;
            const reviewCount = bestWorkshop.category_ratings?.[diagnosisResponse.categoria_servizio]?.count || bestWorkshop.total_reviews || 0;
            
            setTimeout(() => {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `✅ **Intervento consigliato:** ${diagnosisResponse.categoria_servizio}\n\n🏆 **Officina suggerita:**\n${bestWorkshop.name}\n📍 ${bestWorkshop.city}${bestWorkshop.zone ? `, ${bestWorkshop.zone}` : ''}\n⭐ ${rating.toFixed(1)}/5 (${reviewCount} recensioni)\n\nClicca sul pulsante qui sotto per prenotare!` 
              }]);
            }, 500);
          } else {
            setTimeout(() => {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Non ci sono officine registrate nella sua zona.' 
              }]);
            }, 500);
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Mi dispiace, si è verificato un errore. Riprova.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookWorkshop = () => {
    if (recommendedWorkshop && diagnosis) {
      sessionStorage.setItem('aiChatHistory', JSON.stringify(messages));
      sessionStorage.setItem('vehicleInfo', JSON.stringify(vehicleInfo));
      sessionStorage.setItem('diagnosisSummary', diagnosis.summary);
      sessionStorage.setItem('serviceCategory', diagnosis.category);
      
      navigate(createPageUrl('BookAppointment') + `?workshop=${recommendedWorkshop.id}&diagnosis=${encodeURIComponent(diagnosis.summary)}`);
    }
  };

  const handleReset = () => {
    setMessages([
      { role: 'assistant', content: 'Ciao! Sono qui per aiutarti a capire il problema della tua auto e trovare l\'officina giusta.\n\nIniziamo: che auto hai? (marca, modello e anno)' }
    ]);
    setVehicleInfo(null);
    setDiagnosis(null);
    setRecommendedWorkshop(null);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="mr-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold">Diagnosi AI</h1>
              <p className="text-sm text-slate-500">
                {vehicleInfo ? `${vehicleInfo.marca} ${vehicleInfo.modello} ${vehicleInfo.anno}` : 'Assistente virtuale'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Ricomincia
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[85%] ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                <CardContent className="p-3">
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </CardContent>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-white">
                <CardContent className="p-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Booking CTA */}
      {recommendedWorkshop && diagnosis && (
        <div className="bg-green-50 border-t border-green-200 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <Button 
              onClick={handleBookWorkshop}
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
            >
              <Building2 className="mr-2 h-5 w-5" />
              Prenota appuntamento presso {recommendedWorkshop.name}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={vehicleInfo ? "Descrivi il problema..." : "es: Fiat Punto 2015"}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}