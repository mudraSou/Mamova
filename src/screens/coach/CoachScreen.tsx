import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { isSafeToCoach, classifyEscalation, getMatchedFlags } from '@/lib/safety';
import { askCoach, type ChatMessage } from '@/lib/aiCoach';
import { palette, typography, spacing, radius, shadows, gradients } from '@/theme';
import escalationData from '@/data/escalation.json';

const ESCALATION = (escalationData as any).categories as Record<string, {
  title: string; body: string; reassurance: string | null; disclaimer: string;
  actions: { priority: number; label: string; detail: string }[];
}>;

type Msg = { id: string; role: 'user' | 'coach' | 'escalation'; text?: string; category?: string };

const PROMPTS = [
  'My baby keeps slipping off during a feed — help?',
  'How do I know if my baby is getting enough milk?',
  'My nipples hurt every time I latch.',
];

// ── Typing indicator ──────────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      );
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.coachBubble}>
      <Text style={styles.coachLabel}>Mamova ✦</Text>
      <View style={styles.dots}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
        ))}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────
export function CoachScreen() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollToEnd = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

  const addMsg = (msg: Omit<Msg, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: String(Date.now() + Math.random()) }]);
    scrollToEnd();
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addMsg({ role: 'user', text });

    // Safety gate — runs synchronously, no AI involved
    if (!isSafeToCoach(text)) {
      const category = classifyEscalation(text);
      // getMatchedFlags is for internal logging only — never shown to user
      void getMatchedFlags(text);
      addMsg({ role: 'escalation', category });
      return;
    }

    // Build history for AI context (user + coach messages only)
    const history: ChatMessage[] = messages
      .filter(m => m.role === 'user' || m.role === 'coach')
      .filter(m => m.text)
      .map(m => ({ role: m.role as 'user' | 'coach', text: m.text! }));

    setIsLoading(true);
    try {
      const reply = await askCoach(history, text);
      addMsg({ role: 'coach', text: reply });
    } catch {
      addMsg({
        role: 'coach',
        text: "I'm having trouble connecting right now. Please try again in a moment — or if this is urgent, please reach out to your midwife or healthcare provider.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayList: (Msg | { id: string; role: 'typing' })[] = isLoading
    ? [...messages, { id: '__typing__', role: 'typing' as const }]
    : messages;

  return (
    <LinearGradient colors={[palette.dark.bg, palette.dark.surface0]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ask me anything</Text>
            <Text style={styles.headerSub}>Breastfeeding · Recovery · Wellbeing</Text>
          </View>

          {/* Messages */}
          <FlatList
            ref={listRef}
            data={displayList}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>◆</Text>
                <Text style={styles.emptyTitle}>Ask anything about breastfeeding</Text>
                <Text style={styles.emptySub}>Try one of these to get started:</Text>
                <View style={styles.chips}>
                  {PROMPTS.map(p => (
                    <TouchableOpacity
                      key={p}
                      style={styles.chip}
                      onPress={() => setInput(p)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.chipText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
            renderItem={({ item: msg }) => {
              if (msg.role === 'typing') return <TypingIndicator />;

              if (msg.role === 'user') {
                return (
                  <View style={styles.userBubbleRow}>
                    <LinearGradient
                      colors={gradients.button}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.userBubble}
                    >
                      <Text style={styles.userText}>{(msg as Msg).text}</Text>
                    </LinearGradient>
                  </View>
                );
              }

              if (msg.role === 'coach') {
                return (
                  <View style={styles.coachBubble}>
                    <Text style={styles.coachLabel}>Mamova ✦</Text>
                    <Text style={styles.coachText}>{(msg as Msg).text}</Text>
                  </View>
                );
              }

              // Escalation card
              const cat = ESCALATION[(msg as Msg).category ?? 'default'];
              return (
                <View style={styles.escalation}>
                  <Text style={styles.escalationTitle}>{cat.title}</Text>
                  <Text style={styles.escalationBody}>{cat.body}</Text>
                  {cat.actions
                    .sort((a: any, b: any) => a.priority - b.priority)
                    .map((a: any, i: number) => (
                      <View key={i} style={styles.escalationAction}>
                        <Text style={styles.escalationActionLabel}>{a.label}</Text>
                        <Text style={styles.escalationActionDetail}>{a.detail}</Text>
                      </View>
                    ))}
                  {cat.reassurance && (
                    <Text style={styles.escalationReassurance}>{cat.reassurance}</Text>
                  )}
                  <Text style={styles.escalationDisclaimer}>{cat.disclaimer}</Text>
                </View>
              );
            }}
          />

          {/* Input bar */}
          <View style={styles.inputBar}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Describe what you're experiencing…"
                placeholderTextColor={palette.darkText.muted}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient colors={gradients.button} style={styles.sendGrad}>
                  <Text style={styles.sendIcon}>↑</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: 2 },
  headerTitle: { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes.xl, color: palette.darkText.primary },
  headerSub:   { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.muted },

  msgList: { flexGrow: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.md },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', paddingTop: spacing['2xl'], gap: spacing.md },
  emptyIcon:  { fontSize: 40, color: palette.softFuchsia, opacity: 0.6 },
  emptyTitle: { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes.xl, color: palette.darkText.primary, textAlign: 'center' },
  emptySub:   { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.muted },
  chips:      { width: '100%', gap: spacing.sm },
  chip: {
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.dark.surface2,
  },
  chipText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.5 },

  // User bubble
  userBubbleRow: { alignItems: 'flex-end' },
  userBubble:    { maxWidth: '80%', borderRadius: radius.lg, padding: spacing.md, borderBottomRightRadius: 4 },
  userText:      { fontFamily: typography.fonts.body, fontSize: typography.sizes.md, color: palette.white, lineHeight: typography.sizes.md * 1.5 },

  // Coach bubble
  coachBubble: {
    maxWidth: '85%',
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg, borderBottomLeftRadius: 4,
    padding: spacing.md, gap: spacing.xs,
    ...shadows.sm,
  },
  coachLabel: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.softFuchsia, textTransform: 'uppercase', letterSpacing: 0.8 },
  coachText:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.md, color: palette.darkText.primary, lineHeight: typography.sizes.md * 1.6 },

  // Typing dots
  dots: { flexDirection: 'row', gap: 5, paddingVertical: 4 },
  dot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.softFuchsia },

  // Escalation
  escalation: {
    backgroundColor: palette.urgentBg,
    borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.md,
    borderWidth: 1, borderColor: `${palette.urgent}33`,
  },
  escalationTitle:        { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.md, color: palette.urgent },
  escalationBody:         { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.6 },
  escalationAction:       { backgroundColor: palette.dark.surface1, borderRadius: radius.md, padding: spacing.sm, gap: 2 },
  escalationActionLabel:  { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.sm, color: palette.darkText.primary },
  escalationActionDetail: { fontFamily: typography.fonts.body, fontSize: typography.sizes.xs, color: palette.darkText.muted },
  escalationReassurance:  { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.xs, color: palette.safe, lineHeight: typography.sizes.xs * 1.6, opacity: 0.85 },
  escalationDisclaimer:   { fontFamily: typography.fonts.body, fontSize: typography.sizes.xs, color: palette.darkText.muted, fontStyle: 'italic', lineHeight: typography.sizes.xs * 1.6 },

  // Input bar
  inputBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: palette.dark.surface2 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, backgroundColor: palette.dark.surface1, borderRadius: radius.xl, padding: spacing.sm },
  input: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.primary,
    maxHeight: 96,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sendBtn:         { width: 40, height: 40 },
  sendBtnDisabled: { opacity: 0.35 },
  sendGrad:        { flex: 1, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  sendIcon:        { fontSize: 18, color: palette.white, fontWeight: '700' },
});
