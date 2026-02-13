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

  const userMessage = { role: "user", content: input };
  const updatedMessages = [...messages, userMessage];

  setMessages(updatedMessages);
  setInput("");
  setIsLoading(true);

 try {
  const response = await fetch("https://autofix-car-app.onrender.com/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      problem: userInput
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Errore server AI");
  }

  setMessages(prev => [
    ...prev,
    { role: "assistant", content: data.reply }
  ]);

} catch (error) {
  console.error(error);
  setMessages(prev => [
    ...prev,
    { role: "assistant", content: "Mi dispiace, si è verificato un errore. Riprova." }
  ]);
}
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
