import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Save, 
  Loader2,
  Crown,
  Upload,
  X,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function WorkshopSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: workshop, isLoading } = useQuery({
    queryKey: ['myWorkshop', user?.workshop_id],
    queryFn: async () => {
      const workshops = await base44.entities.Workshop.filter({ id: user.workshop_id });
      return workshops[0];
    },
    enabled: !!user?.workshop_id,
  });

  useEffect(() => {
    if (workshop) {
      setFormData({
        name: workshop.name || '',
        description: workshop.description || '',
        phone: workshop.phone || '',
        address: workshop.address || '',
        city: workshop.city || '',
        zone: workshop.zone || '',
        services: workshop.services || [],
        opening_hours: workshop.opening_hours || {}
      });
      setPhotos(workshop.photos || []);
    }
  }, [workshop]);

  const updateWorkshop = useMutation({
    mutationFn: (data) => base44.entities.Workshop.update(workshop.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWorkshop'] });
    },
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

  const handleSave = () => {
    updateWorkshop.mutate({
      ...formData,
      photos
    });
  };

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('WorkshopDashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Impostazioni Officina</h1>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Officina</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="address">Indirizzo</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Città</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="zone">Zona</Label>
                  <Input
                    id="zone"
                    value={formData.zone}
                    onChange={(e) => setFormData({...formData, zone: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Servizi Offerti</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Foto</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Premium */}
          <Card className={workshop.is_premium ? "border-yellow-300 bg-yellow-50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                Piano Premium
              </CardTitle>
              <CardDescription>
                {workshop.is_premium 
                  ? "Il tuo piano premium è attivo"
                  : "Attiva il piano premium per maggiore visibilità"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workshop.is_premium ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Premium Attivo</Badge>
                  {workshop.subscription_expires && (
                    <span className="text-sm text-slate-500">
                      Scade il {new Date(workshop.subscription_expires).toLocaleDateString('it-IT')}
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>✓ Posizionamento prioritario nei risultati</li>
                    <li>✓ Badge premium sul profilo</li>
                    <li>✓ Maggiore visibilità per i clienti</li>
                  </ul>
                  <Button className="bg-yellow-500 hover:bg-yellow-600">
                    Attiva Premium - €99/anno
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSave}
            className="w-full"
            size="lg"
            disabled={updateWorkshop.isPending}
          >
            {updateWorkshop.isPending ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Salva Modifiche
          </Button>
        </div>
      </div>
    </div>
  );
}