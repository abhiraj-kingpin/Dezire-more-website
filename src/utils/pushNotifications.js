import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { BASE } from '../hooks/useProducts';

let currentToken = null;

async function sendTokenToBackend(token, authHeaders) {
  try {
    await fetch(`${BASE}/auth/fcm-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.error('[push] Failed to register device token:', err.message);
  }
}

export async function initPushNotifications(authHeaders) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') return;

    await PushNotifications.addListener('registration', (token) => {
      currentToken = token.value;
      sendTokenToBackend(token.value, authHeaders);
    });
    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[push] Registration error:', err.error);
    });

    await PushNotifications.register();
  } catch (err) {
    console.error('[push] Setup failed:', err.message);
  }
}

export async function removePushToken(authHeaders) {
  if (!Capacitor.isNativePlatform() || !currentToken) return;
  try {
    await fetch(`${BASE}/auth/fcm-token`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ token: currentToken }),
    });
  } catch (err) {
    console.error('[push] Failed to remove device token:', err.message);
  } finally {
    currentToken = null;
  }
}
