import React, { useState, useEffect } from 'react';
import { portfolioService, CryptoHolding } from '../services/portfolioService';
import { useCryptoAlerts } from '../hooks/useCryptoAlerts';
import { CryptoAlertManager } from './CryptoAlertManager';
import { Loader2, TrendingUp, DollarSign, Bell } from 'lucide-react';
import { auth } from '../lib/firebase';

export const PortfolioTracker: React.FC<{ userId: string }> = ({ userId }) => {
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [prices, setPrices] = useState<Record<string, { usd: number }>>({});
  const [loading, setLoading] = useState(true);
  const alerts = useCryptoAlerts(userId);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [portfolio, priceData] = await Promise.all([
          portfolioService.getPortfolio(userId),
          portfolioService.getPrices()
        ]);
        setHoldings(portfolio);
        setPrices(priceData);
      } catch (err) {
        console.error('Failed to fetch portfolio data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, refresh]);

  const netAssetValue = holdings.reduce((acc, h) => {
    const price = prices[h.symbol.toLowerCase()]?.usd || 0;
    return acc + h.amount * price;
  }, 0);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="p-4 rounded-xl bg-black/40 border border-emerald-900 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Net Asset Value (NAV)</p>
          <p className="text-2xl font-black text-white">${netAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <TrendingUp className="w-8 h-8 text-emerald-500" />
      </div>

      <div className="grid gap-2">
        {holdings.map(h => (
          <div key={h.symbol} className="flex justify-between items-center p-3 bg-black/30 rounded-lg border border-emerald-900/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-300">{h.symbol.toUpperCase()}</span>
              <span className="text-xs text-zinc-500">{h.amount}</span>
            </div>
            <span className="font-bold text-white">
              ${(h.amount * (prices[h.symbol.toLowerCase()]?.usd || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-emerald-900/40">
        <div className="flex items-center gap-2 mb-3 text-emerald-400">
          <Bell className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase">Price Alerts</h3>
        </div>
        <CryptoAlertManager userId={userId} alerts={alerts} onUpdate={() => setRefresh(prev => prev + 1)} />
      </div>
    </div>
  );
};
