"use client";

import React, { useState } from "react";
import { Check, Info } from "lucide-react";
import {
  LICENSE_DESCRIPTIONS,
  DEFAULT_LICENSE_SETTINGS,
  hasCommercialUse,
  hasDerivativesAllowed,
  hasAttributionRequired,
  hasRevenueSharing,
  hasFreeLicense,
  type LicenseType,
  type LicenseSettings
} from "@/lib/license/terms";

interface LicenseSelectorProps {
  selectedLicense?: LicenseSettings;
  onLicenseChange: (license: LicenseSettings) => void;
  className?: string;
}

export function LicenseSelector({ selectedLicense = DEFAULT_LICENSE_SETTINGS, onLicenseChange, className = "" }: LicenseSelectorProps) {
  const [showDetails, setShowDetails] = useState<LicenseType | null>(null);

  const handleLicenseSelect = (pilType: LicenseType) => {
    const newLicense: LicenseSettings = {
      ...DEFAULT_LICENSE_SETTINGS,
      pilType,
      commercialUse: pilType === 'commercial_use' || pilType === 'commercial_remix',
      derivativesAllowed: pilType !== 'commercial_use',
      derivativesAttribution: pilType === 'non_commercial_remix' || pilType === 'commercial_remix',
      attribution: pilType !== 'open_use',
      revShare: pilType === 'commercial_remix' ? 10 : 0,
    };
    onLicenseChange(newLicense);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
        Pilih Jenis Lisensi IP
      </div>

      <div className="grid gap-3">
        {(Object.keys(LICENSE_DESCRIPTIONS) as LicenseType[]).map((licenseType) => {
          const license = LICENSE_DESCRIPTIONS[licenseType];
          const isSelected = selectedLicense.pilType === licenseType;

          return (
            <div key={licenseType} className="relative">
              <button
                onClick={() => handleLicenseSelect(licenseType)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "border-purple-400/60 bg-purple-500/10 ring-1 ring-purple-400/30"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">{license.icon}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{license.title}</h3>
                      {isSelected && (
                        <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-white/70 mb-2">{license.description}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {license.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/10 text-white/80"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(showDetails === licenseType ? null : licenseType);
                    }}
                    className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white/80"
                    title="Show details"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </button>

              {/* License details dropdown */}
              {showDetails === licenseType && (
                <div className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm z-10 text-sm">
                  <h4 className="font-medium mb-2 text-white">Detail Lisensi:</h4>
                  <ul className="space-y-1 text-white/70">
                    <li>• <strong>Penggunaan Komersial:</strong> {hasCommercialUse(licenseType) ? 'Diizinkan' : 'Tidak diizinkan'}</li>
                    <li>• <strong>Karya Turunan:</strong> {hasDerivativesAllowed(licenseType) ? 'Diizinkan' : 'Tidak diizinkan'}</li>
                    <li>• <strong>Atribusi:</strong> {hasAttributionRequired(licenseType) ? 'Diperlukan' : 'Tidak diperlukan'}</li>
                    <li>• <strong>Berbagi Pendapatan:</strong> {hasRevenueSharing(licenseType) ? 'Ya' : 'Tidak'}</li>
                    <li>• <strong>Biaya:</strong> {hasFreeLicense(licenseType) ? 'Gratis' : 'Berbayar'}</li>
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected license summary */}
      {selectedLicense && (
        <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-400/20">
          <div className="text-sm font-medium text-purple-300 mb-2">Lisensi Terpilih:</div>
          <div className="text-sm text-white/80">
            <span className="font-medium">{LICENSE_DESCRIPTIONS[selectedLicense.pilType].title}</span>
            {selectedLicense.commercialUse && (
              <span className="ml-2 px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-xs">Komersial</span>
            )}
            {selectedLicense.derivativesAllowed && (
              <span className="ml-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs">Turunan OK</span>
            )}
            {selectedLicense.revShare > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-xs">{selectedLicense.revShare}% Bagi Hasil</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
