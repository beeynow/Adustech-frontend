import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActionButton,
  HeroCard,
  InputField,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useAppTheme } from '@/utils/theme';

const categories: Array<{ icon: keyof typeof Ionicons.glyphMap; name: string; count: number }> = [
  { icon: 'book-outline', name: 'Courses', count: 24 },
  { icon: 'people-outline', name: 'Community', count: 156 },
  { icon: 'library-outline', name: 'Library', count: 89 },
  { icon: 'calendar-outline', name: 'Events', count: 12 },
  { icon: 'briefcase-outline', name: 'Jobs', count: 8 },
  { icon: 'trophy-outline', name: 'Achievements', count: 34 },
];

const trending: Array<{ icon: keyof typeof Ionicons.glyphMap; title: string; category: string; students: number }> = [
  {
    icon: 'flame-outline',
    title: 'Introduction to AI',
    category: 'Computer Science',
    students: 1234,
  },
  {
    icon: 'flash-outline',
    title: 'Web Development Bootcamp',
    category: 'Programming',
    students: 890,
  },
  {
    icon: 'stats-chart-outline',
    title: 'Data Science Fundamentals',
    category: 'Data Science',
    students: 756,
  },
  {
    icon: 'phone-portrait-outline',
    title: 'Mobile App Development',
    category: 'Development',
    students: 645,
  },
];

export default function ExploreScreen() {
  const theme = useAppTheme();

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Explore"
        title="Discover the best of campus life"
        subtitle="Browse academic categories, trending student interests, and practical recommendations from a more modern discovery hub."
        icon="compass-outline"
      />

      <InputField
        icon="search-outline"
        placeholder="Search courses, people, resources..."
      />

      <SectionHeading title="Categories" subtitle="Fast entry points into the most useful parts of the university ecosystem." />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {categories.map((category) => (
          <SurfaceCard key={category.name} style={{ width: '47.5%', padding: 16 }}>
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.accentSoft,
                marginBottom: 14,
              }}
            >
              <Ionicons name={category.icon} size={22} color={theme.accent} />
            </View>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>{category.name}</Text>
            <Text style={{ color: theme.textMuted, marginTop: 6, fontWeight: '700' }}>{category.count} available</Text>
          </SurfaceCard>
        ))}
      </View>

      <SectionHeading title="Trending Now" subtitle="What students are currently leaning into across learning and community spaces." />
      <View style={{ gap: 12 }}>
        {trending.map((item) => (
          <SurfaceCard key={item.title}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.accentSoft,
                }}
              >
                <Ionicons name={item.icon} size={22} color={theme.accent} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>{item.title}</Text>
                <Text style={{ color: theme.textMuted, marginTop: 4 }}>{item.category}</Text>
                <Text style={{ color: theme.accent, marginTop: 8, fontWeight: '800' }}>
                  {item.students.toLocaleString()} students
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />
            </View>
          </SurfaceCard>
        ))}
      </View>

      <SectionHeading title="Recommended for You" subtitle="A simple upgrade path to unlock smarter personalization." />
      <SurfaceCard>
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.accentSoft,
            marginBottom: 14,
          }}
        >
          <Ionicons name="sparkles-outline" size={26} color={theme.accent} />
        </View>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900' }}>Complete your profile</Text>
        <Text style={{ color: theme.textMuted, marginTop: 8, lineHeight: 22 }}>
          Add your department, level, and interests so the app can surface more relevant channels, resources, and academic opportunities.
        </Text>
        <ActionButton label="Complete Profile" icon="person-circle-outline" style={{ marginTop: 18 }} />
      </SurfaceCard>
    </ScreenShell>
  );
}
