import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';

type AuraCardTone = 'low' | 'high';

type AuraCardProps = React.ComponentProps<typeof Card> & {
  title?: string;
  description?: string;
  tone?: AuraCardTone;
};

const TONE_STYLES: Record<AuraCardTone, string> = {
  low: 'bg-surface-low border-transparent',
  high: 'bg-surface-highest border-transparent',
};

export function AuraCard({
  tone = 'low',
  title,
  description,
  className,
  children,
  ...props
}: AuraCardProps) {
  return (
    <Card className={cn('rounded-[24px] py-4', TONE_STYLES[tone], className)} {...props}>
      {title || description ? (
        <CardHeader>
          {title ? <CardTitle className="text-xl tracking-tight">{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AuraCardPreview() {
  return (
    <AuraCard title="Aura Card" description="Ambient container for reusable content.">
      <Text variant="body">Card body content</Text>
    </AuraCard>
  );
}
