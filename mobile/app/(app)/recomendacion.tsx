import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { generateAdvisorRecommendation } from '../../api/recommendationApi';
import type { RecommendationResult, AdvisorRecommendation } from '../../types/recommendation';
import Button from '../../components/ui/Button';
import ErrorBanner from '../../components/ui/ErrorBanner';
import SafeAreaView from '../../components/ui/SafeAreaView';

const STEPS = [
  'Vectorizando tu idea...',
  'Buscando similitudes con pgvector...',
  'Calculando rankings...',
  'Generando justificación con LLM...',
];

function ProgressModal({ visible }: { visible: boolean }) {
  const [stepIdx, setStepIdx] = useState(0);

  // cycle steps
  if (visible && stepIdx < STEPS.length - 1) {
    setTimeout(() => setStepIdx((s) => Math.min(s + 1, STEPS.length - 1)), 3000);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-surface rounded-2xl p-8 w-full gap-5">
          <ActivityIndicator colorClassName="accent-primary" size="large" />
          <Text className="text-base font-semibold text-foreground text-center">Procesando con IA</Text>
          <View className="gap-2">
            {STEPS.map((s, i) => (
              <View key={s} className="flex-row items-center gap-3">
                <View className={['w-5 h-5 rounded-full items-center justify-center', i <= stepIdx ? 'bg-primary' : 'bg-border'].join(' ')}>
                  {i < stepIdx ? (
                    <Feather name="check" size={10} color="white" />
                  ) : i === stepIdx ? (
                    <ActivityIndicator colorClassName="accent-white" size="small" />
                  ) : null}
                </View>
                <Text className={['text-sm', i <= stepIdx ? 'text-foreground' : 'text-muted'].join(' ')}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AdvisorResultCard({ rec, rank }: { rec: AdvisorRecommendation; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = rec.score >= 0.8 ? '#3D8B5E' : rec.score >= 0.6 ? '#4F6D7A' : '#C4893D';

  return (
    <View className="rounded-2xl border border-border bg-surface mb-4 overflow-hidden">
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="w-7 h-7 rounded-full bg-primary items-center justify-center mr-3">
            <Text className="text-white text-xs font-bold">#{rank}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">{rec.advisor_name}</Text>
            <Text className="text-xs text-muted mt-0.5">
              {rec.thesis_count} tesis · {rec.num_matching_chunks} chunks relevantes
            </Text>
          </View>
          <View className="rounded-lg px-2 py-1" style={{ backgroundColor: scoreColor + '20' }}>
            <Text className="text-xs font-bold" style={{ color: scoreColor }}>
              {(rec.score * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
        <Text className="text-sm text-foreground-secondary leading-5" numberOfLines={expanded ? undefined : 4}>
          {rec.explanation}
        </Text>
        <Pressable onPress={() => setExpanded(!expanded)} className="mt-2">
          <Text className="text-xs text-primary font-semibold">
            {expanded ? 'Ver menos' : 'Ver más'}
          </Text>
        </Pressable>
      </View>
      {expanded && rec.matching_evidence.length > 0 && (
        <View className="border-t border-border px-4 py-3">
          <Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Evidencias</Text>
          {rec.matching_evidence.slice(0, 2).map((e, i) => (
            <View key={i} className="mb-2">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="bg-primary-soft rounded px-1.5 py-0.5">
                  <Text className="text-[9px] font-bold text-primary uppercase">{e.content_type}</Text>
                </View>
                <Text className="text-[10px] text-muted">{e.year}</Text>
              </View>
              <Text className="text-xs text-foreground-secondary leading-4" numberOfLines={2}>
                {e.content_text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function RecomendacionScreen() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ideaText = user?.thesis_idea || 'IDEA_FALTANTE_POR_FAVOR_REGISTRELA';

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    setError(null);
    try {
      const data = await generateAdvisorRecommendation(ideaText);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ProgressModal visible={isGenerating} />
      <ScrollView contentContainerClassName="px-4 py-6 pb-10" showsVerticalScrollIndicator={false}>

        {/* Badge */}
        <View className="flex-row items-center self-start gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <View className="w-1.5 h-1.5 rounded-full bg-primary" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Fase 3 · Motor de Recomendación
          </Text>
        </View>

        <Text className="text-2xl font-bold text-foreground mb-2">
          Recomendación de <Text className="italic text-primary">asesor</Text>
        </Text>
        <Text className="text-sm text-muted leading-5 mb-6">
          Análisis semántico de tu idea de tesis con embeddings y ranking de profesores afines.
        </Text>

        {/* Idea card */}
        <View className="rounded-2xl border border-border bg-surface p-5 mb-6 overflow-hidden">
          <View className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60" />
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="star" size={12} color="#4F6D7A" />
            <Text className="text-[10px] uppercase tracking-wider font-semibold text-muted">Tu idea de tesis</Text>
          </View>
          <Text className="text-sm italic text-foreground leading-5">&ldquo;{ideaText}&rdquo;</Text>
          <View className="flex-row items-center gap-1.5 mt-3 pt-3 border-t border-border/60">
            <Feather name="check-circle" size={11} color="#8E8E9E" />
            <Text className="text-xs text-muted">Guardado en tu perfil</Text>
          </View>
        </View>

        {/* Feature tiles */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          {[
            { icon: 'cpu', label: 'Método', value: 'Similitud semántica' },
            { icon: 'search', label: 'Resultado', value: 'Top 3–5 asesores' },
            { icon: 'zap', label: 'Evidencia', value: 'Chunks de tesis/artículos' },
            { icon: 'star', label: 'Justificación', value: 'LLM Nova Lite' },
          ].map(({ icon, label, value }) => (
            <View key={label} className="flex-row items-start gap-2 p-3 bg-surface-alt border border-border rounded-xl" style={{ width: '47%' }}>
              <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
                <Feather name={icon as any} size={14} color="#4F6D7A" />
              </View>
              <View className="flex-1">
                <Text className="text-[9px] uppercase tracking-wide text-muted font-bold">{label}</Text>
                <Text className="text-xs text-foreground font-medium mt-0.5">{value}</Text>
              </View>
            </View>
          ))}
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        {!result && (
          <Button
            title={isGenerating ? 'Procesando con IA...' : 'Generar recomendación de asesor'}
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={isGenerating}
          />
        )}

        {/* Results */}
        {result && (
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-foreground">
                {result.recommendations.length} Asesores Recomendados
              </Text>
              <Text className="text-xs text-muted">{result.elapsed_seconds.toFixed(1)}s</Text>
            </View>
            {result.recommendations.map((rec, i) => (
              <AdvisorResultCard key={rec.advisor_id} rec={rec} rank={i + 1} />
            ))}
            <Button title="Nueva búsqueda" onPress={() => setResult(null)} variant="outline" className="mt-2" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
