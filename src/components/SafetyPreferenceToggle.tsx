import { Lock } from 'lucide-react';

export type SafetyPreference = 'balanced' | 'safer';

interface SafetyPreferenceToggleProps {
  value: SafetyPreference;
  onChange: (value: SafetyPreference) => void;
  className?: string;
}

const OPTIONS: Array<{
  value: SafetyPreference;
  label: string;
  helper: string;
}> = [
  {
    value: 'balanced',
    label: 'Equilibrado',
    helper: 'curadoria ampla',
  },
  {
    value: 'safer',
    label: 'Priorizar segurança',
    helper: 'mais rigor editorial',
  },
];

export const SafetyPreferenceToggle = ({
  value,
  onChange,
  className = '',
}: SafetyPreferenceToggleProps) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-[#5a3c28]">
        <Lock size={12} className="text-[#64a4ad]" />
        <span className="font-retro-pixel text-[9px] uppercase tracking-[0.18em] font-bold">
          Curadoria local
        </span>
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-xl border-2 border-[#5a3c28] bg-[#f3ecdb] shadow-[2px_2px_0px_#5a3c28]">
        {OPTIONS.map((option) => {
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={`px-2.5 py-2 text-left transition-colors ${
                isActive
                  ? option.value === 'safer'
                    ? 'bg-[#2c5e40] text-[#f3ecdb]'
                    : 'bg-[#64a4ad] text-[#f3ecdb]'
                  : 'bg-transparent text-[#5a3c28] hover:bg-black/5'
              }`}
            >
              <span className="block font-retro-body text-[11px] font-bold leading-none">
                {option.label}
              </span>
              <span className={`mt-0.5 block font-retro-pixel text-[8px] uppercase tracking-wide ${isActive ? 'text-[#f3ecdb]/80' : 'text-[#5a3c28]/60'}`}>
                {option.helper}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
