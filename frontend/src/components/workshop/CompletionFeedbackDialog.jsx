import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const CAR_COMPONENTS = [
  'Motore',
  'Trasmissione/Cambio',
  'Freni',
  'Sospensioni',
  'Sterzo',
  'Impianto elettrico',
  'Batteria',
  'Alternatore',
  'Motorino avviamento',
  'Radiatore',
  'Pompa acqua',
  'Termostato',
  'Climatizzatore',
  'Compressore AC',
  'Filtro aria',
  'Filtro olio',
  'Filtro carburante',
  'Candele',
  'Bobine',
  'Iniettori',
  'Pompa carburante',
  'Sensori motore',
  'Centralina ECU',
  'Turbo',
  'Scarico/Marmitta',
  'Catalizzatore',
  'Cinghia distribuzione',
  'Cinghia servizi',
  'Frizione',
  'Volano',
  'Ammortizzatori',
  'Molle',
  'Bracci oscillanti',
  'Giunti omocinetici',
  'Cuscinetti ruota',
  'Pneumatici',
  'Cerchi',
  'Pastiglie freni',
  'Dischi freni',
  'Pinze freni',
  'Pompa freni',
  'Servosterzo',
  'Cremagliera',
  'Testata',
  'Guarnizione testata',
  'Altro'
];

export default function CompletionFeedbackDialog({ 
  open, 
  onOpenChange, 
  appointment, 
  onSubmit, 
  isLoading 
}) {
  const [diagnosisCorrect, setDiagnosisCorrect] = useState(null);
  const [actualComponent, setActualComponent] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [amountSpent, setAmountSpent] = useState('');

  const handleSubmit = () => {
    onSubmit({
      diagnosis_correct: diagnosisCorrect === 'yes',
      actual_component: diagnosisCorrect === 'no' ? actualComponent : null,
      additional_notes: additionalNotes || null,
      original_diagnosis: appointment?.diagnosis,
      service_category: appointment?.service_requested,
      amount_spent: parseFloat(amountSpent) || 0
    });
  };

  const canSubmit = diagnosisCorrect !== null && 
    (diagnosisCorrect === 'yes' || (diagnosisCorrect === 'no' && actualComponent)) &&
    amountSpent && parseFloat(amountSpent) >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chiusura Lavoro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Show original diagnosis if available */}
          {appointment?.diagnosis && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Diagnosi iniziale:</strong> {appointment.diagnosis}
              </p>
            </div>
          )}

          {/* Diagnosis correct question */}
          <div className="space-y-3">
            <Label className="text-base font-medium">La diagnosi era corretta?</Label>
            <RadioGroup value={diagnosisCorrect} onValueChange={setDiagnosisCorrect}>
              <div className="flex gap-4">
                <div 
                  className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    diagnosisCorrect === 'yes' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setDiagnosisCorrect('yes')}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes" className="flex items-center gap-2 cursor-pointer">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Sì
                    </Label>
                  </div>
                </div>
                <div 
                  className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    diagnosisCorrect === 'no' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setDiagnosisCorrect('no')}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no" className="flex items-center gap-2 cursor-pointer">
                      <XCircle className="h-5 w-5 text-red-500" />
                      No
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Component selection if diagnosis was wrong */}
          {diagnosisCorrect === 'no' && (
            <div className="space-y-2">
              <Label>Che componente era il problema?</Label>
              <Select value={actualComponent} onValueChange={setActualComponent}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona componente..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {CAR_COMPONENTS.map(component => (
                    <SelectItem key={component} value={component}>
                      {component}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount spent */}
          <div className="space-y-2">
            <Label>Importo speso dal cliente (€) *</Label>
            <Input
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={amountSpent}
              onChange={(e) => setAmountSpent(e.target.value)}
            />
          </div>

          {/* Additional notes */}
          <div className="space-y-2">
            <Label>Altre informazioni (opzionale)</Label>
            <Textarea
              placeholder="Note aggiuntive sul lavoro svolto..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Completa Lavoro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}