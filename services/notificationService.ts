import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Uygulama açıkken (kullanıcı içerideyken) bildirim gelirse üstten düşmesini sağlar
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  // Android için özel bildirim kanalı ayarı
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  // Cihazın fiziksel olup olmadığını kontrol ediyoruz (Simülatörlerde bildirim çalışmaz)
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Eğer izin verilmemişse kullanıcıya pop-up çıkarıp soruyoruz
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Bildirim izni reddedildi!');
      return null;
    }

    try {
      // Expo projenizin ID'sini alıp token üretiyoruz
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
      
    } catch (error) {
      console.log("Token alınırken hata oluştu:", error);
      return null;
    }
  } else {
    console.log('Bildirimleri test etmek için fiziksel bir cihaz kullanmalısınız.');
  }

  return token;
}