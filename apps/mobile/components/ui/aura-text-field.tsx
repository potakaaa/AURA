import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type AuraTextFieldProps = React.ComponentProps<typeof Input> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  leadingIcon?: LucideIcon;
};

export function AuraTextField({
  label,
  helperText,
  errorText,
  leadingIcon,
  className,
  ...props
}: AuraTextFieldProps) {
  const hasError = Boolean(errorText);

  return (
    <View className="w-full gap-2">
      {label ? <Text variant="label">{label}</Text> : null}
      <View className="relative">
        {leadingIcon ? (
          <View className="absolute left-3 top-1/2 z-10 -translate-y-1/2">
            <Icon as={leadingIcon} className="text-muted-foreground" size={16} />
          </View>
        ) : null}
        <Input
          {...props}
          className={cn(
            'h-12 rounded-[20px] border-border bg-card px-4',
            leadingIcon && 'pl-10',
            hasError && 'border-destructive',
            className
          )}
        />
      </View>
      {errorText ? (
        <Text className="text-destructive text-sm">{errorText}</Text>
      ) : helperText ? (
        <Text className="text-muted-foreground text-sm">{helperText}</Text>
      ) : null}
    </View>
  );
}
