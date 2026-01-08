import { CircularProgress } from "@/components/production/CircularProgress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

const revenueData = [
  { quarter: "Q1", closed: 34800, forecasted: 45000 },
  { quarter: "Q2", closed: 0, forecasted: 52000 },
  { quarter: "Q3", closed: 0, forecasted: 48000 },
  { quarter: "Q4", closed: 0, forecasted: 35000 },
];

const sourceData = [
  { name: "Referral", value: 35, color: "hsl(156, 100%, 50%)" },
  { name: "Past Client", value: 25, color: "hsl(175, 100%, 37%)" },
  { name: "SOI", value: 20, color: "hsl(210, 15%, 40%)" },
  { name: "Open House", value: 12, color: "hsl(220, 12%, 25%)" },
  { name: "Expired", value: 8, color: "hsl(200, 15%, 35%)" },
];

const funnelData = [
  { stage: "Leads", value: 48, width: 100 },
  { stage: "Contacted", value: 32, width: 75 },
  { stage: "Appointments", value: 12, width: 50 },
  { stage: "Clients", value: 4, width: 30 },
  { stage: "Closed", value: 3, width: 20 },
];

export default function ProductionDashboard() {
  const isMobile = useIsMobile();

  return (
    <div className="animate-fade-in space-y-8 md:space-y-12">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Production</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Progress toward goals.
        </p>
      </div>

      {/* Section 1: Goal Alignment */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 md:mb-6">
          Goal Alignment
        </h2>
        {isMobile ? (
          /* Mobile: Stacked compact cards */
          <div className="space-y-3">
            <CircularProgress 
              label="Appointments" 
              current={5} 
              target={8}
              compact
            />
            <CircularProgress 
              label="Clients Signed" 
              current={4} 
              target={6}
              compact
            />
            <CircularProgress 
              label="Closed Units" 
              current={2} 
              target={5}
              compact
            />
            <CircularProgress 
              label="GCI" 
              current="$12K" 
              target={23000}
              subtitle="28% to goal"
              compact
            />
          </div>
        ) : (
          /* Desktop: Grid layout */
          <div className="grid grid-cols-4 gap-8 p-6 rounded-xl bg-card border border-border">
            <CircularProgress 
              label="Appointments" 
              current={5} 
              target={8}
            />
            <CircularProgress 
              label="Clients Signed" 
              current={4} 
              target={6}
            />
            <CircularProgress 
              label="Closed Units" 
              current={2} 
              target={5}
            />
            <CircularProgress 
              label="GCI" 
              current="$12K" 
              target={23000}
              subtitle="28% to goal"
            />
          </div>
        )}
      </section>

      {/* Section 2: Revenue Reality */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 md:mb-6">
          Revenue Reality
        </h2>
        <div className="p-4 md:p-6 rounded-xl bg-card border border-border">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span className="text-xs md:text-sm text-muted-foreground">Closed GCI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary/30" />
              <span className="text-xs md:text-sm text-muted-foreground">Forecasted GCI</span>
            </div>
          </div>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} barGap={isMobile ? 2 : 4}>
                <XAxis 
                  dataKey="quarter" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(215, 12%, 50%)', fontSize: isMobile ? 11 : 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(215, 12%, 50%)', fontSize: isMobile ? 10 : 12 }}
                  tickFormatter={(value) => `$${value / 1000}K`}
                  width={isMobile ? 45 : 60}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(156, 50%, 12%)', 
                    backdropFilter: 'blur(8px)',
                    border: '1px solid hsl(156, 60%, 25%)',
                    borderRadius: '8px',
                    fontSize: isMobile ? '12px' : '14px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                  }}
                  labelStyle={{ color: 'hsl(0, 0%, 100%)', fontWeight: 600 }}
                  itemStyle={{ color: 'hsl(156, 100%, 70%)', fontWeight: 500 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  cursor={{ fill: 'hsla(156, 50%, 20%, 0.4)' }}
                />
                <Bar dataKey="forecasted" fill="hsl(156, 100%, 50%, 0.2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="closed" fill="hsl(156, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Section 3: Business Health */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 md:mb-6">
          Business Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Source Breakdown */}
          <div className="p-4 md:p-6 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-medium text-foreground mb-4 md:mb-6">Business Source Breakdown</h3>
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center gap-6 md:gap-8`}>
              <div className={`${isMobile ? 'w-28 h-28' : 'w-32 h-32'} flex-shrink-0`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 28 : 35}
                      outerRadius={isMobile ? 45 : 55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={`space-y-2 ${isMobile ? 'w-full' : ''}`}>
                {sourceData.map((source) => (
                  <div key={source.name} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm text-muted-foreground">{source.name}</span>
                    <span className="text-sm font-medium text-foreground ml-auto">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="p-4 md:p-6 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-medium text-foreground mb-4 md:mb-6">Conversion Funnel</h3>
            <div className="flex flex-col items-center gap-1">
              {funnelData.map((stage, index) => {
                const totalStages = funnelData.length;
                // More gradual width reduction to prevent text clipping
                const widthPercent = 100 - (index * 12);
                const isFirst = index === 0;
                const isLast = index === totalStages - 1;
                
                // Gradient from matrix green to tiffany blue based on position
                const gradientColors = [
                  'from-[hsl(156,100%,50%)] to-[hsl(156,80%,40%)]', // Matrix green
                  'from-[hsl(160,90%,45%)] to-[hsl(165,85%,38%)]',
                  'from-[hsl(168,85%,40%)] to-[hsl(172,80%,35%)]',
                  'from-[hsl(172,80%,38%)] to-[hsl(175,75%,32%)]',
                  'from-[hsl(175,100%,37%)] to-[hsl(175,90%,30%)]', // Tiffany blue
                ];
                
                return (
                  <div 
                    key={stage.stage}
                    className="relative flex items-center justify-center animate-fade-in"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      width: `${widthPercent}%`,
                      minWidth: '120px',
                    }}
                  >
                    {/* Funnel segment with trapezoid shape */}
                    <div 
                      className={`
                        relative w-full py-3 md:py-4 flex flex-col items-center justify-center
                        bg-gradient-to-b ${gradientColors[index]}
                        ${isFirst ? 'rounded-t-lg' : ''}
                        ${isLast ? 'rounded-b-lg' : ''}
                        transition-all duration-300 hover:brightness-110
                        shadow-[0_2px_10px_rgba(0,255,170,0.15)]
                      `}
                      style={{
                        clipPath: isLast 
                          ? 'none'
                          : `polygon(0% 0%, 100% 0%, ${96 - index * 1.5}% 100%, ${4 + index * 1.5}% 100%)`,
                        borderRadius: isLast ? '6px' : undefined,
                        width: isLast ? '85%' : '100%',
                        margin: isLast ? '0 auto' : undefined,
                      }}
                    >
                      <span className="text-base md:text-lg font-bold text-black drop-shadow-sm">
                        {stage.value}
                      </span>
                      <span className="text-[10px] md:text-xs text-black/70 font-medium">
                        {stage.stage}
                        {index > 0 && ` (${Math.round((stage.value / funnelData[0].value) * 100)}%)`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
