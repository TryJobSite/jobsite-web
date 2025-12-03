'use client';

import * as React from 'react';
import { type LucideIcon, X } from 'lucide-react';
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  type MouseEventHandler,
  useContext,
  useState,
} from 'react';
import { Button } from './button';
import { cn } from '@/utils/cn';

type BannerContextProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

export const BannerContext = createContext<BannerContextProps>({
  show: true,
  setShow: () => {},
});

export type BannerProps = HTMLAttributes<HTMLDivElement> & {
  visible?: boolean;
  defaultVisible?: boolean;
  onClose?: () => void;
  inset?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
};

export const Banner = ({
  children,
  visible,
  defaultVisible = true,
  onClose,
  className,
  inset = false,
  variant = 'default',
  ...props
}: BannerProps) => {
  const [internalShow, setInternalShow] = useState(defaultVisible);
  const show = visible !== undefined ? visible : internalShow;

  const handleClose = () => {
    if (visible === undefined) {
      setInternalShow(false);
    }
    onClose?.();
  };

  if (!show) {
    return null;
  }

  const variantStyles = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-500 text-white',
    error: 'bg-red-600 text-white',
  };

  return (
    <BannerContext.Provider value={{ show, setShow: handleClose }}>
      <div
        className={cn(
          'flex w-full items-center justify-between gap-2 px-4 py-2',
          variantStyles[variant],
          inset && 'rounded-lg',
          className
        )}
        {...(props as any)}
      >
        {children}
      </div>
    </BannerContext.Provider>
  );
};

export type BannerIconProps = HTMLAttributes<HTMLDivElement> & {
  icon: LucideIcon;
};

export const BannerIcon = ({ icon: Icon, className, ...props }: BannerIconProps) => (
  <div
    className={cn('rounded-full border border-background/20 bg-background/10 p-1 shadow-sm', className)}
    {...(props as any)}
  >
    <Icon size={16} />
  </div>
);

export type BannerTitleProps = HTMLAttributes<HTMLParagraphElement>;

export const BannerTitle = ({ className, ...props }: BannerTitleProps) => (
  <p className={cn('flex-1 text-sm', className)} {...(props as any)} />
);

export type BannerActionProps = ComponentProps<typeof Button>;

export const BannerAction = ({
  variant = 'outline',
  size = 'sm',
  className,
  ...props
}: BannerActionProps) => (
  <Button
    className={cn('shrink-0 bg-transparent hover:bg-background/10 hover:text-background', className)}
    size={size}
    variant={variant}
    {...props}
  />
);

export type BannerCloseProps = ComponentProps<typeof Button>;

export const BannerClose = ({
  variant = 'ghost',
  size = 'icon',
  onClick,
  className,
  ...props
}: BannerCloseProps) => {
  const { setShow } = useContext(BannerContext);
  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setShow(false);
    onClick?.(e);
  };
  return (
    <Button
      className={cn('shrink-0 bg-transparent hover:bg-background/10 hover:text-background', className)}
      onClick={handleClick}
      size={size}
      variant={variant}
      {...props}
    >
      <X size={18} />
    </Button>
  );
};
