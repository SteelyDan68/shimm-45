/**
 * 🎯 CLIENT SETTINGS PAGE - Inställningar för klienter
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Smartphone, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientSettings = () => {
  const navigate = useNavigate();

  const settingsOptions = [
    {
      id: 'profile',
      title: 'Min Profil',
      description: 'Hantera din personliga information och inställningar',
      icon: User,
      href: '/edit-profile',
      color: 'text-blue-600'
    },
    {
      id: 'mobile',
      title: 'Mobil',
      description: 'Mobila inställningar och app-konfiguration',
      icon: Smartphone,
      href: '/mobile',
      color: 'text-green-600'
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Inställningar
          </h1>
          <p className="text-muted-foreground">
            Hantera dina personliga inställningar och preferenser
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {settingsOptions.map((option) => (
            <Card key={option.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(option.href)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${option.color}`}>
                    <option.icon className="h-6 w-6" />
                  </div>
                  {option.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  {option.description}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Öppna inställningar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;