import { cn } from '@/lib/utils';
import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

const textVariants = cva(
  cn(
    'text-foreground text-base',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        display: cn('text-5xl font-extrabold tracking-tight', Platform.select({ web: 'text-balance' })),
        headline: cn('text-3xl font-bold tracking-tight', Platform.select({ web: 'text-balance' })),
        title: 'text-xl font-bold tracking-tight',
        body: 'text-base font-medium leading-6',
        label: 'text-sm font-semibold tracking-tight',
        h1: cn(
          'text-center text-4xl font-extrabold tracking-tight',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        h2: cn(
          'border-border border-b pb-2 text-3xl font-bold tracking-tight',
          Platform.select({ web: 'scroll-m-20 first:mt-0' })
        ),
        h3: cn('text-2xl font-bold tracking-tight', Platform.select({ web: 'scroll-m-20' })),
        h4: cn('text-xl font-bold tracking-tight', Platform.select({ web: 'scroll-m-20' })),
        p: 'mt-3 font-medium leading-7 sm:mt-6',
        blockquote: 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6',
        code: cn(
          'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-bold'
        ),
        lead: 'text-muted-foreground text-xl font-medium',
        large: 'text-lg font-bold',
        small: 'text-sm font-semibold leading-none',
        muted: 'text-muted-foreground text-sm font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  display: 'heading',
  headline: 'heading',
  title: 'heading',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  display: '1',
  headline: '2',
  title: '3',
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

const FONT_FAMILY_BY_VARIANT: Record<TextVariant, string> = {
  default: 'Manrope_500Medium',
  display: 'Manrope_800ExtraBold',
  headline: 'Manrope_700Bold',
  title: 'Manrope_700Bold',
  body: 'Manrope_500Medium',
  label: 'Manrope_600SemiBold',
  h1: 'Manrope_800ExtraBold',
  h2: 'Manrope_700Bold',
  h3: 'Manrope_700Bold',
  h4: 'Manrope_700Bold',
  p: 'Manrope_500Medium',
  blockquote: 'Manrope_500Medium',
  code: 'Manrope_700Bold',
  lead: 'Manrope_500Medium',
  large: 'Manrope_700Bold',
  small: 'Manrope_600SemiBold',
  muted: 'Manrope_500Medium',
};

function Text({
  className,
  asChild = false,
  variant = 'default',
  style,
  ...props
}: React.ComponentProps<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  const resolvedVariant = (variant ?? 'default') as TextVariant;

  return (
    <Component
      className={cn(textVariants({ variant: resolvedVariant }), textClass, className)}
      style={[{ fontFamily: FONT_FAMILY_BY_VARIANT[resolvedVariant] }, style]}
      role={ROLE[resolvedVariant]}
      aria-level={ARIA_LEVEL[resolvedVariant]}
      {...props}
    />
  );
}

export { Text, TextClassContext };
