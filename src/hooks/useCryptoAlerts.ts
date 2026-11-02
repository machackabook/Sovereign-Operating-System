import { useState, useEffect } from 'react';
import { portfolioService, CryptoAlert } from '../services/portfolioService';

export const useCryptoAlerts = (userId: string) => {
  const [alerts, setAlerts] = useState<CryptoAlert[]>([]);

  useEffect(() => {
    const checkAlerts = async () => {
      const activeAlerts = await portfolioService.getAlerts(userId);
      const prices = await portfolioService.getPrices();
      
      let updated = false;
      const newAlerts = activeAlerts.map(alert => {
        if (alert.triggered) return alert;

        const price = prices[alert.symbol.toLowerCase()]?.usd;
        if (!price) return alert;

        const triggered = alert.condition === 'above' 
          ? price >= alert.threshold 
          : price <= alert.threshold;

        if (triggered) {
          updated = true;
          if (Notification.permission === 'granted') {
            new Notification('Crypto Price Alert', {
              body: `${alert.symbol.toUpperCase()} has moved ${alert.condition} $${alert.threshold}. Current: $${price}`,
            });
          }
        }
        return { ...alert, triggered };
      });

      if (updated) {
        await portfolioService.updateAlerts(userId, newAlerts);
        setAlerts(newAlerts);
      } else {
        setAlerts(activeAlerts);
      }
    };

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    checkAlerts();
    const interval = setInterval(checkAlerts, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [userId]);

  return alerts;
};
