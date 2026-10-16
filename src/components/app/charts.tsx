import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--info)", "var(--success)", "var(--muted-foreground)"];
export const PRIO_COLORS: Record<string, string> = { Critical: "var(--critical)", High: "var(--warning)", Medium: "var(--info)", Low: "var(--success)" };

const tip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" },
  labelStyle: { color: "var(--muted-foreground)" },
  cursor: { fill: "var(--muted)", opacity: 0.5 },
};
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };

export function TrendChart({ data, height = 240 }: { data: { day: string; reported: number; resolved: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="gRep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" {...axis} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tip} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="reported" name="Reported" stroke="var(--chart-1)" fill="url(#gRep)" strokeWidth={2} />
        <Area type="monotone" dataKey="resolved" name="Resolved" stroke="var(--chart-2)" fill="transparent" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HBar({ data, height = 240, color = "var(--chart-1)", onClick }: { data: { name: string; value: number }[]; height?: number; color?: string; onClick?: (name: string) => void }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" {...axis} allowDecimals={false} />
        <YAxis type="category" dataKey="name" {...axis} width={130} />
        <Tooltip {...tip} />
        <Bar dataKey="value" name="Incidents" fill={color} radius={[0, 4, 4, 0]} barSize={14} onClick={(d: { name?: string }) => d.name && onClick?.(d.name)} className={onClick ? "cursor-pointer" : ""} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBar({ data, keys, height = 240 }: { data: Record<string, string | number>[]; keys: { key: string; name: string; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" {...axis} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tip} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k) => <Bar key={k.key} dataKey={k.key} name={k.name} fill={k.color} radius={[3, 3, 0, 0]} stackId={keys.length > 2 ? "a" : undefined} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, colors, height = 220, onClick }: { data: { name: string; value: number }[]; colors?: Record<string, string>; height?: number; onClick?: (name: string) => void }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="var(--card)" onClick={(d: { name?: string }) => d.name && onClick?.(d.name)}>
          {data.map((d, i) => <Cell key={d.name} fill={colors?.[d.name] ?? CHART_COLORS[i % CHART_COLORS.length]} className={onClick ? "cursor-pointer" : ""} />)}
        </Pie>
        <Tooltip {...tip} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} layout="vertical" align="right" verticalAlign="middle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function LineSeries({ data, dataKey, name, height = 220, domain }: { data: Record<string, string | number>[]; dataKey: string; name: string; height?: number; domain?: [number, number] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" {...axis} />
        <YAxis {...axis} domain={domain} />
        <Tooltip {...tip} />
        <Line type="monotone" dataKey={dataKey} name={name} stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
