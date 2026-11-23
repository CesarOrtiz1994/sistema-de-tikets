import { useState, useEffect } from 'react';

type TimeUnit = 'minutes' | 'hours' | 'days';

interface TimeInputProps {
  label: string;
  value: number | null | undefined;
  onChange: (minutes: number | null) => void;
  required?: boolean;
  error?: string;
  allowNull?: boolean;
  /** Unidades disponibles, por defecto todas */
  units?: TimeUnit[];
}

function toMinutes(value: number, unit: TimeUnit): number {
  if (unit === 'hours') return value * 60;
  if (unit === 'days') return value * 1440;
  return value;
}

function detectUnit(minutes: number, availableUnits: TimeUnit[]): { value: number; unit: TimeUnit } {
  if (availableUnits.includes('days') && minutes >= 1440 && minutes % 1440 === 0) {
    return { value: minutes / 1440, unit: 'days' };
  }
  if (availableUnits.includes('hours') && minutes >= 60 && minutes % 60 === 0) {
    return { value: minutes / 60, unit: 'hours' };
  }
  return { value: minutes, unit: 'minutes' };
}

const UNIT_LABELS: Record<TimeUnit, string> = {
  minutes: 'min',
  hours: 'horas',
  days: 'días',
};

export default function TimeInput({
  label,
  value,
  onChange,
  required = false,
  error,
  allowNull = false,
  units = ['minutes', 'hours', 'days'],
}: TimeInputProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [unit, setUnit] = useState<TimeUnit>('minutes');

  useEffect(() => {
    if (value == null) {
      setInputValue('');
      setUnit('minutes');
    } else {
      const detected = detectUnit(value, units);
      setInputValue(String(detected.value));
      setUnit(detected.unit);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleValueChange = (raw: string) => {
    setInputValue(raw);
    const parsed = parseFloat(raw);
    if (raw === '' || isNaN(parsed)) {
      onChange(allowNull ? null : 0);
    } else {
      onChange(toMinutes(parsed, unit));
    }
  };

  const handleUnitChange = (newUnit: TimeUnit) => {
    setUnit(newUnit);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(toMinutes(parsed, newUnit));
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && '*'}
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          required={required}
          value={inputValue}
          onChange={(e) => handleValueChange(e.target.value)}
          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="0"
        />
        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value as TimeUnit)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {UNIT_LABELS[u]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
