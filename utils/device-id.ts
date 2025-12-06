const DEVICE_ID_KEY = 'suma_device_id';

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate a simple unique ID (e.g., random string)
    // For a more robust solution, a UUID library would be preferred,
    // but without explicit instruction or importmap entry, this is a pragmatic approach.
    deviceId = 'device-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};