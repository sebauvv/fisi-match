import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import SafeAreaView from '../../components/ui/SafeAreaView';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AdvisorStatsPanel from '../../components/ui/AdvisorStatsPanel';
import { advisorApi } from '../../api/advisorApi';
import { publicationApi } from '../../api/publicationApi';
import { thesisApi } from '../../api/thesisApi';
import type { Advisor, Publication, Thesis } from '../../types/advisor';

const PUB_TYPE_MAP: Record<string, { label: string, colorClass: string }> = {
  'journal-article': { label: 'Artículo de Revista', colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  'conference-paper': { label: 'Artículo de Conf.', colorClass: 'text-accent bg-accent/10 border-accent/20' },
  'book-chapter': { label: 'Capítulo de Libro', colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  'book': { label: 'Libro', colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  'preprint': { label: 'Pre-impresión', colorClass: 'text-muted bg-surface border-border' },
  'proceedings-article': { label: 'Artículo de Actas', colorClass: 'text-info bg-info/10 border-info/20' },
  'report': { label: 'Reporte', colorClass: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
};

const getPubType = (type: string | null) => {
  if (!type) return { label: 'Otro', colorClass: 'text-muted bg-surface border-border' };
  return PUB_TYPE_MAP[type] || { label: type, colorClass: 'text-muted bg-surface border-border' };
};

export default function AdvisorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [oldestYear, setOldestYear] = useState<number | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'pub' | 'thesis' | 'kw'>('pub');
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setActiveTab('pub');
    setShowStats(false);

    const fetchAllPublications = async (id: string) => {
      let items: Publication[] = [];
      let offset = 0;
      const limit = 100;
      while (true) {
        const res = await publicationApi.getPublications({ advisor_id: id, limit, offset });
        items = items.concat(res.items);
        if (res.items.length < limit) break;
        offset += limit;
      }
      return items;
    };

    const fetchAllTheses = async (id: string) => {
      let items: Thesis[] = [];
      let offset = 0;
      const limit = 100;
      while (true) {
        const res = await thesisApi.getTheses({ advisor_id: id, limit, offset });
        items = items.concat(res.items);
        if (res.items.length < limit) break;
        offset += limit;
      }
      return items;
    };

    Promise.all([
      advisorApi.getAdvisorById(id),
      advisorApi.getOldestThesisYear(id).catch(() => null),
      fetchAllPublications(id).catch(() => []),
      fetchAllTheses(id).catch(() => [])
    ]).then(([adv, year, pubs, ths]) => {
      if (mounted) {
        setAdvisor(adv);
        setOldestYear(year);
        setPublications(pubs);
        setTheses(ths);
        setLoading(false);
      }
    });

    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Cargando perfil..." />;
  }

  if (!advisor) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background items-center justify-center p-6">
        <Feather name="user-x" size={48} color="#C44545" className="mb-4" />
        <Text className="text-error font-semibold text-lg mb-4">Asesor no encontrado.</Text>
        <Pressable onPress={() => router.back()} className="bg-primary px-6 py-2 rounded-xl">
          <Text className="text-white font-medium">Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const orcidId = advisor.orcid ? advisor.orcid.match(/(\d{4}-\d{4}-\d{4}-\d{4})/) : null;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header / Hero */}
        <View className="bg-primary/5 pt-4 pb-12 px-4 relative">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-surface rounded-full shadow-sm mb-4">
            <Feather name="arrow-left" size={20} color="#4F6D7A" />
          </Pressable>
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-surface border-4 border-primary/20 items-center justify-center mb-4">
              <Feather name="user" size={40} color="#8E8E9E" />
            </View>
            <Text className="text-xl font-bold font-serif text-foreground text-center mb-2 leading-tight">
              {advisor.full_name}
            </Text>
            {advisor.orcid && orcidId ? (
              <Pressable 
                onPress={() => WebBrowser.openBrowserAsync(advisor.orcid!)}
                className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20"
              >
                <Feather name="link" size={12} color="#C4893D" />
                <Text className="text-xs font-medium text-accent">ORCID: {orcidId[1]}</Text>
              </Pressable>
            ) : (
              <Text className="text-xs text-muted italic">ORCID no disponible</Text>
            )}
          </View>
        </View>

        {/* Content Container (overlaps header) */}
        <View className="px-4 -mt-6">
          <View className="bg-surface border border-border rounded-2xl p-4 shadow-sm mb-6">
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="book-open" size={14} color="#4F6D7A" />
              <Text className="text-sm text-foreground-secondary">
                <Text className="font-bold text-foreground">{advisor.thesis_count}</Text> estudiantes asesorados
              </Text>
            </View>
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="calendar" size={14} color="#4F6D7A" />
              <Text className="text-sm text-foreground-secondary">
                {oldestYear ? `Asesorando desde ${oldestYear}` : 'Fecha de inicio no registrada'}
              </Text>
            </View>

            <Pressable 
              onPress={() => setShowStats(!showStats)}
              className="mt-4 flex-row items-center justify-center gap-2 bg-warning/10 border border-warning/30 rounded-xl py-2.5"
            >
              <Feather name="bar-chart-2" size={16} color="#C4893D" />
              <Text className="text-sm font-semibold text-warning">
                {showStats ? 'Ocultar estadísticas' : 'Ver estadísticas'}
              </Text>
            </Pressable>
          </View>

          {/* STATS PANEL */}
          {showStats && (
            <AdvisorStatsPanel 
              advisor={advisor} 
              publications={publications} 
              theses={theses} 
              oldestYear={oldestYear} 
            />
          )}

          {/* TABS */}
          <View className="flex-row border-b border-border mb-4">
            {(['pub', 'thesis', 'kw'] as const).map(tab => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={['flex-1 py-3 items-center border-b-2', activeTab === tab ? 'border-primary' : 'border-transparent'].join(' ')}
              >
                <Text className={['text-xs font-semibold', activeTab === tab ? 'text-primary' : 'text-muted'].join(' ')}>
                  {tab === 'pub' ? 'Publicaciones' : tab === 'thesis' ? 'Tesis' : 'Áreas'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* TAB CONTENT */}

          {/* Publications Tab */}
          {activeTab === 'pub' && (
            <View className="gap-3">
              {publications.length === 0 ? (
                <View className="items-center py-10 bg-surface-alt rounded-2xl border border-dashed border-border">
                  <Feather name="file-text" size={32} color="#8E8E9E" className="opacity-50 mb-3" />
                  <Text className="text-sm text-muted">Sin publicaciones externas.</Text>
                </View>
              ) : (
                publications.map(pub => {
                  const pType = getPubType(pub.type);
                  return (
                    <Pressable
                      key={pub.id}
                      onPress={() => pub.external_url && WebBrowser.openBrowserAsync(pub.external_url)}
                      className="bg-surface-alt border border-border rounded-xl p-4 active:bg-border/30"
                    >
                      <View className={`self-start px-2 py-0.5 rounded-md border mb-2 ${pType.colorClass}`}>
                        <Text className="text-[9px] font-bold uppercase">{pType.label}</Text>
                      </View>
                      <Text className="text-sm font-medium text-foreground mb-2 leading-tight">
                        {pub.title} {pub.external_url && <Feather name="external-link" size={12} color="#8E8E9E" />}
                      </Text>
                      <Text className="text-[11px] text-muted">
                        {pub.year || 'Año N/A'} {pub.journal ? `· ${pub.journal}` : ''}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}

          {/* Theses Tab */}
          {activeTab === 'thesis' && (
            <View className="gap-3">
              {theses.length === 0 ? (
                <View className="items-center py-10 bg-surface-alt rounded-2xl border border-dashed border-border">
                  <Feather name="book" size={32} color="#8E8E9E" className="opacity-50 mb-3" />
                  <Text className="text-sm text-muted">Sin tesis registradas.</Text>
                </View>
              ) : (
                theses.map(thesis => (
                  <Pressable
                    key={thesis.id}
                    onPress={() => thesis.handle_url && WebBrowser.openBrowserAsync(thesis.handle_url)}
                    className="bg-surface-alt border border-border rounded-xl p-4 active:bg-border/30 flex-row"
                  >
                    <View className="w-1 bg-red-400 rounded-full mr-3" />
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold text-red-400 mb-1 uppercase opacity-80">
                        {thesis.author} · {thesis.year}
                      </Text>
                      <Text className="text-sm font-medium text-foreground mb-2 leading-tight">
                        {thesis.title} {thesis.handle_url && <Feather name="external-link" size={12} color="#8E8E9E" />}
                      </Text>
                      <Text className="text-[11px] text-muted pt-2 border-t border-border">
                        {thesis.degree_name || 'Grado no especificado'}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Keywords Tab */}
          {activeTab === 'kw' && (
            <View className="bg-surface-alt border border-border rounded-2xl p-5">
              <Text className="text-sm font-semibold text-foreground mb-4">Palabras clave</Text>
              {advisor.research_areas.length === 0 ? (
                <Text className="text-sm text-muted">Sin palabras clave registradas.</Text>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {advisor.research_areas.map((area, idx) => {
                    const isLg = idx % 3 === 0;
                    const isMd = idx % 5 === 0;
                    
                    let colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                    if (isLg) colorClass = "bg-accent/10 text-accent border-accent/30 font-semibold";
                    else if (isMd) colorClass = "bg-purple-500/10 text-purple-600 border-purple-500/20";
                    
                    return (
                      <View key={area} className={`px-2.5 py-1 rounded-full border ${colorClass}`}>
                        <Text className={['text-xs', isLg ? 'font-semibold' : ''].join(' ')} style={{ color: isLg ? '#C4893D' : (isMd ? '#8B5CF6' : '#3D8B5E') }}>
                          {area}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
