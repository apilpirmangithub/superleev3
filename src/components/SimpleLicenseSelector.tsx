"use client";

import { LICENSE_PRESETS, type LicensePreset } from "@/hooks/useSimpleRegisterIP";

interface SimpleLicenseSelectorProps {
  selected?: LicensePreset;
  onChange: (preset: LicensePreset) => void;
  className?: string;
}

export function SimpleLicenseSelector({ selected, onChange, className = "" }: SimpleLicenseSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-sm font-medium text-white/80 mb-3">Choose License Type:</div>
      
      {Object.entries(LICENSE_PRESETS).map(([key, preset]) => (
        <button
          key={key}
          onClick={() => onChange(key as LicensePreset)}
          className={`
            w-full p-4 rounded-2xl border text-left transition-all duration-200
            ${selected === key 
              ? 'border-sky-400 bg-sky-400/10 ring-1 ring-sky-400/30' 
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium text-white mb-1">
                {preset.name}
              </div>
              <div className="text-sm text-white/60">
                {preset.description}
              </div>
            </div>
            
            <div className={`
              w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ml-3
              ${selected === key 
                ? 'border-sky-400 bg-sky-400' 
                : 'border-white/30'
              }
            `}>
              {selected === key && (
                <div className="w-full h-full rounded-full bg-white scale-50" />
              )}
            </div>
          </div>
          
          {/* License details */}
          <div className="mt-3 text-xs text-white/50 space-y-1">
            {key === 'open' && (
              <>
                <div>✅ Commercial use allowed</div>
                <div>✅ AI training allowed</div>
                <div>✅ Free to use</div>
              </>
            )}
            {key === 'remix' && (
              <>
                <div>✅ Modifications allowed</div>
                <div>❌ Commercial use restricted</div>
                <div>✅ AI training allowed</div>
              </>
            )}
            {key === 'commercial' && (
              <>
                <div>✅ Commercial use allowed</div>
                <div>💰 10% revenue share required</div>
                <div>❌ AI training not allowed</div>
              </>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
