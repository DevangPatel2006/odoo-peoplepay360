import React, { useState, useEffect } from 'react';
import { Card, Spinner, Badge } from '../../components/ui';
import { TrendingUp, DollarSign, Calendar, BarChart2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const MonthlyTrendChart = ({ data: initialData }) => {
  const [trendData, setTrendData] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData || initialData.length === 0);
  const [error, setError] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

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

  // Aggregate Metrics from real data
  const totalGross = trendData.reduce((sum, d) => sum + parseFloat(d.total_gross_salary || 0), 0);
  const totalNet = trendData.reduce((sum, d) => sum + parseFloat(d.total_net_salary || 0), 0);
  const totalDeductions = Math.max(0, totalGross - totalNet);
  const totalPayslips = trendData.reduce((sum, d) => sum + parseInt(d.payslips_count || 0, 10), 0);
  const netRatio = totalGross > 0 ? ((totalNet / totalGross) * 100).toFixed(1) : 0;

  // Chart Dimensions & Scales
  const svgWidth = 520;
  const svgHeight = 220;
  const padLeft = 60;
  const padRight = 24;
  const padTop = 32;
  const padBottom = 42;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const rawMax = Math.max(...trendData.map((d) => parseFloat(d.total_gross_salary || 0)), 1);
  // Give top room for numbers
  const ceilMax = Math.ceil((rawMax * 1.25) / 2000) * 2000 || 2000;

  const yTicks = [0, ceilMax * 0.25, ceilMax * 0.5, ceilMax * 0.75, ceilMax];

  // Format month for display
  const formatMonth = (str) => {
    if (!str) return 'Month';
    try {
      const parts = str.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[monthIndex] || parts[1]} ${year}`;
      }
    } catch {}
    return str;
  };

  const activeItem = hoveredIdx !== null ? trendData[hoveredIdx] : (trendData.length > 0 ? trendData[trendData.length - 1] : null);

  return (
    <Card
      className="dashboard-card"
      title="Monthly Payroll Expenditure Trend"
      subtitle={trendData.length > 0 ? `Cumulative Net Paid: $${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })} across ${totalPayslips} payslips` : 'Historical Gross vs Net Salary Disbursement'}
    >
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
          <Spinner size="md" />
          <p className="text-xs text-secondary" style={{ marginTop: '8px' }}>Loading historical trend data...</p>
        </div>
      ) : error ? (
        <div className="text-sm text-secondary" style={{ padding: '24px', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
          {error}
        </div>
      ) : trendData.length === 0 ? (
        <div className="text-sm text-secondary" style={{ padding: '36px 20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
          <BarChart2 size={32} style={{ color: '#94A3B8', marginBottom: '8px', opacity: 0.6 }} />
          <span>No payrun trend data available yet. Finalize a payrun to view historical expenditure charts.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', minHeight: '260px', gap: '14px' }}>
          {/* TOP CHART STATS STRIP */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8125rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 600 }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#0284C7', borderRadius: '3px' }} />
                Gross Salary
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 600 }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#059669', borderRadius: '3px' }} />
                Net Disbursed
              </span>
            </div>

            {activeItem && (
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                Period: <strong style={{ color: '#0F172A' }}>{formatMonth(activeItem.pay_month)}</strong> • Take-home: <strong style={{ color: '#059669' }}>{totalGross > 0 ? ((parseFloat(activeItem.total_net_salary || 0) / parseFloat(activeItem.total_gross_salary || 1)) * 100).toFixed(1) : 0}%</strong>
              </div>
            )}
          </div>

          {/* REAL SVG DUAL-COLUMN BAR CHART */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              style={{ width: '100%', height: 'auto', minHeight: '190px', display: 'block' }}
            >
              {/* Gradients */}
              <defs>
                <linearGradient id="grossGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
                <linearGradient id="netGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Ticks */}
              {yTicks.map((tickVal) => {
                const yPos = padTop + plotHeight - (tickVal / ceilMax) * plotHeight;
                const formattedTick = tickVal >= 1000 ? `$${Math.round(tickVal / 1000)}k` : `$${tickVal}`;

                return (
                  <g key={tickVal}>
                    <line
                      x1={padLeft}
                      x2={svgWidth - padRight}
                      y1={yPos}
                      y2={yPos}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft - 8}
                      y={yPos + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="500"
                      fill="#94A3B8"
                    >
                      {formattedTick}
                    </text>
                  </g>
                );
              })}

              {/* Baseline Axis */}
              <line
                x1={padLeft}
                x2={svgWidth - padRight}
                y1={padTop + plotHeight}
                y2={padTop + plotHeight}
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />

              {/* Dual Bars for each month */}
              {trendData.map((item, idx) => {
                const gross = parseFloat(item.total_gross_salary || 0);
                const net = parseFloat(item.total_net_salary || 0);

                const slotWidth = plotWidth / trendData.length;
                const slotCenterX = padLeft + (idx + 0.5) * slotWidth;

                const isSingleMonth = trendData.length === 1;
                const barWidth = isSingleMonth ? 46 : Math.min(32, Math.max(18, (slotWidth - 24) / 2));
                const barGap = isSingleMonth ? 14 : 6;

                const grossHeight = Math.max(4, (gross / ceilMax) * plotHeight);
                const netHeight = Math.max(4, (net / ceilMax) * plotHeight);

                const grossX = slotCenterX - barWidth - (barGap / 2);
                const netX = slotCenterX + (barGap / 2);

                const grossY = padTop + plotHeight - grossHeight;
                const netY = padTop + plotHeight - netHeight;

                const isHovered = hoveredIdx === idx;

                return (
                  <g 
                    key={item.pay_month || idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hover column background highlight */}
                    {isHovered && (
                      <rect
                        x={slotCenterX - slotWidth / 2 + 4}
                        y={padTop}
                        width={slotWidth - 8}
                        height={plotHeight}
                        fill="rgba(241, 245, 249, 0.65)"
                        rx="6"
                      />
                    )}

                    {/* Gross Bar */}
                    <rect
                      x={grossX}
                      y={grossY}
                      width={barWidth}
                      height={grossHeight}
                      rx="5"
                      fill="url(#grossGradient)"
                      style={{
                        transition: 'all 0.2s ease',
                        filter: isHovered ? 'drop-shadow(0 2px 8px rgba(2, 132, 199, 0.35))' : 'none'
                      }}
                    />

                    {/* Net Bar */}
                    <rect
                      x={netX}
                      y={netY}
                      width={barWidth}
                      height={netHeight}
                      rx="5"
                      fill="url(#netGradient)"
                      style={{
                        transition: 'all 0.2s ease',
                        filter: isHovered ? 'drop-shadow(0 2px 8px rgba(5, 150, 105, 0.35))' : 'none'
                      }}
                    />

                    {/* Value Labels Above Bars */}
                    <text
                      x={grossX + barWidth / 2}
                      y={grossY - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#0284C7"
                    >
                      ${gross >= 1000 ? `${(gross / 1000).toFixed(1)}k` : gross.toLocaleString()}
                    </text>

                    <text
                      x={netX + barWidth / 2}
                      y={netY - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#059669"
                    >
                      ${net >= 1000 ? `${(net / 1000).toFixed(1)}k` : net.toLocaleString()}
                    </text>

                    {/* Month Label on X-Axis */}
                    <text
                      x={slotCenterX}
                      y={padTop + plotHeight + 18}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#1E293B"
                    >
                      {formatMonth(item.pay_month)}
                    </text>

                    {/* Subtitle Slip Count */}
                    <text
                      x={slotCenterX}
                      y={padTop + plotHeight + 31}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="500"
                      fill="#64748B"
                    >
                      {item.payslips_count} payslip{parseInt(item.payslips_count, 10) !== 1 ? 's' : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* BOTTOM SUMMARY COMPARISON STRIP */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            fontSize: '0.75rem',
            color: '#64748B',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span>Total Gross: <strong style={{ color: '#0284C7' }}>${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
            <span>Net Disbursed: <strong style={{ color: '#059669' }}>${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
            <span>Taxes & Deductions: <strong style={{ color: '#D97706' }}>${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
            <Badge variant="success" style={{ fontSize: '0.6875rem' }}>{netRatio}% Retention</Badge>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MonthlyTrendChart;
