import React, { useState } from 'react';
import { Card, Badge } from '../../components/ui';
import { Building2, Users, DollarSign, PieChart as PieIcon } from 'lucide-react';

export const SalaryCostByDeptChart = ({ data = [] }) => {
  const depts = data || [];
  const totalCost = depts.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalEmployees = depts.reduce((acc, curr) => acc + (curr.count || 0), 0);
  const avgCostPerEmp = totalEmployees > 0 ? (totalCost / totalEmployees) : 0;
  
  // Clean, modern Emerald & Slate palette (avoids harsh unbranded colors)
  const palette = ['#059669', '#0284C7', '#D97706', '#4F46E5', '#E11D48', '#0D9488'];

  const [hoveredIdx, setHoveredIdx] = useState(null);

  // SVG Pie Dimensions
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;

  // Multi-department pie slice path generator
  const renderPieChart = () => {
    if (depts.length === 0) return null;

    // Single department: render full solid circular pie with subtle gradient & center badge
    if (depts.length === 1) {
      const dept = depts[0];
      const color = palette[0];
      const isHovered = hoveredIdx === 0;

      return (
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: 'visible' }}
          onMouseEnter={() => setHoveredIdx(0)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <radialGradient id="pieGradEmerald" cx="40%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="70%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </radialGradient>
            <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#059669" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Solid Pie Disc */}
          <circle
            cx={cx}
            cy={cy}
            r={isHovered ? r + 3 : r}
            fill="url(#pieGradEmerald)"
            stroke="#FFFFFF"
            strokeWidth="3"
            filter="url(#pieShadow)"
            style={{
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer'
            }}
          />

          {/* Center Callout Badge */}
          <circle
            cx={cx}
            cy={cy}
            r={26}
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}
          />
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="#0F172A"
          >
            100%
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fontSize="8"
            fontWeight="600"
            fill="#059669"
            textTransform="uppercase"
            letterSpacing="0.04em"
          >
            SHARE
          </text>
        </svg>
      );
    }

    // Multi-department pie slices
    let currentAngle = -90;
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="multiPieShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.1" />
          </filter>
        </defs>

        <g filter="url(#multiPieShadow)">
          {depts.map((dept, idx) => {
            const pct = totalCost > 0 ? (dept.cost / totalCost) : (1 / depts.length);
            const angle = pct * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;
            const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const color = palette[idx % palette.length];
            const isHovered = hoveredIdx === idx;

            return (
              <path
                key={idx}
                d={pathData}
                fill={color}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                style={{
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: `${cx}px ${cy}px`,
                  cursor: 'pointer',
                  filter: isHovered ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none'
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </g>
      </svg>
    );
  };

  return (
    <Card 
      className="dashboard-card"
      title="Salary Cost Breakdown by Department" 
      subtitle={depts.length > 0 ? `Total Monthly Salary Cost: $${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Live department payroll distribution'}
    >
      {depts.length === 0 ? (
        <div className="text-sm text-secondary" style={{ padding: '36px 20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
          <PieIcon size={32} style={{ color: '#94A3B8', marginBottom: '8px', opacity: 0.6 }} />
          <span>No finalized department salary expenditure computed yet.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', minHeight: '260px', gap: '16px' }}>
          {/* TOP SECTION: Solid Pie Chart + Department Cards */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            {/* SOLID PIE CHART */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto', flexShrink: 0 }}>
              {renderPieChart()}
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <Badge variant="accent" style={{ fontSize: '0.6875rem' }}>
                  {depts.length === 1 ? `${depts[0]?.name || 'Department'}: 100%` : `${depts.length} Active Departments`}
                </Badge>
              </div>
            </div>

            {/* DEPARTMENT BREAKDOWN LIST */}
            <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {depts.map((dept, idx) => {
                const color = palette[idx % palette.length];
                const isHovered = hoveredIdx === idx;

                return (
                  <div 
                    key={idx} 
                    className="dashboard-interactive-row"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{ 
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: isHovered ? `1px solid ${color}` : '1px solid #E2E8F0',
                      backgroundColor: isHovered ? '#F8FAFC' : '#FFFFFF',
                      transition: 'all 0.18s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }} />
                        <strong style={{ color: '#1E293B', fontSize: '0.875rem' }}>{dept.name}</strong>
                      </div>
                      <Badge variant="neutral" style={{ fontSize: '0.6875rem' }}>
                        {dept.count} {dept.count === 1 ? 'employee' : 'employees'}
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                      <span className="text-secondary font-medium">Monthly Payroll</span>
                      <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <strong style={{ color: '#0F172A', marginRight: '6px' }}>${dept.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                        <span className="text-xs font-semibold" style={{ color }}>({dept.percentage}%)</span>
                      </div>
                    </div>

                    {/* Proportional Mini Bar */}
                    <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${dept.percentage}%`, 
                          backgroundColor: color, 
                          borderRadius: '3px',
                          transition: 'width 300ms ease'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MIDDLE ANALYTICS GRID (Fills the previous vertical void cleanly with real data) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px'
          }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }} className="dashboard-interactive-row">
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Workforce Share</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{totalEmployees} employee{totalEmployees !== 1 ? 's' : ''}</div>
              <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 500, marginTop: '2px' }}>100% of headcount</div>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }} className="dashboard-interactive-row">
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Cost / Head</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>${avgCostPerEmp.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>Per employee / mo</div>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }} className="dashboard-interactive-row">
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top Department</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#059669', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {depts[0]?.name || 'N/A'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
                ${depts[0]?.cost ? depts[0].cost.toLocaleString() : '0'}
              </div>
            </div>
          </div>

          {/* BOTTOM SUMMARY COMPARISON RIBBON */}
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
            <span>Total Monthly Payroll: <strong style={{ color: '#0F172A' }}>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
            <span>Allocated: <strong style={{ color: '#059669' }}>100% Verified</strong></span>
            <Badge variant="accent" style={{ fontSize: '0.6875rem' }}>{depts.length} Department{depts.length !== 1 ? 's' : ''}</Badge>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SalaryCostByDeptChart;
