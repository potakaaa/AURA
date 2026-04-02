import { AuraButton } from '@/components/ui/aura-button';
import { AuraCard } from '@/components/ui/aura-card';
import { AuraScreen } from '@/components/ui/aura-screen';
import { AuraTextField } from '@/components/ui/aura-text-field';
import { AuraTopBar } from '@/components/ui/aura-top-bar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { CircleAlert, Search, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

export default function PreviewScreen() {
  const [activeTab, setActiveTab] = useState('aura');

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuraTopBar title="Component Preview" />
        <ScrollView className="flex-1 px-5" contentContainerClassName="gap-5 pb-8">
          <AuraCard title="AuraButton">
            <View className="gap-3">
              <AuraButton label="Primary action" icon={Sparkles} />
              <AuraButton label="Secondary action" auraVariant="secondary" />
              <AuraButton label="Tertiary action" auraVariant="tertiary" />
            </View>
          </AuraCard>

          <AuraCard title="AuraTextField">
            <View className="gap-4">
              <AuraTextField label="Default" placeholder="Ask AURA anything..." leadingIcon={Search} />
              <AuraTextField
                label="Error"
                placeholder="Example validation error"
                errorText="Please provide at least 3 characters."
                leadingIcon={CircleAlert}
              />
              <AuraTextField label="Disabled" value="Disabled input" editable={false} />
            </View>
          </AuraCard>

          <AuraCard title="AuraCard">
            <View className="gap-3">
              <AuraCard tone="low" title="Low tone card">
                <Text variant="body">Supports grouped content on low-emphasis surfaces.</Text>
              </AuraCard>
              <AuraCard tone="high" title="High tone card">
                <Text variant="body">Highlights active or elevated content.</Text>
              </AuraCard>
            </View>
          </AuraCard>

          <AuraCard title="Tabs Primitive">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="aura">
                  <Text>AURA</Text>
                </TabsTrigger>
                <TabsTrigger value="design">
                  <Text>Design</Text>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="aura">
                <Text className="text-muted-foreground pt-3">AURA tab content preview.</Text>
              </TabsContent>
              <TabsContent value="design">
                <Text className="text-muted-foreground pt-3">Design tab content preview.</Text>
              </TabsContent>
            </Tabs>
          </AuraCard>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}
