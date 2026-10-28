import React from 'react';
import {View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {SectionScreen} from '../screens/sections/SectionScreen';
import {ProfileScreen} from '../screens/profile/ProfileScreen';
import {BottomNavBar} from './BottomNavBar';
import {setNavigationRef, RootStackParamList} from './navigationActions';
import {useDirection, rtlDirectionStyle} from '../i18n/useDirection';

/**
 * Root navigator: a React Navigation bottom-tab navigator hosting the four
 * primary sections (Explore, Map, Plan, My Profile). The custom BottomNavBar
 * (US-001) is rendered as a persistent overlay via `tabBar` so it owns all
 * rendering/active-state/i18n/RTL behavior described in Section 6/US-001-003,
 * while React Navigation still drives actual screen mounting/transitions.
 */

const Tab = createBottomTabNavigator<RootStackParamList>();

function ExploreScreen(): React.JSX.Element {
  return <SectionScreen sectionId="explore" />;
}
function MapScreen(): React.JSX.Element {
  return <SectionScreen sectionId="map" />;
}
function PlanScreen(): React.JSX.Element {
  return <SectionScreen sectionId="plan" />;
}

export function RootNavigator(): React.JSX.Element {
  const direction = useDirection();

  return (
    <SafeAreaProvider>
      <View style={[styles.flex, direction === 'RTL' ? rtlDirectionStyle : undefined]}>
        <NavigationContainer ref={ref => setNavigationRef(ref)}>
          <Tab.Navigator
            tabBar={() => <BottomNavBar />}
            screenOptions={{headerShown: false}}>
            <Tab.Screen name="ExploreScreen" component={ExploreScreen} />
            <Tab.Screen name="MapScreen" component={MapScreen} />
            <Tab.Screen name="PlanScreen" component={PlanScreen} />
            <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default RootNavigator;
