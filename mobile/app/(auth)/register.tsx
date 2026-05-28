import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { registerStudent } from '../../api/profileApi';
import { loginStudent } from '../../api/authApi';
import type { AuthUser, StudentProfile } from '../../types/student';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';

const STEP_LABELS = ['Acceso', 'Historial', 'Matrícula', 'CV', 'Confirmación'];

type FileAsset = { uri: string; name: string; type: string };

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => (
        <View key={label} className="items-center gap-1">
          <View
            className={[
              'w-7 h-7 rounded-full items-center justify-center',
              i + 1 < current
                ? 'bg-primary'
                : i + 1 === current
                  ? 'bg-primary border-2 border-primary-soft'
                  : 'bg-surface border border-border',
            ].join(' ')}
          >
            {i + 1 < current ? (
              <Feather name="check" size={12} color="white" />
            ) : (
              <Text className={['text-[10px] font-bold', i + 1 === current ? 'text-white' : 'text-muted'].join(' ')}>
                {i + 1}
              </Text>
            )}
          </View>
          <Text className="text-[9px] text-muted">{label}</Text>
        </View>
      ))}
    </View>
  );
}

function FilePicker({ label, file, onPick, onClear }: {
  label: string;
  file: FileAsset | null;
  onPick: (f: FileAsset) => void;
  onClear: () => void;
}) {
  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    onPick({ uri: a.uri, name: a.name, type: a.mimeType ?? 'application/pdf' });
  };

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      {file ? (
        <View className="flex-row items-center justify-between rounded-xl border border-primary bg-primary-soft px-4 py-3">
          <View className="flex-row items-center gap-2 flex-1">
            <Feather name="file-text" size={16} color="#4F6D7A" />
            <Text className="text-sm text-primary flex-1" numberOfLines={1}>{file.name}</Text>
          </View>
          <Pressable onPress={onClear}>
            <Feather name="x" size={16} color="#C44545" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={pick}
          className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 items-center gap-2 active:bg-surface-alt"
        >
          <Feather name="upload" size={20} color="#8E8E9E" />
          <Text className="text-sm text-muted">Toca para seleccionar PDF</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [historial, setHistorial] = useState<FileAsset | null>(null);
  const [matricula, setMatricula] = useState<FileAsset | null>(null);
  const [cv, setCv] = useState<FileAsset | null>(null);
  const [isEgresado, setIsEgresado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState<StudentProfile | null>(null);
  const { login } = useAuth();

  const handleProcessPDFs = async () => {
    if (!historial || !cv) return;
    setLoading(true);
    setError('');
    try {
      const profile = await registerStudent(
        email, password, historial, isEgresado ? null : matricula, cv,
      );
      setProfileData(profile);

      try {
        const authRes = await loginStudent(email, password);
        const user: AuthUser = {
          student_id: authRes.student_id,
          email: authRes.email,
          estudiante: profile.historial.estudiante,
          periodos_academicos: profile.historial.periodos_academicos,
          resumen_creditos: profile.historial.resumen_creditos,
          cv_text: profile.cv?.cv_text || '',
          thesis_idea: '',
          pdf_urls: profile.pdf_urls,
        };
        login(user, authRes.access_token);
      } catch {
        console.error('Auto-login fallido');
      }

      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar los PDFs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {loading && (
        <View className="absolute inset-0 z-50 bg-black/60 items-center justify-center">
          <View className="bg-surface rounded-2xl p-8 items-center gap-4">
            <ActivityIndicator colorClassName="accent-primary" size="large" />
            <Text className="text-sm text-foreground">Procesando documentos con IA...</Text>
            <Text className="text-xs text-muted text-center">Esto puede tomar hasta 1 minuto</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="px-6 py-8" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-foreground text-center mb-1">FISI Match</Text>
          <Text className="text-sm text-muted text-center mb-8">Registro de estudiante</Text>

          <StepDots current={step} total={5} />

          {error ? <ErrorBanner message={error} /> : null}

          {/* Step 1: Credentials */}
          {step === 1 && (
            <View className="gap-4">
              <Text className="text-lg font-semibold text-foreground mb-2">Credenciales</Text>
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">Correo institucional</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="usuario@unmsm.edu.pe"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="rounded-xl border border-border bg-background py-3 px-4 text-sm text-foreground"
                  placeholderTextColorClassName="accent-muted"
                  selectionColorClassName="accent-primary"
                  cursorColorClassName="accent-primary"
                  underlineColorAndroidClassName="accent-transparent"
                />
              </View>
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">Contraseña</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                  className="rounded-xl border border-border bg-background py-3 px-4 text-sm text-foreground"
                  placeholderTextColorClassName="accent-muted"
                  selectionColorClassName="accent-primary"
                  cursorColorClassName="accent-primary"
                  underlineColorAndroidClassName="accent-transparent"
                />
              </View>
              <Button
                title="Siguiente"
                onPress={() => setStep(2)}
                disabled={!email || !password}
              />
              <Pressable onPress={() => router.push('/(auth)/login')} className="items-center mt-2">
                <Text className="text-sm text-foreground-secondary">
                  ¿Ya tienes cuenta? <Text className="text-primary font-semibold">Inicia sesión</Text>
                </Text>
              </Pressable>
            </View>
          )}

          {/* Step 2: Historial */}
          {step === 2 && (
            <View className="gap-4">
              <Text className="text-lg font-semibold text-foreground mb-2">Historial Académico</Text>
              <Text className="text-sm text-muted mb-2">Sube tu historial académico en PDF (descargado del SIGA).</Text>
              <FilePicker label="Historial PDF" file={historial} onPick={setHistorial} onClear={() => setHistorial(null)} />
              <View className="flex-row gap-3 mt-2">
                <Button title="Atrás" onPress={() => setStep(1)} variant="outline" className="flex-1" />
                <Button title="Siguiente" onPress={() => setStep(3)} disabled={!historial} className="flex-1" />
              </View>
            </View>
          )}

          {/* Step 3: Matricula */}
          {step === 3 && (
            <View className="gap-4">
              <Text className="text-lg font-semibold text-foreground mb-2">Matrícula Actual</Text>
              <Pressable
                onPress={() => { setIsEgresado(!isEgresado); if (!isEgresado) setMatricula(null); }}
                className="flex-row items-center gap-3 mb-2"
              >
                <View className={['w-5 h-5 rounded border-2 items-center justify-center', isEgresado ? 'bg-primary border-primary' : 'border-border'].join(' ')}>
                  {isEgresado && <Feather name="check" size={12} color="white" />}
                </View>
                <Text className="text-sm text-foreground">Soy egresado (no tengo matrícula activa)</Text>
              </Pressable>
              {!isEgresado && (
                <FilePicker label="Matrícula PDF" file={matricula} onPick={setMatricula} onClear={() => setMatricula(null)} />
              )}
              <View className="flex-row gap-3 mt-2">
                <Button title="Atrás" onPress={() => setStep(2)} variant="outline" className="flex-1" />
                <Button title="Siguiente" onPress={() => setStep(4)} disabled={!isEgresado && !matricula} className="flex-1" />
              </View>
            </View>
          )}

          {/* Step 4: CV */}
          {step === 4 && (
            <View className="gap-4">
              <Text className="text-lg font-semibold text-foreground mb-2">Curriculum Vitae</Text>
              <Text className="text-sm text-muted mb-2">La IA extraerá tus habilidades y experiencia del CV.</Text>
              <FilePicker label="CV PDF" file={cv} onPick={setCv} onClear={() => setCv(null)} />
              <View className="flex-row gap-3 mt-2">
                <Button title="Atrás" onPress={() => setStep(3)} variant="outline" className="flex-1" />
                <Button title="Procesar" onPress={handleProcessPDFs} disabled={!cv} loading={loading} className="flex-1" />
              </View>
            </View>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && profileData && (
            <View className="gap-4 items-center">
              <View className="w-16 h-16 rounded-full bg-success-soft items-center justify-center mb-2">
                <Feather name="check-circle" size={32} color="#3D8B5E" />
              </View>
              <Text className="text-xl font-bold text-foreground text-center">¡Registro exitoso!</Text>
              <Text className="text-sm text-muted text-center">
                Bienvenido, {profileData.historial.estudiante.nombres_apellidos}
              </Text>
              <View className="w-full rounded-2xl border border-border bg-surface p-5 mt-4 gap-3">
                <InfoRow label="Código" value={profileData.historial.estudiante.codigo_matricula} />
                <InfoRow label="Facultad" value={profileData.historial.estudiante.facultad} />
                <InfoRow label="Programa" value={profileData.historial.estudiante.escuela} />
                <InfoRow label="Promedio" value={String(profileData.historial.resumen_creditos.promedio_ponderado)} />
              </View>
              <Button title="Ir al Dashboard" onPress={() => router.replace('/(app)/home')} className="w-full mt-2" />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs font-medium uppercase tracking-wide text-muted">{label}</Text>
      <Text className="text-sm text-foreground font-medium">{value}</Text>
    </View>
  );
}
