import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useProfileStore } from '@/store/profileStore';
import { palette, gradients, typography, spacing, radius } from '@/theme';

const STEPS = ['Name', 'Date', 'Type'] as const;
type Step = 0 | 1 | 2;

export function OnboardingScreen() {
  const [step, setStep]               = useState<Step>(0);
  const [babyName, setBabyName]       = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryType, setDeliveryType] = useState<'vaginal' | 'c-section'>('vaginal');
  const [error, setError]             = useState<string | null>(null);
  const { saveProfile, isLoading }    = useProfileStore();

  const today = new Date().toISOString().slice(0, 10);

  const advance = () => {
    setError(null);
    if (step === 1 && !deliveryDate) { setError('Please enter your delivery date.'); return; }
    if (step < 2) { setStep((step + 1) as Step); return; }
    handleSave();
  };

  const handleSave = async () => {
    if (!deliveryDate) { setError('Please enter your delivery date.'); return; }
    await saveProfile({ baby_name: babyName || null, delivery_date: deliveryDate, delivery_type: deliveryType });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <LinearGradient colors={gradients.splash} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Progress */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
            </View>

            {/* Step indicator */}
            <Text style={styles.stepLabel}>{step + 1} of {STEPS.length}</Text>

            {/* Step content */}
            {step === 0 && (
              <View style={styles.stepBlock}>
                <Text style={styles.stepTitle}>What's your baby's name?</Text>
                <Text style={styles.stepSub}>Optional — we'll use it to personalise your experience.</Text>
                <TextInput
                  style={styles.input}
                  value={babyName}
                  onChangeText={setBabyName}
                  placeholder="e.g. Meera"
                  placeholderTextColor={palette.darkText.muted}
                  autoFocus
                  maxLength={40}
                  returnKeyType="next"
                  onSubmitEditing={advance}
                />
              </View>
            )}

            {step === 1 && (
              <View style={styles.stepBlock}>
                <Text style={styles.stepTitle}>When did you deliver?</Text>
                <Text style={styles.stepSub}>We use this to show what's normal for your stage. Day 1 = your birth day.</Text>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  value={deliveryDate}
                  onChangeText={v => { setDeliveryDate(v); setError(null); }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={palette.darkText.muted}
                  autoFocus
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={advance}
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepBlock}>
                <Text style={styles.stepTitle}>How did you deliver?</Text>
                <Text style={styles.stepSub}>This helps us surface the right recovery content for you.</Text>
                <View style={styles.typeGroup}>
                  {(['vaginal', 'c-section'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeCard, deliveryType === type && styles.typeCardActive]}
                      onPress={() => setDeliveryType(type)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.typeEmoji}>{type === 'vaginal' ? '🌸' : '💜'}</Text>
                      <Text style={[styles.typeLabel, deliveryType === type && styles.typeLabelActive]}>
                        {type === 'vaginal' ? 'Vaginal' : 'C-section'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Button
              label={step < 2 ? 'Continue' : 'Let\'s begin'}
              onPress={advance}
              loading={isLoading}
              size="lg"
            />

            {step > 0 && (
              <TouchableOpacity onPress={() => setStep((step - 1) as Step)} style={styles.back}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.privacy}>🔒 Saved securely on your device.</Text>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['3xl'], gap: spacing.lg },

  progressBar: { height: 4, backgroundColor: palette.dark.surface2, borderRadius: 2, overflow: 'hidden' },
  progressFill:{ height: '100%', backgroundColor: palette.softFuchsia, borderRadius: 2 },

  stepLabel: { fontFamily: typography.fonts.body, fontSize: typography.sizes.xs, color: palette.darkText.muted, textTransform: 'uppercase', letterSpacing: 1 },

  stepBlock: { gap: spacing.md },
  stepTitle: { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes['3xl'], color: palette.darkText.primary, lineHeight: typography.sizes['3xl'] * 1.15 },
  stepSub:   { fontFamily: typography.fonts.body, fontSize: typography.sizes.md, color: palette.darkText.secondary, lineHeight: typography.sizes.md * 1.65 },

  input: {
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.lg,
    color: palette.darkText.primary,
    borderWidth: 1,
    borderColor: palette.dark.surface3,
  },
  inputError: { borderColor: palette.urgent },
  errorText:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.urgent },

  typeGroup: { flexDirection: 'row', gap: spacing.md },
  typeCard: {
    flex: 1, paddingVertical: spacing.lg,
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg,
    alignItems: 'center', gap: spacing.sm,
    borderWidth: 2, borderColor: 'transparent',
  },
  typeCardActive: { borderColor: palette.electricPurple, backgroundColor: palette.dark.surface2 },
  typeEmoji: { fontSize: 32 },
  typeLabel: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.secondary },
  typeLabelActive: { color: palette.lightBlush },

  back:     { alignSelf: 'center', paddingVertical: spacing.sm },
  backText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.sm, color: palette.softFuchsia },

  privacy: { fontFamily: typography.fonts.body, fontSize: typography.sizes.xs, color: palette.darkText.muted, textAlign: 'center' },
});
