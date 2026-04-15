import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Platform } from 'react-native';
import { Pressable, View } from 'react-native';

type TabsContextValue = {
  value: string | undefined;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be rendered inside Tabs.');
  }
  return context;
}

type TabsProps = Omit<React.ComponentProps<typeof View>, 'children'> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
};

function Tabs({ className, value: valueProp, defaultValue, onValueChange, children, ...props }: TabsProps) {
  const isControlled = valueProp !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(defaultValue);
  const value = isControlled ? valueProp : uncontrolledValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange]
  );

  const contextValue = React.useMemo(
    () => ({
      value,
      setValue,
    }),
    [setValue, value]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <View className={cn('flex flex-col gap-2', className)} {...props}>
        {children}
      </View>
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn(
        'bg-muted flex h-9 flex-row items-center justify-center rounded-lg p-[3px]',
        Platform.select({ web: 'inline-flex w-fit', native: 'mr-auto' }),
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  value,
  onPress,
  disabled,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Pressable>, 'children' | 'value'> & {
  value: string;
  children?: React.ReactNode;
}) {
  const context = useTabsContext();
  const isActive = context.value === value;

  const handlePress = React.useCallback(
    (event: Parameters<NonNullable<React.ComponentProps<typeof Pressable>['onPress']>>[0]) => {
      onPress?.(event);
      if (!disabled) {
        context.setValue(value);
      }
    },
    [context, disabled, onPress, value]
  );

  return (
    <TextClassContext.Provider
      value={cn(
        'text-foreground dark:text-muted-foreground text-sm font-medium',
        isActive && 'dark:text-foreground'
      )}>
      <Pressable
        className={cn(
          'flex h-[calc(100%-1px)] flex-row items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 shadow-none shadow-foreground/10',
          Platform.select({
            web: 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex cursor-default whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
          }),
          disabled && 'opacity-50',
          isActive && 'bg-background dark:border-foreground/10 dark:bg-input/30',
          className
        )}
        onPress={handlePress}
        disabled={disabled}
        {...props}
      >
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

function TabsContent({
  className,
  value,
  forceMount = false,
  children,
  ...props
}: Omit<React.ComponentProps<typeof View>, 'children'> & {
  value: string;
  forceMount?: boolean;
  children?: React.ReactNode;
}) {
  const context = useTabsContext();
  if (!forceMount && context.value !== value) {
    return null;
  }

  return (
    <View
      className={cn(Platform.select({ web: 'flex-1 outline-none' }), className)}
      {...props}
    >
      {children}
    </View>
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
