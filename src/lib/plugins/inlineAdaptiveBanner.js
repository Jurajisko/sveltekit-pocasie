import { Capacitor, registerPlugin } from '@capacitor/core';

const InlineAdaptiveBanner = registerPlugin('InlineAdaptiveBanner');

function isAndroidNative() {
  return Capacitor.getPlatform() === 'android';
}

export async function initializeInlineAdaptiveBanner(options = {}) {
  if (!isAndroidNative()) return;
  await InlineAdaptiveBanner.initialize(options);
}

export async function showInlineAdaptiveBanner(options) {
  if (!isAndroidNative()) return;
  await InlineAdaptiveBanner.showBanner(options);
}

export async function updateInlineAdaptiveBanner(options) {
  if (!isAndroidNative()) return;
  await InlineAdaptiveBanner.updateBanner(options);
}

export async function hideInlineAdaptiveBanner(slotId = 'default') {
  if (!isAndroidNative()) return;
  await InlineAdaptiveBanner.hideBanner({ slotId });
}

export async function destroyInlineAdaptiveBanner(slotId = 'default') {
  if (!isAndroidNative()) return;
  await InlineAdaptiveBanner.destroyBanner({ slotId });
}

export function addInlineAdaptiveBannerListener(eventName, listener) {
  if (!isAndroidNative()) {
    return Promise.resolve({
      remove: async () => {}
    });
  }

  return InlineAdaptiveBanner.addListener(eventName, listener);
}

export function supportsInlineAdaptiveBanner() {
  return isAndroidNative();
}
