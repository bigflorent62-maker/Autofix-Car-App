import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Phone, 
  CheckCircle,
  Loader2,
  Crown,
  Check,
  Upload,
  X,
  ExternalLink
} from 'lucide-react';

const SERVICE_OPTIONS = [
  'Meccanica generale',
  'Elettrauto',
  'Carrozzeria',
  'Gommista',
  'Tagliando',
  'Revisione',
  'Climatizzatore',
  'Freni',
  'Sospensioni',
  'Cambio olio',
  'Diagnosi elettronica',
  'Riparazione motore'
];

export default function WorkshopRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    zone: '',
    services: [],
    hourly_rates: [],
    opening_hours: {
      lunedi: '08:00-18:00',
      martedi: '08:00-18:00',
      mercoledi: '08:00-18:00',
      giovedi: '08:00-18:00',
      venerdi: '08:00-18:00',
      sabato: '08:00-13:00',
      domenica: 'Chiuso'
    }
  });
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [created, setCreated] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createWorkshop = useMutation({
    mutationFn: async (data) => {
      const workshop = await base44.entities.Workshop.create(data);
      await base44.auth.updateMe({ 
        user_type: 'workshop',
        workshop_id: workshop.id 
      });
      return workshop;
    },
    onSuccess: () => setCreated(true),
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotos(prev => [...prev, file_url]);
    setUploadingPhoto(false);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const addRate = () => {
    if (formData.hourly_rates.length < 3) {
      setFormData(prev => ({
        ...prev,
        hourly_rates: [...prev.hourly_rates, { label: '', rate: '' }]
      }));
    }
  };

  const updateRate = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      hourly_rates: prev.hourly_rates.map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  const removeRate = (index) => {
    setFormData(prev => ({
      ...prev,
      hourly_rates: prev.hourly_rates.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    createWorkshop.mutate({
      ...formData,
      owner_email: user?.email,
      photos,
      is_premium: false,
      status: 'active'
    });
  };

  if (created) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Officina Registrata!</h2>
            <p className="text-slate-600 mb-6">
              La tua officina <strong>{formData.name}</strong> è ora attiva sulla piattaforma.
              Inizia a ricevere richieste di appuntamento!
            </p>
            <Button 
              onClick={() => navigate(createPageUrl('WorkshopDashboard'))}
              className="w-full"
            >
              Vai alla Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Informazioni Base'}
              {step === 2 && 'Servizi Offerti'}
              {step === 3 && 'Foto e Conferma'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Inserisci i dati della tua officina'}
              {step === 2 && 'Seleziona i servizi che offri'}
              {step === 3 && 'Aggiungi foto e completa la registrazione'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Officina *</Label>
                  <Input
                    id="name"
                    placeholder="es. Autofficina Rossi"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrivi la tua officina, la tua esperienza e i punti di forza..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="es. 02 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Indirizzo *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      placeholder="es. Via Roma 123"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const query = encodeURIComponent(`${formData.address} ${formData.city}`.trim());
                        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                      }}
                      disabled={!formData.address && !formData.city}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Verifica
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Clicca "Verifica" per controllare l'indirizzo su Google Maps
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Città *</Label>
                    <Input
                      id="city"
                      placeholder="es. Milano"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone">Zona/Quartiere</Label>
                    <Input
                      id="zone"
                      placeholder="es. Centro"
                      value={formData.zone}
                      onChange={(e) => setFormData({...formData, zone: e.target.value})}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => setStep(2)}
                  className="w-full"
                  disabled={!formData.name || !formData.phone || !formData.address || !formData.city}
                >
                  Continua
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Seleziona tutti i servizi che la tua officina può offrire
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_OPTIONS.map(service => (
                    <div 
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.services.includes(service)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.services.includes(service)}
                          onChange={() => {}}
                        />
                        <span className="text-sm">{service}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hourly Rates */}
                <div className="mt-6">
                  <Label>Tariffe orarie medie (opzionale, max 3)</Label>
                  <p className="text-sm text-slate-500 mb-3">
                    Inserisci le tue tariffe medie per dare trasparenza ai clienti
                  </p>
                  <div className="space-y-2">
                    {formData.hourly_rates.map((rate, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="es. Meccanica generale"
                          value={rate.label}
                          onChange={(e) => updateRate(index, 'label', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="€/ora"
                          value={rate.rate}
                          onChange={(e) => updateRate(index, 'rate', e.target.value)}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRate(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {formData.hourly_rates.length < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addRate}
                        className="w-full"
                      >
                        + Aggiungi tariffa
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Indietro
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    className="flex-1"
                    disabled={formData.services.length === 0}
                  >
                    Continua
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {/* Photos */}
                <div>
                  <Label>Foto dell'officina</Label>
                  <p className="text-sm text-slate-500 mb-3">
                    Aggiungi foto per rendere il tuo profilo più attraente
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400">
                      {uploadingPhoto ? (
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-slate-400 mb-1" />
                          <span className="text-xs text-slate-500">Aggiungi</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">Riepilogo</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>{formData.name}</strong></p>
                    <p className="text-slate-600">{formData.address}, {formData.city}</p>
                    <p className="text-slate-600">{formData.phone}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.services.slice(0, 4).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {formData.services.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{formData.services.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Premium Upsell */}
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Crown className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Piano Premium</h4>
                        <p className="text-sm text-slate-600 mb-2">
                          Ottieni maggiore visibilità con il posizionamento prioritario nei risultati di ricerca.
                        </p>
                        <p className="text-sm text-slate-500">
                          Puoi attivarlo in seguito dalla dashboard.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Indietro
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={createWorkshop.isPending}
                  >
                    {createWorkshop.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    Completa Registrazione
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}