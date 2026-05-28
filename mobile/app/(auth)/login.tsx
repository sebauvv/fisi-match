import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { loginStudent } from '../../api/authApi';
import { getStudent } from '../../api/studentApi';
import type { AuthUser } from '../../types/student';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);

    try {
      const res = await loginStudent(email, password);
      const fullProfile = await getStudent(res.student_id, res.access_token);
      const profile = (fullProfile as any).historial ?? fullProfile;
      const student = profile.estudiante ?? fullProfile.estudiante;

      const user: AuthUser = {
        student_id: res.student_id,
        email: res.email,
        estudiante: {
          nombres_apellidos: student?.nombres_apellidos || res.nombres_apellidos,
          codigo_matricula: student?.codigo_matricula || '',
          facultad: student?.facultad || '',
          escuela: student?.escuela || '',
          plan: student?.plan || '',
        },
        periodos_academicos: profile.periodos_academicos || (fullProfile as any).periodos_academicos || [],
        resumen_creditos: profile.resumen_creditos || (fullProfile as any).resumen_creditos || {
          creditaje_requerido_para_egresar: 0,
          creditaje_aprobado: 0,
          obligatorios: 0,
          de_especialidad: 0,
          electivos_generales: 0,
          electivos_de_especialidad: 0,
          optativos: 0,
          alternativos: 0,
          de_otra_especialidad: 0,
          mas_de_una_vez: 0,
          otros: 0,
          creditaje_faltante: 0,
          promedio_ponderado: 0,
        },
        cv_text: (fullProfile as any).cv_text || (fullProfile as any).cv?.cv_text || '',
        thesis_idea: (fullProfile as any).thesis_idea || '',
        pdf_urls: {
          historial: (fullProfile as any).pdf_url_historial || (fullProfile as any).pdf_urls?.historial,
          matricula: (fullProfile as any).pdf_url_matricula || (fullProfile as any).pdf_urls?.matricula,
          cv: (fullProfile as any).pdf_url_cv || (fullProfile as any).pdf_urls?.cv,
        },
      };

      login(user, res.access_token);
      router.replace('/(app)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold tracking-tight text-foreground">FISI Match</Text>
            <Text className="mt-2 text-sm text-muted text-center">
              Sistema de Recomendación de Asesor de Tesis
            </Text>
          </View>

          {/* Card */}
          <View className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7">
            <Text className="text-xl font-semibold text-foreground mb-6">Iniciar sesión</Text>

            <View className="gap-4">
              {/* Email */}
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">Correo institucional</Text>
                <View className="relative">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="usuario@unmsm.edu.pe"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground focus:border-primary"
                    placeholderTextColorClassName="accent-muted"
                    selectionColorClassName="accent-primary"
                    cursorColorClassName="accent-primary"
                    underlineColorAndroidClassName="accent-transparent"
                  />
                  <View className="absolute left-3 top-3.5 pointer-events-none">
                    <Feather name="mail" size={16} color="#8E8E9E" />
                  </View>
                </View>
              </View>

              {/* Password */}
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">Contraseña</Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Tu contraseña"
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm text-foreground focus:border-primary"
                    placeholderTextColorClassName="accent-muted"
                    selectionColorClassName="accent-primary"
                    cursorColorClassName="accent-primary"
                    underlineColorAndroidClassName="accent-transparent"
                  />
                  <View className="absolute left-3 top-3.5 pointer-events-none">
                    <Feather name="lock" size={16} color="#8E8E9E" />
                  </View>
                  <Pressable
                    onPress={() => setShowPw(!showPw)}
                    className="absolute right-3 top-3.5"
                  >
                    <Feather name={showPw ? 'eye-off' : 'eye'} size={16} color="#8E8E9E" />
                  </Pressable>
                </View>
              </View>

              {error ? <ErrorBanner message={error} /> : null}

              <Button title={loading ? 'Cargando...' : 'Ingresar'} onPress={handleSubmit} loading={loading} disabled={!email || !password} />
            </View>

            {/* Register link */}
            <View className="mt-6 flex-row items-center justify-center gap-1">
              <Text className="text-sm text-foreground-secondary">No tienes cuenta?</Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text className="text-sm font-semibold text-primary">Regístrate</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
