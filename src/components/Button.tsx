import type { PropsWithChildren, ReactNode } from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Button = ({ children, ...restProps }: ButtonProps) => {
  return (
    <button type="button" {...restProps}>
      {children}
    </button>
  );
};

export const CircularButton = ({
  children,
  className,
  ...restProps
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      data-component="circular-button"
      type="button"
      {...restProps}
      className={`flex items-center justify-center w-9 h-9 p-2 hover:bg-muted/60 hover:text-text transition-colors rounded-full ${className || ''}`}
    >
      {children}
    </button>
  );
};
