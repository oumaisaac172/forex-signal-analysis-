// Browser Notification utility for AI Setup Alerts

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
}

export function sendSetupAlertNotification({
  pair,
  direction,
  timeframe = '1H',
  analysisType = 'Key Liquidity Sweep',
  entryPrice,
  onClick,
}: {
  pair: string;
  direction: 'BUY' | 'SELL';
  timeframe?: string;
  analysisType?: string;
  entryPrice?: string;
  onClick?: () => void;
}): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const icon = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
    const title = `⚡ AI Signal Alert: ${pair} (${direction})`;
    const body = `Potential ${timeframe} ${analysisType} detected${entryPrice ? ` near ${entryPrice}` : ''}. Click to open analysis in Forex Signal Analyzer.`;

    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: `ai-setup-${pair}-${Date.now()}`,
    });

    notification.onclick = () => {
      window.focus();
      if (onClick) onClick();
      notification.close();
    };

    return true;
  } catch (err) {
    console.error('Error dispatching browser notification:', err);
    return false;
  }
}
