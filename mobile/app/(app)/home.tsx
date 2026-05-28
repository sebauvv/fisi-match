import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Uniwind, useUniwind } from 'uniwind';
import { useAuth } from '../../context/AuthContext';
import { getStats } from '../../api/statsApi';
import type { DbStats } from '../../types/student';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatsCard from '../../components/ui/StatsCard';
import SafeAreaView from '../../components/ui/SafeAreaView';

// Pure-RN bar — no native modules needed, works in Expo Go
function SimpleBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-xs text-foreground-secondary">{label}</Text>
        <Text className="text-xs font-bold text-foreground">{value.toLocaleString()}</Text>
      </View>
      <View className="h-3 rounded-full bg-surface-alt overflow-hidden">
        <View
          className="h-3 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

// Pure-RN donut substitute: stacked arc segments using View border tricks
function PieSegments({ theses, publications }: { theses: number; publications: number }) {
  const total = theses + publications;
  const thesisPct = total > 0 ? Math.round((theses / total) * 100) : 50;
  const pubPct = 100 - thesisPct;

  return (
    <View className="flex-row items-center gap-5">
      {/* Donut simulation: nested circles */}
      <View className="items-center justify-center" style={{ width: 100, height: 100 }}>
        <View
          style={{
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: '#3D8B5E',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: 'transparent',
              borderWidth: 0,
            }}
          />
        </View>
        {/* Overlay: clip to show thesisPct of the circle using a view */}
        <View className="absolute inset-0 items-center justify-center">
          <View
            style={{
              width: 100, height: 100, borderRadius: 50,
              borderWidth: 14,
              borderTopColor: '#5B8DEF',
              borderRightColor: thesisPct > 50 ? '#5B8DEF' : '#3D8B5E',
              borderBottomColor: '#5B8DEF',
              borderLeftColor: '#5B8DEF',
              transform: [{ rotate: '-90deg' }],
            }}
          />
          <View className="absolute items-center justify-center">
            <Text className="text-xs font-bold text-foreground">{thesisPct}%</Text>
            <Text className="text-[9px] text-muted">Tesis</Text>
          </View>
        </View>
      </View>

      {/* Legend */}
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5B8DEF' }} />
          <View>
            <Text className="text-xs font-semibold text-foreground">{theses.toLocaleString()}</Text>
            <Text className="text-[10px] text-muted">Tesis ({thesisPct}%)</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3D8B5E' }} />
          <View>
            <Text className="text-xs font-semibold text-foreground">{publications.toLocaleString()}</Text>
            <Text className="text-[10px] text-muted">Publicaciones ({pubPct}%)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DbStats | null>(null);
  const { theme, hasAdaptiveThemes } = useUniwind();
  const activeTheme = hasAdaptiveThemes ? 'system' : theme;

  useEffect(() => {
    setLoading(true);
    getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const maxVal = stats ? Math.max(stats.advisors, stats.theses, stats.publications) : 1;

  const infoRows = [
    { label: 'Código', value: user.estudiante.codigo_matricula, icon: 'award' as const },
    { label: 'Facultad', value: user.estudiante.facultad, icon: 'book-open' as const },
    { label: 'Programa', value: user.estudiante.escuela, icon: 'file-text' as const },
    { label: 'Plan', value: user.estudiante.plan, icon: 'calendar' as const },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-4 py-6 gap-5 pb-10" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row items-center gap-3 mb-2">
          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
            <Feather name="user" size={22} color="#4F6D7A" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {user.estudiante.nombres_apellidos}
            </Text>
            <Text className="text-xs text-muted">Estudiante FISI</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {(['system', 'light', 'dark'] as const).map((mode) => {
              const isActive = activeTheme === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => {
                    Uniwind.setTheme(mode);
                  }}
                  className={[
                    'h-8 px-2 rounded-full border items-center justify-center',
                    isActive ? 'bg-primary border-primary' : 'border-border bg-surface',
                  ].join(' ')}
                >
                  <Text className={['text-[10px] font-semibold uppercase', isActive ? 'text-white' : 'text-muted'].join(' ')}>
                    {mode === 'system' ? 'auto' : mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Profile Card */}
        <View className="rounded-2xl border border-border bg-surface p-5 gap-3">
          {infoRows.map(({ label, value, icon }) => (
            <View key={label} className="flex-row items-start gap-3">
              <Feather name={icon} size={14} color="#8E8E9E" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</Text>
                <Text className="text-sm text-foreground">{value || '—'}</Text>
              </View>
            </View>
          ))}
          {/* GPA badge */}
          <View className="mt-2 rounded-xl bg-primary/5 px-4 py-3">
            <Text className="text-xs font-medium text-muted">Promedio Ponderado</Text>
            <Text className="text-2xl font-bold text-primary">
              {user.resumen_creditos.promedio_ponderado || '—'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted">
          Cifras actuales de la fuente de datos
        </Text>

        {loading || !stats ? (
          <View className="h-32 rounded-2xl border border-border bg-surface items-center justify-center">
            <LoadingSpinner message="Cargando estadísticas..." />
          </View>
        ) : (
          <>
            {/* Stat cards */}
            <View className="flex-row gap-3">
              <StatsCard
                value={stats.advisors.toLocaleString()}
                label="Profesores"
                icon={<Feather name="users" size={16} color="#4F6D7A" />}
              />
              <StatsCard
                value={stats.theses.toLocaleString()}
                label="Tesis"
                icon={<Feather name="book-open" size={16} color="#5B8DEF" />}
              />
            </View>
            <View className="flex-row gap-3">
              <StatsCard
                value={stats.publications.toLocaleString()}
                label="Publicaciones"
                icon={<Feather name="file-text" size={16} color="#3D8B5E" />}
              />
              <StatsCard
                value={`${stats.range_start}–${stats.range_end}`}
                label="Rango años"
                icon={<Feather name="calendar" size={16} color="#C4893D" />}
              />
            </View>

            {/* Bar chart — pure RN */}
            <View className="rounded-2xl border border-border bg-surface p-5">
              <Text className="text-sm font-semibold text-foreground mb-4">Datos por categoría</Text>
              <SimpleBar value={stats.advisors} max={maxVal} color="#4F6D7A" label="Profesores" />
              <SimpleBar value={stats.theses} max={maxVal} color="#5B8DEF" label="Tesis" />
              <SimpleBar value={stats.publications} max={maxVal} color="#3D8B5E" label="Publicaciones" />
            </View>

            {/* Pie substitute — pure RN */}
            <View className="rounded-2xl border border-border bg-surface p-5">
              <Text className="text-sm font-semibold text-foreground mb-4">
                Distribución de producción académica
              </Text>
              <PieSegments theses={stats.theses} publications={stats.publications} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
