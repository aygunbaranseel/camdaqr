import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
// StatusBar bileşenini import et
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- YENİ İKONLAR (LUCIDE) ---
import { Home, Plus, User } from 'lucide-react-native';

const { Navigator } = createMaterialTopTabNavigator();
export const MaterialTopTabs = withLayoutContext(Navigator);

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + 10, height: 70 + insets.bottom }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // --- ORTA BUTON (QR EKLEME) ---
        if (route.name === 'qr') {
          return (
            <TouchableOpacity key={index} onPress={onPress} style={styles.middleButtonWrapper} activeOpacity={0.9}>
              <View style={styles.middleButton}>
                {/* DEĞİŞİKLİK 1: Plus İkonu */}
                <Plus size={34} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        }

        // --- DİĞER BUTONLAR (HOME / PROFILE) ---
        // Rengi belirle: Aktifse Mavi, Pasifse Gri
        const iconColor = isFocused ? "#2563EB" : "#9CA3AF";
        
        // İkonu belirle
        let IconComponent = Home; // Varsayılan
        if (route.name === 'profile') IconComponent = User;

        return (
          <TouchableOpacity key={index} onPress={onPress} style={styles.tabButton}>
            {/* DEĞİŞİKLİK 2: Lucide Bileşeni */}
            <IconComponent 
              size={26} 
              color={iconColor} 
              // İstersen aktif olduğunda ikonun içini hafifçe doldurabilirsin (opsiyonel)
              // fill={isFocused ? "#2563EB" : "none"} 
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      
      {/* --- STATUS BAR --- */}
      <StatusBar 
        style="dark"                // İkonları (Saat, Pil) Siyah yapar
        backgroundColor="#F8F9FA"   // Arka planı uygulamanla aynı renk yapar
        translucent={false}         // İçeriğin status barın altına girmesini engeller (Android için)
      />
      {/* ------------------ */}

      <MaterialTopTabs
        tabBarPosition="bottom"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          swipeEnabled: true,
          animationEnabled: true,
        }}
      >
        <MaterialTopTabs.Screen name="index" options={{ title: "Ana Sayfa" }} />
        <MaterialTopTabs.Screen name="qr" options={{ title: "QR" }} />
        <MaterialTopTabs.Screen name="profile" options={{ title: "Profil" }} />
      </MaterialTopTabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderTopWidth: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  middleButtonWrapper: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  middleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    borderWidth: 4,
    borderColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
});