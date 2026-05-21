import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CircleAlert, CircleCheckBig, Info, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastVariant = 'default' | 'success' | 'error' | 'info';

type ToastInput = {
  title: string;
  description?: string;
  duration?: number;
};

type ToastRecord = ToastInput & {
  id: string;
  variant: ToastVariant;
};

type ToastListener = (toasts: ToastRecord[]) => void;

const DEFAULT_DURATION_MS = 3600;
const listeners = new Set<ToastListener>();
const activeToasts: ToastRecord[] = [];
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  const snapshot = [...activeToasts];
  listeners.forEach((listener) => listener(snapshot));
}

function removeToast(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }

  const next = activeToasts.filter((toast) => toast.id !== id);
  activeToasts.splice(0, activeToasts.length, ...next);
  emit();
}

function enqueue(variant: ToastVariant, input: ToastInput) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const toast: ToastRecord = { id, variant, ...input };
  activeToasts.unshift(toast);
  emit();

  const duration = input.duration ?? DEFAULT_DURATION_MS;
  if (duration > 0) {
    const timer = setTimeout(() => removeToast(id), duration);
    timers.set(id, timer);
  }
}

export const toast = {
  show: (input: ToastInput) => enqueue('default', input),
  success: (input: ToastInput) => enqueue('success', input),
  error: (input: ToastInput) => enqueue('error', input),
  info: (input: ToastInput) => enqueue('info', input),
  dismiss: (id: string) => removeToast(id),
  dismissAll: () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    activeToasts.splice(0, activeToasts.length);
    emit();
  },
};

export function useToast() {
  return toast;
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const listener: ToastListener = (nextToasts) => setToasts(nextToasts);
    listeners.add(listener);
    listener(activeToasts);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-50 px-4"
      style={{ bottom: insets.bottom + 12 }}>
      <View pointerEvents="box-none" className="w-full max-w-md self-center gap-2">
        {toasts.map((item) => (
          <ToastCard key={item.id} toastItem={item} onClose={() => removeToast(item.id)} />
        ))}
      </View>
    </View>
  );
}

function ToastCard({ toastItem, onClose }: { toastItem: ToastRecord; onClose: () => void }) {
  const accentClasses = useMemo(() => {
    switch (toastItem.variant) {
      case 'success':
        return {
          icon: CircleCheckBig,
          borderClass: 'border-secondary/35',
          cardClass: 'bg-black/50 shadow-xl shadow-secondary/45',
          titleClass: 'text-foreground',
          descriptionClass: 'text-foreground/85',
          iconWrapClass: 'bg-secondary/25 border-secondary/50',
          iconClass: 'text-foreground',
          closeClass: 'text-foreground/85',
        };
      case 'error':
        return {
          icon: CircleAlert,
          borderClass: 'border-destructive/35',
          cardClass: 'bg-black/50 shadow-xl shadow-destructive/45',
          titleClass: 'text-foreground',
          descriptionClass: 'text-foreground/85',
          iconWrapClass: 'bg-destructive/25 border-destructive/50',
          iconClass: 'text-foreground',
          closeClass: 'text-foreground/85',
        };
      case 'info':
        return {
          icon: Info,
          borderClass: 'border-primary/35',
          cardClass: 'bg-black/50 shadow-xl shadow-primary/45',
          titleClass: 'text-foreground',
          descriptionClass: 'text-foreground/85',
          iconWrapClass: 'bg-primary/25 border-primary/50',
          iconClass: 'text-foreground',
          closeClass: 'text-foreground/85',
        };
      default:
        return {
          icon: Info,
          borderClass: 'border-border/80',
          cardClass: 'bg-card/95 shadow-xl shadow-black/35',
          titleClass: 'text-card-foreground',
          descriptionClass: 'text-card-foreground/75',
          iconWrapClass: 'bg-accent border-border/60',
          iconClass: 'text-foreground',
          closeClass: 'text-muted-foreground',
        };
    }
  }, [toastItem.variant]);

  const AccentIcon = accentClasses.icon;

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutDown.duration(180)}
      layout={LinearTransition.duration(160)}
      className={cn(
        'flex-row items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl',
        accentClasses.borderClass,
        accentClasses.cardClass
      )}>
      <View className={cn('h-8 w-8 items-center justify-center rounded-full border', accentClasses.iconWrapClass)}>
        <Icon as={AccentIcon} size={18} className={accentClasses.iconClass} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className={cn('text-sm font-bold', accentClasses.titleClass)}>{toastItem.title}</Text>
        {toastItem.description ? (
          <Text className={cn('text-xs font-medium', accentClasses.descriptionClass)}>
            {toastItem.description}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onClose}
        className="h-7 w-7 items-center justify-center rounded-full bg-black/20"
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification">
        <Icon as={X} size={14} className={accentClasses.closeClass} />
      </Pressable>
    </Animated.View>
  );
}
