import React from 'react';
import { NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { palette, typography, spacing, radius } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

// ── Screen imports ────────────────────────────────────────────────
import { WelcomeScreen }       from '@/screens/onboarding/WelcomeScreen';
import { OnboardingScreen }    from '@/screens/onboarding/OnboardingScreen';
import { LoginScreen }         from '@/screens/auth/LoginScreen';
import { HomeScreen }          from '@/screens/home/HomeScreen';
import { SymptomsListScreen }  from '@/screens/symptoms/SymptomsListScreen';
import { SymptomDetailScreen } from '@/screens/symptoms/SymptomDetailScreen';
import { PositionsListScreen } from '@/screens/positions/PositionsListScreen';
import { PositionDetailScreen }from '@/screens/positions/PositionDetailScreen';
import { CoachScreen }         from '@/screens/coach/CoachScreen';

// ── Stack param types ─────────────────────────────────────────────
export type RootStackParams = {
  Welcome: undefined;
  Login: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParams = {
  Home: undefined;
  Symptoms:  NavigatorScreenParams<SymptomsStackParams>  | undefined;
  Positions: NavigatorScreenParams<PositionsStackParams> | undefined;
  Coach: undefined;
};

export type SymptomsStackParams = {
  SymptomsList: undefined;
  SymptomDetail: { slug: string };
};

export type PositionsStackParams = {
  PositionsList: undefined;
  PositionDetail: { slug: string };
};

const Root      = createNativeStackNavigator<RootStackParams>();
const Tab       = createBottomTabNavigator<MainTabParams>();
const SympStack = createNativeStackNavigator<SymptomsStackParams>();
const PosStack  = createNativeStackNavigator<PositionsStackParams>();

// ── Tab bar icons (text-based — replace with SVG/icon lib if needed)
const TAB_ICONS: Record<string, { outline: string; filled: string }> = {
  Home:      { outline: '⌂',  filled: '⌂'  },
  Symptoms:  { outline: '◎',  filled: '●'  },
  Positions: { outline: '✦',  filled: '✦'  },
  Coach:     { outline: '◇',  filled: '◆'  },
};

function SymptomsStack() {
  return (
    <SympStack.Navigator screenOptions={{ headerShown: false }}>
      <SympStack.Screen name="SymptomsList"  component={SymptomsListScreen} />
      <SympStack.Screen name="SymptomDetail" component={SymptomDetailScreen} />
    </SympStack.Navigator>
  );
}

function PositionsStack() {
  return (
    <PosStack.Navigator screenOptions={{ headerShown: false }}>
      <PosStack.Screen name="PositionsList"  component={PositionsListScreen} />
      <PosStack.Screen name="PositionDetail" component={PositionDetailScreen} />
    </PosStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          Platform.OS === 'ios'
            ? <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(26,17,51,0.96)' }]} />
        ),
        tabBarLabel: ({ focused }) => (
          <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {focused ? icons?.filled : icons?.outline}
            </Text>
          );
        },
        tabBarActiveTintColor:   palette.lightBlush,
        tabBarInactiveTintColor: palette.darkText.muted,
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Symptoms"  component={SymptomsStack} />
      <Tab.Screen name="Positions" component={PositionsStack} />
      <Tab.Screen name="Coach"     component={CoachScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { session, isLoading } = useAuthStore();
  const { profile }            = useProfileStore();

  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!session ? (
          <>
            <Root.Screen name="Welcome" component={WelcomeScreen} />
            <Root.Screen name="Login"   component={LoginScreen} />
          </>
        ) : !profile ? (
          <Root.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Root.Screen name="Main" component={MainTabs} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    height: 72 + (Platform.OS === 'ios' ? 20 : 0),
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  tabIcon: {
    fontSize: 18,
    color: palette.darkText.muted,
    marginBottom: 2,
  },
  tabIconActive: {
    color: palette.lightBlush,
  },
  tabLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: palette.darkText.muted,
  },
  tabLabelActive: {
    color: palette.lightBlush,
  },
});
