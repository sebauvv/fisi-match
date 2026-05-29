import { Modal, View, Text, Pressable, FlatList, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AcademicPeriod, Course } from '../../types/student';

interface CoursesModalProps {
  periods: AcademicPeriod[];
  onClose: () => void;
}

function CourseRow({ course, odd }: { course: Course; odd: boolean }) {
  const isInProgress = course.calificacion === 'En progreso';
  return (
    <View
      className={['flex-row py-2 px-2 rounded-md', odd ? 'bg-surface-alt' : ''].join(' ')}
    >
      <Text className="text-[11px] text-muted w-10 shrink-0">{course.ciclo}</Text>
      <Text className="text-[11px] text-muted w-10 shrink-0">{course.tipo}</Text>
      <Text className="text-[11px] text-foreground flex-1 pr-1" numberOfLines={2}>{course.asignatura}</Text>
      <Text
        className={[
          'text-[11px] font-bold w-10 shrink-0 text-right',
          isInProgress ? 'text-warning' : 'text-foreground',
        ].join(' ')}
      >
        {course.calificacion}
      </Text>
      <Text className="text-[11px] text-muted w-8 shrink-0 text-right">{course.creditos}</Text>
    </View>
  );
}

function PeriodSection({ period }: { period: AcademicPeriod }) {
  return (
    <View className="mb-5">
      <Text className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">
        Periodo {period.periodo}
      </Text>
      {/* Header */}
      <View className="flex-row px-2 pb-1 border-b border-border mb-1">
        <Text className="text-[10px] font-semibold uppercase text-muted w-10 shrink-0">Ciclo</Text>
        <Text className="text-[10px] font-semibold uppercase text-muted w-10 shrink-0">Tipo</Text>
        <Text className="text-[10px] font-semibold uppercase text-muted flex-1">Asignatura</Text>
        <Text className="text-[10px] font-semibold uppercase text-muted w-10 shrink-0 text-right">Cal.</Text>
        <Text className="text-[10px] font-semibold uppercase text-muted w-8 shrink-0 text-right">Cred.</Text>
      </View>
      {period.cursos.map((course, idx) => (
        <CourseRow key={`${course.codigo}-${idx}`} course={course} odd={idx % 2 === 1} />
      ))}
    </View>
  );
}

export default function CoursesModal({ periods, onClose }: CoursesModalProps) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-surface rounded-t-3xl" style={{ maxHeight: '92%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <Text className="text-base font-bold text-foreground">
              Historial Académico Completo
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center"
            >
              <Feather name="x" size={16} color="#8E8E9E" />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {periods.length === 0 ? (
              <Text className="text-sm text-muted text-center py-8">
                Sin periodos académicos registrados.
              </Text>
            ) : (
              periods.map((period) => (
                <PeriodSection key={period.periodo} period={period} />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
