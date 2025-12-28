import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { ThemeMode } from '../constants/colors';
import { TrackingInterval } from '../hooks/useLocation';

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  trackingInterval: TrackingInterval;
  onThemeModeChange: (mode: ThemeMode) => void;
  onTrackingIntervalChange: (interval: TrackingInterval) => void;
  onExportGPX: () => void;
  onExportGeoJSON: () => void;
  onExportSVG: () => void;
  onClearData: () => void;
  totalPointCount: number | null;
  backgroundColor: string;
  textColor: string;
  controlsColor: string;
}

const TRACKING_INTERVALS: { value: TrackingInterval; label: string; unit: string }[] = [
  { value: 1, label: '1', unit: 'min' },
  { value: 5, label: '5', unit: 'min' },
  { value: 15, label: '15', unit: 'min' },
  { value: 30, label: '30', unit: 'min' },
  { value: 60, label: '1', unit: 'hour' },
];

const THEME_MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function SettingsDrawer({
  visible,
  onClose,
  themeMode,
  trackingInterval,
  onThemeModeChange,
  onTrackingIntervalChange,
  onExportGPX,
  onExportGeoJSON,
  onExportSVG,
  onClearData,
  totalPointCount,
  backgroundColor,
  textColor,
  controlsColor,
}: SettingsDrawerProps) {
  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all location history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            onClearData();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.drawer, { backgroundColor: backgroundColor + 'F0' }]}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={[styles.handle, { backgroundColor: controlsColor }]} />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Section title="Tracking Interval" titleColor={textColor}>
                <TrackingIntervalControl
                  options={TRACKING_INTERVALS}
                  value={trackingInterval}
                  onChange={onTrackingIntervalChange}
                  activeColor={textColor}
                  inactiveColor={controlsColor}
                />
              </Section>

              <Section title="Appearance" titleColor={textColor}>
                <SegmentedControl
                  options={THEME_MODES}
                  value={themeMode}
                  onChange={onThemeModeChange}
                  activeColor={textColor}
                  inactiveColor={controlsColor}
                />
              </Section>

              <Section title="Data" titleColor={textColor}>
                <Button
                  label="Export as GPX"
                  onPress={onExportGPX}
                  color={textColor}
                />
                <Button
                  label="Export as GeoJSON"
                  onPress={onExportGeoJSON}
                  color={textColor}
                />
                <Button
                  label="Export as SVG"
                  onPress={onExportSVG}
                  color={textColor}
                />
                <View style={styles.dataRow}>
                  <Text style={[styles.dataLabel, { color: controlsColor }]}>
                    Total points recorded
                  </Text>
                  <Text style={[styles.dataValue, { color: textColor }]}>
                    {totalPointCount ?? '—'}
                  </Text>
                </View>
                <Button
                  label="Clear All Data"
                  onPress={handleClearData}
                  color="#E06055"
                />
              </Section>

              <View style={styles.about}>
                <Text style={[styles.aboutText, { color: controlsColor }]}>
                  Trace v1.0
                </Text>
                <Text style={[styles.aboutText, { color: controlsColor }]}>
                  Your data never leaves this device.
                </Text>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function Section({ title, titleColor, children }: { title: string; titleColor: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: titleColor }]}>{title}</Text>
      {children}
    </View>
  );
}

function TrackingIntervalControl({
  options,
  value,
  onChange,
  activeColor,
  inactiveColor,
}: {
  options: { value: TrackingInterval; label: string; unit: string }[];
  value: TrackingInterval;
  onChange: (value: TrackingInterval) => void;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <View style={styles.segmentedControl}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.segment,
            value === option.value && styles.segmentActive,
            { borderColor: inactiveColor + '40' },
          ]}
          onPress={() => onChange(option.value)}
        >
          <Text
            style={[
              styles.intervalNumber,
              {
                color: value === option.value ? activeColor : inactiveColor,
              },
            ]}
          >
            {option.label}
          </Text>
          <Text
            style={[
              styles.intervalUnit,
              {
                color: value === option.value ? activeColor : inactiveColor,
              },
            ]}
          >
            {option.unit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  activeColor,
  inactiveColor,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <View style={styles.segmentedControl}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.segment,
            value === option.value && styles.segmentActive,
            { borderColor: inactiveColor + '40' },
          ]}
          onPress={() => onChange(option.value)}
        >
          <Text
            style={[
              styles.segmentText,
              {
                color: value === option.value ? activeColor : inactiveColor,
              },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Button({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  drawer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
    opacity: 0.3,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  intervalNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  intervalUnit: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'lowercase',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dataRow: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  dataValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  about: {
    marginTop: 24,
    alignItems: 'center',
    gap: 4,
  },
  aboutText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
