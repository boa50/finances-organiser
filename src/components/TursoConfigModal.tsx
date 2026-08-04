import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { tursoService } from '../services/tursoService';
import { TursoConfig } from '../types';
import { X } from 'lucide-react-native';

interface TursoConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const TursoConfigModal: React.FC<TursoConfigModalProps> = ({
  visible,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(
    null
  );
  const [currentConfig, setCurrentConfig] = useState<TursoConfig>({
    url: '',
    authToken: '',
    isConnected: false,
  });

  useEffect(() => {
    if (visible) {
      const cfg = tursoService.getConfig();
      setCurrentConfig(cfg);
      setUrl(cfg.url);
      setAuthToken(cfg.authToken);
      setStatusMessage(null);
    }
  }, [visible]);

  const handleTestConnection = async () => {
    if (!url.trim() || !authToken.trim()) {
      setStatusMessage({ text: 'Please enter both Turso Database URL and Auth Token.', isError: true });
      return;
    }

    setTesting(true);
    setStatusMessage(null);

    const res = await tursoService.testConnection(url, authToken);
    setTesting(false);
    setStatusMessage({ text: res.message, isError: !res.success });
  };

  const handleSave = async () => {
    setTesting(true);
    const res = await tursoService.saveConfig(url, authToken);
    setTesting(false);

    if (res.success || (!url && !authToken)) {
      setStatusMessage({ text: res.message, isError: false });
      onConfigSaved();
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setStatusMessage({ text: res.message, isError: true });
    }
  };

  const handleClear = async () => {
    setUrl('');
    setAuthToken('');
    await tursoService.saveConfig('', '');
    onConfigSaved();
    setStatusMessage({ text: 'Turso connection cleared. App operating in Local Storage mode.', isError: false });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Turso Cloud Database</Text>
              <Text style={styles.subtitle}>Configure your personal Turso SQLite database</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={{ gap: 16 }}>
            {/* Status pill */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: currentConfig.isConnected
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                  borderColor: currentConfig.isConnected ? '#10B981' : '#F59E0B',
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: currentConfig.isConnected ? '#10B981' : '#F59E0B' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: currentConfig.isConnected ? '#10B981' : '#F59E0B' },
                ]}
              >
                {currentConfig.isConnected
                  ? 'Connected & Syncing with Turso Cloud'
                  : 'Operating in Offline / Local Sync Mode'}
              </Text>
            </View>

            {/* Input: DB URL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Turso Database URL</Text>
              <TextInput
                style={styles.input}
                placeholder="libsql://your-db-name-org.turso.io"
                placeholderTextColor="#64748B"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>
                Find this in your Turso CLI (`turso db show &lt;db-name&gt;`) or Dashboard.
              </Text>
            </View>

            {/* Input: Auth Token */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Turso Auth Token</Text>
              <TextInput
                style={[styles.input, styles.tokenInput]}
                placeholder="eyJhbGciOi..."
                placeholderTextColor="#64748B"
                value={authToken}
                onChangeText={setAuthToken}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>
                Generated via `turso db tokens create &lt;db-name&gt;`.
              </Text>
            </View>

            {/* Status Message Feedback */}
            {statusMessage && (
              <View
                style={[
                  styles.msgBox,
                  {
                    backgroundColor: statusMessage.isError
                      ? 'rgba(244, 63, 94, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                    borderColor: statusMessage.isError ? '#F43F5E' : '#10B981',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.msgText,
                    { color: statusMessage.isError ? '#F43F5E' : '#10B981' },
                  ]}
                >
                  {statusMessage.text}
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.testBtn]}
                onPress={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <ActivityIndicator color="#F8FAFC" size="small" />
                ) : (
                  <Text style={styles.testBtnText}>Test Connection</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.saveBtn]}
                onPress={handleSave}
                disabled={testing}
              >
                <Text style={styles.saveBtnText}>Save & Sync</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Use Local Storage (Clear Turso Keys)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollBody: {
    flexGrow: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tokenInput: {
    fontFamily: 'monospace',
  },
  hint: {
    color: '#64748B',
    fontSize: 11,
  },
  msgBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  msgText: {
    fontSize: 13,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  testBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#38BDF8',
  },
  saveBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
