import React, { useState, useEffect } from 'react';
import { Card, Spinner } from '../../components/ui';
import { TrendingUp, DollarSign } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const MonthlyTrendChart = ({ data: initialData }) => {
  const [trendData, setTrendData] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData || initialData.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setTrendData(initialData);
      setLoading(false);
      return;
    }

    const fetchTrend = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get('/dashboard/monthly-trend');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setTrendData(list);
      } catch (err) {
        console.error('Failed to fetch monthly trend:', err);
        setError('Unable to load monthly salary trend');
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, [initialData]);

  const maxGross = Math.max(...trendData.map((d) => parseFloat(d.total_gross_salary || 0)), 1);

  return (
    <Card
      title="Monthly Payroll Expenditure Trend"
      subtitle="Historical Gross vs Net Salary Disbursement"
    >
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Spinner size="md" />
          <p className="text-xs text-secondary" style={{ marginTop: '6px' }}>Loading trend data...</p>
        </div>
      ) : error ? (
        <div className="text-sm text-secondary" style={{ padding: '16px', textAlign: 'center' }}>
          {error}
        </div>
      ) : trendData.length === 0 ? (
        <div className="text-sm text-secondary" style={{ padding: '24px', textAlign: 'center' }}>
          No payrun trend data available yet. Finalize your first payrun to see monthly analytics.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: '#3B82F6', borderRadius: '2px' }} />
              Gross Salary
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: '#059669', borderRadius: '2px' }} />
              Net Salary Paid
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {trendData.map((item) => {
              const gross = parseFloat(item.total_gross_salary || 0);
              const net = parseFloat(item.total_net_salary || 0);
              const grossPct = (gross / maxGross) * 100;
              const netPct = (net / maxGross) * 100;

              return (
                <div key={item.pay_month} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span className="font-semibold" style={{ color: '#0F172A' }}>{item.pay_month}</span>
                    <span className="text-secondary text-xs">
                      Gross: ${gross.toLocaleString()} • Net: ${net.toLocaleString()} ({item.payslips_count} slips)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ height: '8px', width: `${grossPct}%`, backgroundColor: '#3B82F6', borderRadius: '4px', transition: 'width 300ms ease' }} />
                    <div style={{ height: '8px', width: `${netPct}%`, backgroundColor: '#059669', borderRadius: '4px', transition: 'width 300ms ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default MonthlyTrendChart;
