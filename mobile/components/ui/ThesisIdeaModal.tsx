import { useState } from 'react';
import { View, Text, TextInput, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { updateStudent } from '../../api/studentApi';

interface ThesisIdeaModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ThesisIdeaModal({ onClose, onSuccess }: ThesisIdeaModalProps) {
  const { user, token, updateUser } = useAuth();
  const [idea, setIdea] = useState(user?.thesis_idea || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!idea.trim()) {
      setError('La idea de tesis no puede estar vacía');
      return;
    }
    if (!user || !token) return;

    setLoading(true);
    setError('');
    try {
      await updateStudent(user.student_id, token, { thesis_idea: idea.trim() });
      updateUser({ thesis_idea: idea.trim() });
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Error al guardar la idea de tesis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface rounded-t-3xl px-5 pt-5 pb-10">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-3">
            <View className="p-2 rounded-xl bg-primary/10">
              <Feather name="book-open" size={22} color="#4F6D7A" />
            </View>
            <Text className="text-lg font-bold text-foreground flex-1">
              Insertar Idea de Tesis
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color="#8E8E9E" />
            </Pressable>
          </View>

          <Text className="text-sm text-muted mb-4 leading-5">
            Escribe el título de tu idea de tesis. Esto nos dará el contexto para recomendar asesores precisos y generar reportes de alineamiento.
          </Text>

          <TextInput
            value={idea}
            onChangeText={(t) => { setIdea(t); setError(''); }}
            placeholder="Ej: Sistema Web para Gestión de Comercios del Área de..."
            multiline
            numberOfLines={4}
            className="bg-surface-alt border border-border rounded-xl px-4 py-3 text-sm text-foreground mb-2"
            placeholderTextColorClassName="accent-muted"
            selectionColorClassName="accent-primary"
            cursorColorClassName="accent-primary"
            underlineColorAndroidClassName="accent-transparent"
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />

          {error ? (
            <Text className="text-xs text-error font-medium mb-3">{error}</Text>
          ) : null}

          <View className="flex-row gap-3 mt-2">
            <Pressable
              onPress={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-border items-center"
            >
              <Text className="text-sm font-medium text-muted">Saltar por ahora</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={loading || !idea.trim()}
              className={[
                'flex-1 py-3 rounded-xl items-center justify-center flex-row gap-2',
                loading || !idea.trim() ? 'bg-primary/50' : 'bg-primary',
              ].join(' ')}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : null}
              <Text className="text-sm font-semibold text-white">
                {loading ? 'Guardando...' : 'Guardar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
