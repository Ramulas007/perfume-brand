import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArrowDotsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

/**
 * Animated "arrow dots" order button.
 * Dots slide across the icon slot on hover to suggest forward motion.
 * Styles live in src/index.css under the `.b05-*` prefix.
 */
export const ArrowDotsButton = React.forwardRef<HTMLButtonElement, ArrowDotsButtonProps>(
  ({ label = 'Order Now', className, disabled, ...rest }, ref) => {
    const dotValues = [2, 1, 0, 1, 2];

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn('b05-button', className)}
        data-disabled={disabled ? 'true' : undefined}
        {...rest}
      >
        <span className="b05-bg" />
        <span className="b05-inner" data-text={label}>
          <ShoppingBag className="b05-bag" aria-hidden="true" strokeWidth={2.2} />
          <span className="b05-text">{label}</span>
          <span className="b05-icon-wrap" aria-hidden="true">
            {[3, 2, 1, 0].map((indexParent) => (
              <span
                key={`icon-${indexParent}`}
                className="b05-icon"
                style={{ ['--index-parent' as any]: indexParent } as React.CSSProperties}
              >
                {dotValues.map((value, i) => (
                  <span
                    key={`dot-${i}`}
                    className="b05-dot"
                    style={{ ['--index' as any]: value } as React.CSSProperties}
                  />
                ))}
              </span>
            ))}
          </span>
        </span>
      </button>
    );
  },
);
ArrowDotsButton.displayName = 'ArrowDotsButton';

export default ArrowDotsButton;
