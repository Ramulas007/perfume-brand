import { supabase } from '@/integrations/supabase/client';

export const subscribeToPush = async (userId?: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if permission is already granted
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') return;

    // Get VAPID public key from settings or environment
    // For now using a placeholder - in production this would come from an edge function or settings
    const publicVapidKey = 'BEl62OhptIK_YhcyAn74rJjQ4y5Qc8hM3XjC3S_4V6B9A9V8C7X6Y5Z4A3B2C1'; 

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    // Save to Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription_data: JSON.parse(JSON.stringify(subscription)),
        device_type: /Android/i.test(navigator.userAgent) ? 'android' : 'web'
      }, { onConflict: 'subscription_data' });

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return false;
  }
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
