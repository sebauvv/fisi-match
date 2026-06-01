import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { advisorApi } from '../../api/advisorApi';
import type { Advisor, ResearchArea } from '../../types/advisor';
import AdvisorCard from '../../components/ui/AdvisorCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SafeAreaView from '../../components/ui/SafeAreaView';

type Mode = 'name' | 'area';

const ALPHABET = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z',
];

export default function ExploradorScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('name');
  const [query, setQuery] = useState('');
  const [orcidFilter, setOrcidFilter] = useState<boolean | null>(null);

  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);
  const [limit] = useState(15);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const [allAreas, setAllAreas] = useState<ResearchArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [selectedArea, setSelectedArea] = useState<ResearchArea | null>(null);

  useEffect(() => {
    if (mode === 'area' && allAreas.length === 0) {
      setLoadingAreas(true);
      advisorApi.getResearchAreas()
        .then(setAllAreas)
        .catch(console.error)
        .finally(() => setLoadingAreas(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    let active = true;
    setLoadingAdvisors(true);

    const params = mode === 'name'
      ? { limit, offset, search_name: query, has_orcid: orcidFilter }
      : selectedArea
        ? { limit, offset, search_area: selectedArea.name, has_orcid: orcidFilter }
        : null;

    if (!params) {
      setAdvisors([]); setTotal(0); setLoadingAdvisors(false);
      return;
    }

    advisorApi.getAdvisors(params)
      .then((res) => { if (active) { setAdvisors(res.items); setTotal(res.total); } })
      .catch(console.error)
      .finally(() => { if (active) setLoadingAdvisors(false); });

    return () => { active = false; };
  }, [mode, query, selectedArea, orcidFilter, limit, offset]);

  // Grouped areas by letter for area mode
  const groupedAreas = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = allAreas.filter((a) => a.name.toLowerCase().includes(q));
    const groups: Record<string, ResearchArea[]> = {};
    filtered.forEach((area) => {
      let ch = area.name.charAt(0).toUpperCase();
      if ('ÁÄ'.includes(ch)) ch = 'A';
      if ('ÉË'.includes(ch)) ch = 'E';
      if ('ÍÏ'.includes(ch)) ch = 'I';
      if ('ÓÖ'.includes(ch)) ch = 'O';
      if ('ÚÜ'.includes(ch)) ch = 'U';
      const key = ALPHABET.includes(ch) ? ch : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(area);
    });
    return groups;
  }, [allAreas, query]);

  const activeLetters = Object.keys(groupedAreas).sort((a, b) =>
    a === '#' ? 1 : b === '#' ? -1 : ALPHABET.indexOf(a) - ALPHABET.indexOf(b)
  );

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-foreground mb-3">Explorador de Asesores</Text>

        {/* Mode toggle */}
        <View className="flex-row bg-surface-alt rounded-lg p-1 mb-3">
          {(['name', 'area'] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => { setMode(m); setQuery(''); setSelectedArea(null); setOffset(0); }}
              className={[
                'flex-1 py-2 rounded-md items-center',
                mode === m ? 'bg-primary' : '',
              ].join(' ')}
            >
              <Text className={['text-sm font-medium', mode === m ? 'text-white' : 'text-muted'].join(' ')}>
                {m === 'name' ? 'Nombre' : 'Área'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search bar */}
        <View className="relative">
          <TextInput
            value={query}
            onChangeText={(t) => { setQuery(t); setOffset(0); }}
            placeholder={mode === 'name' ? 'Buscar por nombre...' : selectedArea ? selectedArea.name : 'Buscar área...'}
            className="rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground"
            placeholderTextColorClassName="accent-muted"
            selectionColorClassName="accent-primary"
            cursorColorClassName="accent-primary"
            underlineColorAndroidClassName="accent-transparent"
            editable={mode === 'name' || !selectedArea}
          />
          <View className="absolute left-3 top-3 pointer-events-none">
            <Feather name="search" size={16} color="#8E8E9E" />
          </View>
          {selectedArea && (
            <Pressable className="absolute right-3 top-2.5" onPress={() => setSelectedArea(null)}>
              <Feather name="x" size={16} color="#C44545" />
            </Pressable>
          )}
        </View>

        {/* ORCID filter */}
        <View className="flex-row gap-2 mt-2">
          {[
            { label: 'Todos', value: null },
            { label: 'Con ORCID', value: true },
            { label: 'Sin ORCID', value: false },
          ].map(({ label, value }) => (
            <Pressable
              key={label}
              onPress={() => setOrcidFilter(value)}
              className={[
                'rounded-full px-3 py-1 border',
                orcidFilter === value ? 'bg-primary border-primary' : 'border-border bg-surface',
              ].join(' ')}
            >
              <Text className={['text-xs font-medium', orcidFilter === value ? 'text-white' : 'text-muted'].join(' ')}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      {mode === 'name' || selectedArea ? (
        <>
          {loadingAdvisors ? (
            <LoadingSpinner message="Cargando asesores..." />
          ) : (
            <FlatList
              data={advisors}
              keyExtractor={(a) => a.id}
              contentContainerClassName="px-4 pb-4 pt-2"
              renderItem={({ item }) => (
                <AdvisorCard advisor={item} onPress={(a) => router.push(`/asesor/${a.id}`)} />
              )}
              ListEmptyComponent={
                <View className="py-12 items-center">
                  <Text className="text-sm text-muted">No se encontraron asesores</Text>
                </View>
              }
              ListFooterComponent={
                total > limit ? (
                  <View className="flex-row items-center justify-center gap-4 py-4">
                    <Pressable
                      onPress={() => setOffset(Math.max(0, offset - limit))}
                      disabled={currentPage === 1}
                      className={['w-9 h-9 rounded-lg border border-border items-center justify-center', currentPage === 1 ? 'opacity-30' : ''].join(' ')}
                    >
                      <Feather name="chevron-left" size={16} color="#4F6D7A" />
                    </Pressable>
                    <Text className="text-sm text-foreground-secondary">
                      {currentPage} / {totalPages}
                    </Text>
                    <Pressable
                      onPress={() => setOffset(offset + limit)}
                      disabled={currentPage >= totalPages}
                      className={['w-9 h-9 rounded-lg border border-border items-center justify-center', currentPage >= totalPages ? 'opacity-30' : ''].join(' ')}
                    >
                      <Feather name="chevron-right" size={16} color="#4F6D7A" />
                    </Pressable>
                  </View>
                ) : null
              }
            />
          )}
        </>
      ) : (
        // Area browser
        <ScrollView contentContainerClassName="px-4 pb-4">
          {loadingAreas ? (
            <LoadingSpinner message="Cargando áreas..." />
          ) : (
            activeLetters.map((letter) => (
              <View key={letter} className="mb-6">
                <Text className="text-lg font-black text-primary border-b border-border pb-2 mb-3">{letter}</Text>
                {groupedAreas[letter].map((area) => (
                  <Pressable
                    key={area.id}
                    onPress={() => setSelectedArea(area)}
                    className="flex-row items-center justify-between py-2.5 px-3 rounded-lg border border-transparent active:border-border active:bg-surface-alt"
                  >
                    <View className="flex-1">
                      <Text className="text-sm text-foreground-secondary">{area.name}</Text>
                      <Text className="text-[10px] text-muted mt-0.5 uppercase tracking-wide">
                        {area.advisor_count} asesor{area.advisor_count !== 1 ? 'es' : ''}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="#8E8E9E" />
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
