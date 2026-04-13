import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const triggerHapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      console.error('Haptics not available', e);
    }
  }
};

export const triggerSelectionHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
    } catch (e) {
      // Ignore
    }
  }
};

export const triggerSuccessHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.notification({ type: 'SUCCESS' as any });
      } catch (e) {}
    }
};
