// Template för nya komponenter med hjälpsystem
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';
// Importera FormFieldWithHelp för enklare form-hantering
import { FormFieldWithHelp, useHelpSystem } from '@/utils/helpSystem';

interface ComponentProps {
  // Definiera props här
}

export function ComponentTemplate({ }: ComponentProps) {
  const { addHelpTooltip } = useHelpSystem();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Komponenttitel
            <HelpTooltip content={helpTexts.category.componentTitle} />
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Form-fält med hjälp - Alternativ 1: Manuell */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="field1">Fältnamn</Label>
            <HelpTooltip content={helpTexts.category.fieldName} />
          </div>
          <Input id="field1" />
        </div>

        {/* Form-fält med hjälp - Alternativ 2: Med wrapper */}
        <FormFieldWithHelp 
          label="Fältnamn"
          helpTextPath="category.fieldName"
          required
        >
          <Input />
        </FormFieldWithHelp>

        {/* Status/Badge med hjälp */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Badge variant="outline">Status</Badge>
            <HelpTooltip content={helpTexts.category.status} />
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Värde: 85</span>
            <HelpTooltip content={helpTexts.category.value} />
          </div>
        </div>

        {/* Action-knappar med hjälp */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <Button onClick={() => {}}>
              Primär åtgärd
            </Button>
            <HelpTooltip content={helpTexts.category.primaryAction} />
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="destructive" onClick={() => {}}>
              Radera
            </Button>
            <HelpTooltip content={helpTexts.category.deleteAction} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/*
CHECKLIST för denna komponent:
□ Hjälptexter tillagda i helpTexts.ts under 'category'
□ HelpTooltip importerad och använd
□ Alla viktiga element har hjälptooltips
□ Alla paths validerade med validateHelpTexts(['category.componentTitle', 'category.fieldName', ...])
□ Komponenten testad med hover
*/