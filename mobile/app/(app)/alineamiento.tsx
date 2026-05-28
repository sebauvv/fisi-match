import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { alignmentApi } from '../../api/alignmentApi';
import { updateStudent } from '../../api/studentApi';
import type { AlignmentReport } from '../../types/alignment';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';
import SafeAreaView from '../../components/ui/SafeAreaView';

function LevelBadge({ level }: { level: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    Alto: { bg: '#E8F5EE', text: '#3D8B5E' },
    Medio: { bg: '#FDF3E7', text: '#C4893D' },
    Bajo: { bg: '#FBEAEA', text: '#C44545' },
  };
  const c = colorMap[level] ?? { bg: '#E6EEF1', text: '#4F6D7A' };
  return (
    <View style={{ backgroundColor: c.bg }} className="rounded-lg px-3 py-1 self-start">
      <Text className="text-xs font-bold" style={{ color: c.text }}>{level}</Text>
    </View>
  );
}

function ReportCard({ report, onSelect, isActive }: {
  report: AlignmentReport;
  onSelect: () => void;
  isActive: boolean;
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={['rounded-xl border p-3 mb-2', isActive ? 'border-primary bg-primary-soft' : 'border-border bg-surface'].join(' ')}
    >
      <Text className="text-xs font-semibold text-foreground" numberOfLines={2}>{report.thesis_idea}</Text>
      <View className="flex-row items-center justify-between mt-2">
        <LevelBadge level={report.alignment_level} />
        <Text className="text-[10px] text-muted">{new Date(report.created_at).toLocaleDateString('es-PE')}</Text>
      </View>
    </Pressable>
  );
}

function ReportDetails({ report }: { report: AlignmentReport }) {
  const rj = report.report_json;
  return (
    <ScrollView contentContainerClassName="pb-8 gap-4" showsVerticalScrollIndicator={false}>
      {/* Score */}
      <View className="rounded-2xl border border-border bg-surface p-5">
        <Text className="text-xs text-muted uppercase tracking-wide mb-3">Resultado de alineamiento</Text>
        <View className="flex-row items-end gap-3 mb-3">
          <Text className="text-4xl font-black text-primary">{rj.score_pct}%</Text>
          <LevelBadge level={rj.alignment_level} />
        </View>
        {/* Progress bar */}
        <View className="h-2 rounded-full bg-surface-alt overflow-hidden">
          <View className="h-2 rounded-full bg-primary" style={{ width: `${rj.score_pct}%` }} />
        </View>
      </View>

      {/* Justification */}
      <View className="rounded-2xl border border-border bg-surface p-5">
        <Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Justificación</Text>
        <Text className="text-sm text-foreground leading-5">{rj.justification}</Text>
      </View>

      {/* Strengths */}
      {rj.student_strengths?.length > 0 && (
        <View className="rounded-2xl border border-border bg-surface p-5">
          <Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Fortalezas</Text>
          {rj.student_strengths.map((s, i) => (
            <View key={i} className="flex-row items-start gap-2 mb-1.5">
              <Feather name="check-circle" size={13} color="#3D8B5E" style={{ marginTop: 1 }} />
              <Text className="text-sm text-foreground flex-1">{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Skill gaps */}
      {rj.skill_gaps?.length > 0 && (
        <View className="rounded-2xl border border-border bg-surface p-5">
          <Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Brechas de habilidades</Text>
          {rj.skill_gaps.map((s, i) => (
            <View key={i} className="flex-row items-start gap-2 mb-1.5">
              <Feather name="alert-circle" size={13} color="#C4893D" style={{ marginTop: 1 }} />
              <Text className="text-sm text-foreground flex-1">{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Skill bars */}
      {rj.skill_bars && rj.skill_bars.length > 0 && (
        <View className="rounded-2xl border border-border bg-surface p-5">
          <Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Habilidades</Text>
          {rj.skill_bars.map((bar, i) => (
            <View key={i} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-foreground">{bar.name}</Text>
                <Text className="text-xs font-semibold text-primary">{bar.percentage}%</Text>
              </View>
              <View className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
                <View className="h-1.5 rounded-full bg-primary" style={{ width: `${bar.percentage}%` }} />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function AlineamientoScreen() {
  const { user, token, updateUser } = useAuth();
  const studentId = user?.student_id;
  const [reports, setReports] = useState<AlignmentReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [idea, setIdea] = useState(user?.thesis_idea || '');
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (studentId && token) {
      alignmentApi.getAlignmentReports(studentId, token)
        .then(setReports)
        .catch((e) => setError(e.message));
    }
  }, [studentId, token]);

  const handleGenerate = async () => {
    if (!studentId || !token || !idea.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      await updateStudent(studentId, token, { thesis_idea: idea });
      updateUser({ thesis_idea: idea });
      const newReport = await alignmentApi.generateAlignmentReport(studentId, token);
      setReports((prev) => [newReport, ...prev]);
      setActiveReportId(newReport.id);
    } catch (e: any) {
      setError(e.message || 'Error al generar reporte');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeReport = reports.find((r) => r.id === activeReportId);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Progress modal */}
      <Modal visible={isGenerating} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-surface rounded-2xl p-8 items-center gap-4">
            <ActivityIndicator colorClassName="accent-primary" size="large" />
            <Text className="text-base font-semibold text-foreground text-center">Evaluando alineamiento...</Text>
            <Text className="text-xs text-muted text-center">El LLM analiza tu perfil académico</Text>
          </View>
        </View>
      </Modal>

      {/* Sidebar modal */}
      <Modal visible={showSidebar} transparent animationType="slide" onRequestClose={() => setShowSidebar(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowSidebar(false)} />
        <View className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl p-5" style={{ maxHeight: '80%' }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-foreground">Historial de Reportes</Text>
            <Pressable onPress={() => setShowSidebar(false)}>
              <Feather name="x" size={20} color="#8E8E9E" />
            </Pressable>
          </View>
          <FlatList
            data={reports}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => (
              <ReportCard
                report={item}
                isActive={item.id === activeReportId}
                onSelect={() => { setActiveReportId(item.id); setShowSidebar(false); }}
              />
            )}
            ListEmptyComponent={<Text className="text-sm text-muted text-center py-4">No hay reportes aún</Text>}
          />
        </View>
      </Modal>

      <View className="flex-1 px-4 py-4">
        {/* Header row */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-foreground">Reporte de Alineamiento</Text>
          <Pressable onPress={() => setShowSidebar(true)} className="flex-row items-center gap-1">
            <Feather name="clock" size={14} color="#4F6D7A" />
            <Text className="text-xs text-primary font-semibold">Historial ({reports.length})</Text>
          </Pressable>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        {/* Idea input */}
        <View className="rounded-2xl border border-border bg-surface p-4 mb-4 gap-2">
          <Text className="text-xs font-semibold text-muted uppercase tracking-wide">Idea de Tesis</Text>
          <TextInput
            value={idea}
            onChangeText={setIdea}
            placeholder="Escribe tu idea de investigación..."
            multiline
            numberOfLines={3}
            className="text-sm text-foreground"
            placeholderTextColorClassName="accent-muted"
            selectionColorClassName="accent-primary"
            cursorColorClassName="accent-primary"
            underlineColorAndroidClassName="accent-transparent"
          />
          <Button
            title="Generar Reporte"
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={!idea.trim() || isGenerating}
          />
        </View>

        {/* Report content */}
        {activeReport ? (
          <ReportDetails report={activeReport} />
        ) : (
          <View className="flex-1 items-center justify-center gap-3">
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center">
              <Feather name="clipboard" size={24} color="#4F6D7A" />
            </View>
            <Text className="text-base font-semibold text-foreground">Sin reporte activo</Text>
            <Text className="text-sm text-muted text-center">
              Ingresa tu idea de tesis y genera tu primer reporte de alineamiento.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
