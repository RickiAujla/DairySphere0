import React from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
}

// ==========================================
// 1. AREA & LINE GRAPH COMPONENT (GLOWING GRADIENTS)
// ==========================================
export interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  showArea?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  showArea = true,
}) => {
  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const valRange = maxVal - minVal;

  const width = 500;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Generate SVG coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - ((d.value - minVal) / valRange) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaD = showArea && points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid guidelines */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const y = paddingY + (chartHeight / 3) * idx;
          const gridVal = maxVal - (valRange / 3) * idx;
          return (
            <g key={`grid-${idx}`}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 font-mono text-[8px] font-bold"
              >
                {Math.round(gridVal)}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        {showArea && areaD && (
          <path d={areaD} fill="url(#chartGradient)" />
        )}

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          className="stroke-teal-600 dark:stroke-teal-500"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Target Dots */}
        {points.map((p, idx) => (
          <g key={`dot-${idx}`} className="group cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r={4}
              className="fill-white dark:fill-slate-900 stroke-teal-600 dark:stroke-teal-500"
              strokeWidth={2}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={8}
              className="fill-teal-600/10 opacity-0 group-hover:opacity-100 transition"
            />
            {/* Hover Tooltip inside SVG */}
            <g className="opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none">
              <rect
                x={p.x - 24}
                y={p.y - 25}
                width={48}
                height={16}
                rx={4}
                className="fill-slate-950/90"
              />
              <text
                x={p.x}
                y={p.y - 14}
                textAnchor="middle"
                className="fill-white font-mono text-[8px] font-extrabold"
              >
                {p.value}
              </text>
            </g>
          </g>
        ))}

        {/* X Axis Labels */}
        {points.map((p, idx) => (
          <text
            key={`lbl-${idx}`}
            x={p.x}
            y={height - paddingY + 12}
            textAnchor="middle"
            className="fill-slate-450 dark:fill-slate-550 font-bold uppercase text-[7.5px]"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ==========================================
// 2. REUSABLE COLUMN BAR CHART
// ==========================================
export interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
}) => {
  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);

  const width = 500;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const barCount = data.length;
  const barGap = 16;
  const totalGapsWidth = barGap * (barCount - 1);
  const barWidth = (chartWidth - totalGapsWidth) / barCount;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Horizontal grid lines */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const y = paddingY + (chartHeight / 3) * idx;
          const gridVal = maxVal - (maxVal / 3) * idx;
          return (
            <g key={`bargrid-${idx}`}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 font-mono text-[8px] font-bold"
              >
                {Math.round(gridVal)}
              </text>
            </g>
          );
        })}

        {/* Columns */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * chartHeight;
          const x = paddingX + i * (barWidth + barGap);
          const y = height - paddingY - barHeight;

          return (
            <g key={`bar-${i}`} className="group cursor-pointer">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                className="fill-teal-600 hover:fill-teal-700 dark:fill-teal-500 dark:hover:fill-teal-400 transition-all duration-150"
              />
              {/* Tooltip */}
              <g className="opacity-0 group-hover:opacity-100 transition pointer-events-none">
                <rect
                  x={x + barWidth / 2 - 20}
                  y={y - 22}
                  width={40}
                  height={15}
                  rx={4}
                  className="fill-slate-950/90"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 12}
                  textAnchor="middle"
                  className="fill-white font-mono text-[8px] font-extrabold"
                >
                  {d.value}
                </text>
              </g>

              {/* X Axis Label */}
              <text
                x={x + barWidth / 2}
                y={height - paddingY + 12}
                textAnchor="middle"
                className="fill-slate-450 dark:fill-slate-550 font-bold uppercase text-[7.5px]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ==========================================
// 3. PIE & DONUT METRIC CHARTS
// ==========================================
export interface PieChartProps {
  data: ChartDataPoint[];
  isDonut?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  isDonut = false,
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Custom visual palette colors
  const palette = ['#0d9488', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6'];

  let currentAngle = 0;

  const pieSlices = data.map((d, i) => {
    const sliceAngle = (d.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += sliceAngle;

    // Convert angles to polar coords
    const x1 = Math.cos((startAngle - 90) * (Math.PI / 180)) * 60 + 100;
    const y1 = Math.sin((startAngle - 90) * (Math.PI / 180)) * 60 + 100;

    const x2 = Math.cos((currentAngle - 90) * (Math.PI / 180)) * 60 + 100;
    const y2 = Math.sin((currentAngle - 90) * (Math.PI / 180)) * 60 + 100;

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const dPath = `M 100 100 L ${x1} ${y1} A 60 60 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      path: dPath,
      color: palette[i % palette.length],
      label: d.label,
      value: d.value,
      percentage: Math.round((d.value / total) * 100),
    };
  });

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 select-none">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
          {pieSlices.map((slice, idx) => (
            <path
              key={idx}
              d={slice.path}
              fill={slice.color}
              className="hover:opacity-90 transition cursor-pointer"
            />
          ))}
          {/* If donut chart, draw a center masking circle */}
          {isDonut && (
            <circle
              cx={100}
              cy={100}
              r={38}
              className="fill-white dark:fill-slate-900"
            />
          )}
        </svg>
      </div>

      <div className="flex-1 space-y-2 w-full">
        {pieSlices.map((slice, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-350">{slice.label}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
              <span className="text-gray-900 dark:text-slate-100">{slice.value}</span>
              <span className="text-gray-400">({slice.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
