'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  step?: number;
  onChange: (min: number, max: number) => void;
  formatValue?: (value: number) => string;
}

export default function PriceRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  step = 1000,
  onChange,
  formatValue = (v) => `₹${v.toLocaleString()}`,
}: PriceRangeSliderProps) {
  const [localMin, setLocalMin] = useState(minValue);
  const [localMax, setLocalMax] = useState(maxValue);
  const [isDragging, setIsDragging] = useState(false);
  const rangeRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync with props
  useEffect(() => {
    setLocalMin(minValue);
    setLocalMax(maxValue);
  }, [minValue, maxValue]);

  // Debounced onChange
  const debouncedOnChange = useCallback(
    (newMin: number, newMax: number) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange(newMin, newMax);
      }, 300);
    },
    [onChange]
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), localMax - step);
    setLocalMin(value);
    debouncedOnChange(value, localMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), localMin + step);
    setLocalMax(value);
    debouncedOnChange(localMin, value);
  };

  // Calculate positions for visual range
  const minPercent = ((localMin - min) / (max - min)) * 100;
  const maxPercent = ((localMax - min) / (max - min)) * 100;

  // Preset price ranges
  const presets = [
    { label: 'Under ₹5K', min: 0, max: 5000 },
    { label: '₹5K - ₹15K', min: 5000, max: 15000 },
    { label: '₹15K - ₹30K', min: 15000, max: 30000 },
    { label: '₹30K - ₹50K', min: 30000, max: 50000 },
    { label: 'Above ₹50K', min: 50000, max: 100000 },
  ];

  const applyPreset = (preset: { min: number; max: number }) => {
    setLocalMin(preset.min);
    setLocalMax(preset.max);
    onChange(preset.min, preset.max);
  };

  return (
    <div className="space-y-4">
      {/* Display Values */}
      <div className="flex items-center justify-between text-sm">
        <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
          <span className="text-gray-600">Min:</span>{' '}
          <span className="font-semibold text-gray-900">{formatValue(localMin)}</span>
        </div>
        <div className="text-gray-400">—</div>
        <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
          <span className="text-gray-600">Max:</span>{' '}
          <span className="font-semibold text-gray-900">{formatValue(localMax)}</span>
        </div>
      </div>

      {/* Dual Range Slider */}
      <div className="relative h-6 flex items-center" ref={rangeRef}>
        {/* Track Background */}
        <div className="absolute w-full h-2 bg-gray-200 rounded-full" />
        
        {/* Active Range */}
        <div
          className="absolute h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={handleMinChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none 
                     [&::-webkit-slider-thumb]:pointer-events-auto
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-amber-500
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-md
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-moz-range-thumb]:pointer-events-auto
                     [&::-moz-range-thumb]:appearance-none
                     [&::-moz-range-thumb]:w-5
                     [&::-moz-range-thumb]:h-5
                     [&::-moz-range-thumb]:bg-white
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-amber-500
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:shadow-md"
          style={{ zIndex: localMin > max - 100 ? 5 : 3 }}
        />

        {/* Max Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={handleMaxChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none
                     [&::-webkit-slider-thumb]:pointer-events-auto
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-orange-500
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-md
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-moz-range-thumb]:pointer-events-auto
                     [&::-moz-range-thumb]:appearance-none
                     [&::-moz-range-thumb]:w-5
                     [&::-moz-range-thumb]:h-5
                     [&::-moz-range-thumb]:bg-white
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-orange-500
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:shadow-md"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">Quick Select:</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                localMin === preset.min && localMax === preset.max
                  ? 'bg-amber-100 border-amber-400 text-amber-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
          <input
            type="number"
            value={localMin}
            onChange={(e) => {
              const value = Math.max(min, Math.min(Number(e.target.value), localMax - step));
              setLocalMin(value);
              debouncedOnChange(value, localMax);
            }}
            min={min}
            max={max}
            step={step}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
          <input
            type="number"
            value={localMax}
            onChange={(e) => {
              const value = Math.min(max, Math.max(Number(e.target.value), localMin + step));
              setLocalMax(value);
              debouncedOnChange(localMin, value);
            }}
            min={min}
            max={max}
            step={step}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
