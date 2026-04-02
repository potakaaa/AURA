import { Button, type ButtonProps } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';

type AuraButtonVariant = 'primary' | 'secondary' | 'tertiary';

type AuraButtonProps = Omit<ButtonProps, 'variant'> & {
  label: string;
  icon?: LucideIcon;
  auraVariant?: AuraButtonVariant;
};

const AURA_VARIANT_STYLES: Record<AuraButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-transparent',
};

const AURA_TEXT_STYLES: Record<AuraButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  tertiary: 'text-foreground',
};

const BASE_BUTTON_VARIANT: Record<AuraButtonVariant, NonNullable<ButtonProps['variant']>> = {
  primary: 'default',
  secondary: 'secondary',
  tertiary: 'ghost',
};

export function AuraButton({
  auraVariant = 'primary',
  icon,
  label,
  className,
  ...props
}: AuraButtonProps) {
  return (
    <Button
      {...props}
      variant={BASE_BUTTON_VARIANT[auraVariant]}
      className={cn(
        'h-11 rounded-[20px] px-5',
        AURA_VARIANT_STYLES[auraVariant],
        auraVariant === 'tertiary' && 'shadow-none',
        className
      )}>
      <Text variant="label" className={AURA_TEXT_STYLES[auraVariant]}>
        {label}
      </Text>
      {icon ? <Icon as={icon} size={16} className={AURA_TEXT_STYLES[auraVariant]} /> : null}
    </Button>
  );
}

export function AuraButtonPreview() {
  return (
    <>
      <AuraButton label="Primary" />
      <AuraButton label="Secondary" auraVariant="secondary" />
      <AuraButton label="Tertiary" auraVariant="tertiary" />
    </>
  );
}
