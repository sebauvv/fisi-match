import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SafeAreaView from '../../components/ui/SafeAreaView';

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof Feather>['name'] }) {
  return (
    <View className="flex-row items-start gap-3 py-2 border-b border-border/40">
      <Feather name={icon} size={14} color="#8E8E9E" style={{ marginTop: 2 }} />
      <View className="flex-1">
        <Text className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</Text>
        <Text className="text-sm text-foreground">{value || '—'}</Text>
      </View>
    </View>
  );
}

function PdfButton({ label, url, onPress }: { label: string; url?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!url}
      className={['flex-row items-center justify-between py-3 px-4 rounded-xl border border-border bg-background', !url ? 'opacity-40' : 'active:bg-surface-alt'].join(' ')}
    >
      <View className="flex-row items-center gap-2">
        <Feather name="file-text" size={15} color="#4F6D7A" />
        <Text className="text-sm text-foreground">{label}</Text>
      </View>
      <Feather name="external-link" size={14} color="#8E8E9E" />
    </Pressable>
  );
}

export default function PerfilScreen() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const skills = user.cv_text
    ? user.cv_text.split('\n').map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 20)
    : [];

  const openPdf = async (url?: string) => {
    if (!url) return;
    await WebBrowser.openBrowserAsync(url);
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-4 py-6 gap-5 pb-10" showsVerticalScrollIndicator={false}>

        <Text className="text-xl font-bold text-foreground text-center">Perfil del Estudiante</Text>

        {/* Avatar card */}
        <View className="items-center gap-3">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
            <Feather name="user" size={28} color="#4F6D7A" />
          </View>
          <View className="items-center">
            <Text className="text-base font-semibold text-foreground">{user.estudiante.nombres_apellidos}</Text>
            <Text className="text-xs text-muted">Estudiante</Text>
          </View>
        </View>

        {/* Info personal */}
        <Card>
          <Text className="text-sm font-semibold text-foreground mb-3">Información Personal</Text>
          <InfoRow label="Código" value={user.estudiante.codigo_matricula} icon="award" />
          <InfoRow label="Facultad" value={user.estudiante.facultad} icon="book-open" />
          <InfoRow label="Programa" value={user.estudiante.escuela} icon="file-text" />
          <InfoRow label="Plan" value={user.estudiante.plan} icon="calendar" />
          <View className="flex-row items-start gap-3 pt-2">
            <Feather name="bar-chart-2" size={14} color="#8E8E9E" style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-[10px] font-medium uppercase tracking-wide text-muted">Promedio Ponderado</Text>
              <Text className="text-2xl font-black text-primary">{user.resumen_creditos.promedio_ponderado}</Text>
            </View>
          </View>
        </Card>

        {/* Documentos */}
        <Card>
          <Text className="text-sm font-semibold text-foreground mb-3">Documentos</Text>
          <View className="gap-2">
            <PdfButton
              label="Historial Académico"
              url={user.pdf_urls?.historial}
              onPress={() => openPdf(user.pdf_urls?.historial)}
            />
            <PdfButton
              label="Matrícula Actual"
              url={user.pdf_urls?.matricula}
              onPress={() => openPdf(user.pdf_urls?.matricula)}
            />
          </View>
        </Card>

        {/* Idea de Tesis */}
        {user.thesis_idea ? (
          <Card>
            <Text className="text-sm font-semibold text-foreground mb-2">Idea de Tesis</Text>
            <Text className="text-sm italic text-foreground-secondary leading-5">&ldquo;{user.thesis_idea}&rdquo;</Text>
          </Card>
        ) : null}

        {/* Habilidades */}
        <Card>
          <Text className="text-sm font-semibold text-foreground mb-3">Habilidades (CV)</Text>
          {skills.length > 0 ? (
            <View className="gap-1.5">
              {skills.map((skill, i) => (
                <View key={i} className="flex-row items-start gap-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <Text className="text-sm text-foreground flex-1">{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted">No se encontraron habilidades. Sube tu CV al registrarte.</Text>
          )}
        </Card>

        {/* Credits summary */}
        <Card>
          <Text className="text-sm font-semibold text-foreground mb-3">Resumen de Créditos</Text>
          <View className="gap-2">
            {[
              { label: 'Créditos aprobados', value: user.resumen_creditos.creditaje_aprobado },
              { label: 'Créditos requeridos', value: user.resumen_creditos.creditaje_requerido_para_egresar },
              { label: 'Créditos faltantes', value: user.resumen_creditos.creditaje_faltante },
            ].map(({ label, value }) => (
              <View key={label} className="flex-row justify-between">
                <Text className="text-xs text-muted">{label}</Text>
                <Text className="text-xs font-semibold text-foreground">{value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Logout */}
        <Button title="Cerrar sesión" onPress={handleLogout} variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
}
