import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { timetablesAPI, type TimetableRecord } from '@/services/timetablesApi';
import { useAuth } from '@/context/AuthContext';
import {
  ActionButton,
  Chip,
  EmptyState,
  FloatingActionButton,
  HeroCard,
  LoadingState,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useAppTheme } from '@/utils/theme';

export default function TimetableScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [rows, setRows] = useState<TimetableRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await timetablesAPI.list();
        setRows(data.timetables || []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => {
    const byDay: Record<string, TimetableRecord[]> = {};

    for (const timetable of rows) {
      const key = new Date(timetable.effectiveDate).toDateString();
      (byDay[key] ||= []).push(timetable);
    }

    Object.values(byDay).forEach((items) => items.sort((a, b) => (
      new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
    )));

    return byDay;
  }, [rows]);

  const canCreate = ['power', 'admin'].includes(user?.role || '');

  const formatDay = (key: string) => {
    const date = new Date(key);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading timetable updates…" />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Timetable"
        title="Schedules that are easier to scan"
        subtitle="Lecture and exam timetable posts now sit inside a calmer layout with grouped dates and cleaner file actions."
        icon="calendar-outline"
        actions={canCreate ? (
          <View style={{ width: 120 }}>
            <ActionButton label="Create" icon="add" onPress={() => router.push('/create-timetable')} />
          </View>
        ) : undefined}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Chip label={`${rows.length} updates`} icon="document-text-outline" tone="accent" />
          <Chip label={`${Object.keys(groups).length} active days`} icon="time-outline" tone="success" />
        </View>
      </HeroCard>

      {rows.length === 0 ? (
        <EmptyState
          title="No timetables yet"
          subtitle="Once lecture or exam schedules are posted, they will appear here with quick access to images and PDFs."
          icon="calendar-clear-outline"
        />
      ) : (
        Object.entries(groups).map(([day, items]) => (
          <View key={day} style={{ marginTop: 22 }}>
            <SectionHeading
              title={formatDay(day)}
              subtitle={`${items.length} timetable update${items.length === 1 ? '' : 's'} published for this date.`}
            />
            <View style={{ gap: 12 }}>
              {items.map((timetable) => (
                <SurfaceCard key={timetable.id}>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900' }}>
                    {timetable.title}
                  </Text>

                  {!!timetable.details ? (
                    <Text style={{ color: theme.textMuted, marginTop: 8, lineHeight: 22 }}>
                      {timetable.details}
                    </Text>
                  ) : null}

                  {!!timetable.imageUrl ? (
                    <View style={{ height: 180, overflow: 'hidden', borderRadius: 20, marginTop: 14 }}>
                      <Image source={{ uri: timetable.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    <Chip label="Effective date" icon="calendar-outline" tone="accent" />
                    {timetable.pdfUrl ? <Chip label="PDF attached" icon="document-outline" tone="warning" /> : null}
                  </View>

                  {timetable.pdfUrl ? (
                    <ActionButton
                      label="Open PDF"
                      icon="document-text-outline"
                      variant="secondary"
                      onPress={() => WebBrowser.openBrowserAsync(timetable.pdfUrl)}
                      style={{ marginTop: 16 }}
                    />
                  ) : null}

                  <ActionButton
                    label="View update"
                    icon="open-outline"
                    variant="ghost"
                    onPress={() => router.push(`/timetable/${timetable.id}`)}
                    style={{ marginTop: 10 }}
                  />
                </SurfaceCard>
              ))}
            </View>
          </View>
        ))
      )}

      {canCreate ? <FloatingActionButton onPress={() => router.push('/create-timetable')} /> : null}
    </ScreenShell>
  );
}
