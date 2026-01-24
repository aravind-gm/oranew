'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onChange,
  showValue = false,
  className = '',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {[...Array(maxRating)].map((_, index) => {
          const value = index + 1;
          const isFilled = value <= displayRating;
          const isHalf = !isFilled && value - 0.5 <= displayRating;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(value)}
              onMouseEnter={() => interactive && setHoverRating(value)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${
                interactive
                  ? 'cursor-pointer hover:scale-110 transition-transform'
                  : 'cursor-default'
              }`}
              disabled={!interactive}
              aria-label={`Rate ${value} stars`}
            >
              <Star
                size={size}
                className={`${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : isHalf
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'fill-none text-gray-300'
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
