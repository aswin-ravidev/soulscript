"use client"
import { Chart, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  { date: "Mar 1", mood: 3, anxiety: 2 },
  { date: "Mar 2", mood: 4, anxiety: 2 },
  { date: "Mar 3", mood: 3, anxiety: 3 },
  { date: "Mar 4", mood: 5, anxiety: 1 },
  { date: "Mar 5", mood: 4, anxiety: 2 },
  { date: "Mar 6", mood: 3, anxiety: 3 },
  { date: "Mar 7", mood: 2, anxiety: 4 },
  { date: "Mar 8", mood: 3, anxiety: 3 },
  { date: "Mar 9", mood: 4, anxiety: 2 },
  { date: "Mar 10", mood: 5, anxiety: 1 },
  { date: "Mar 11", mood: 4, anxiety: 2 },
  { date: "Mar 12", mood: 3, anxiety: 3 },
  { date: "Mar 13", mood: 4, anxiety: 2 },
  { date: "Mar 14", mood: 5, anxiety: 1 },
]

export function MoodChart() {
  return (
    <ChartContainer
      className="h-[300px]"
      data={data}
      tooltipContent={({ payload }) => {
        if (!payload?.length) return null
        const { date, mood, anxiety } = payload[0].payload
        return (
          <ChartTooltipContent>
            <p className="text-sm font-medium">{date}</p>
            <p className="text-sm text-muted-foreground">
              Mood: {mood}/5 • Anxiety: {anxiety}/5
            </p>
          </ChartTooltipContent>
        )
      }}
    >
      <Chart>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              domain={[0, 5]}
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="anxiety"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <ChartTooltip cursor={false} content={<></>} wrapperStyle={{ outline: "none" }} />
          </LineChart>
        </ResponsiveContainer>
      </Chart>
    </ChartContainer>
  )
}

