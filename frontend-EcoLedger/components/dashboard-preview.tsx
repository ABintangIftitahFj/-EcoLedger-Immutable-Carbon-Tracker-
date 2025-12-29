"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Car, ShieldCheck, TrendingUp, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { apiClient, ActivityResponse } from "@/lib/api-client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface ChartData {
  name: string
  value: number
  date?: string
}

interface CategoryData {
  name: string
  value: number
  color: string
  percentage: number
}

export function DashboardPreview() {
  const [loading, setLoading] = useState(true)
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [totalEmission, setTotalEmission] = useState(0)
  const [topCategory, setTopCategory] = useState("Loading...")
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    loadGlobalData()
  }, [])

  const loadGlobalData = async () => {
    try {
      // Get ALL activities from ALL USERS (global data)
      const response = await apiClient.getActivities({
        // No user_id filter = get all users' data
        page: 1,
        page_size: 100,
      })

      const activities = response.activities
      setTotalRecords(response.total)

      // Count unique users
      const uniqueUsers = new Set(activities.map(a => a.user_id))
      setTotalUsers(uniqueUsers.size)

      // Calculate total emission (global)
      const total = activities.reduce((sum, activity) => sum + activity.emission, 0)
      setTotalEmission(total)

      // Process weekly data (last 7 days) - GLOBAL
      const weeklyDataMap = processWeeklyData(activities)
      setWeeklyData(weeklyDataMap)

      // Process category data - GLOBAL
      const categoryDataMap = processCategoryData(activities, total)
      setCategoryData(categoryDataMap)

      // Get top category
      if (categoryDataMap.length > 0) {
        setTopCategory(categoryDataMap[0].name)
      }

    } catch (error) {
      console.error("Error loading global data:", error)
      // Set empty data on error
      setWeeklyData([
        { name: "Mon", value: 0 },
        { name: "Tue", value: 0 },
        { name: "Wed", value: 0 },
        { name: "Thu", value: 0 },
        { name: "Fri", value: 0 },
        { name: "Sat", value: 0 },
        { name: "Sun", value: 0 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const processWeeklyData = (activities: ActivityResponse[]): ChartData[] => {
    const now = new Date()
    const last7Days: ChartData[] = []
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayName = dayNames[date.getDay()]
      
      last7Days.push({
        name: dayName,
        value: 0,
        date: date.toISOString().split('T')[0]
      })
    }

    // Sum emissions by day (from ALL users)
    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp).toISOString().split('T')[0]
      const dayIndex = last7Days.findIndex(d => d.date === activityDate)
      
      if (dayIndex !== -1) {
        last7Days[dayIndex].value += activity.emission
      }
    })

    return last7Days.map(d => ({
      name: d.name,
      value: parseFloat(d.value.toFixed(2))
    }))
  }

  const processCategoryData = (activities: ActivityResponse[], total: number): CategoryData[] => {
    const categoryMap = new Map<string, number>()

    activities.forEach(activity => {
      const category = getCategoryName(activity.activity_type)
      const current = categoryMap.get(category) || 0
      categoryMap.set(category, current + activity.emission)
    })

    const colors = [
      "oklch(0.7 0.15 150)", // green
      "oklch(0.6 0.1 200)",  // blue
      "oklch(0.5 0.1 250)",  // purple
      "oklch(0.7 0.1 50)",   // yellow
      "oklch(0.6 0.15 350)", // red
    ]

    const categoryArray = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value: parseFloat(value.toFixed(2)),
        color: colors[index % colors.length],
        percentage: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.value - a.value)

    return categoryArray
  }

  const getCategoryName = (activityType: string): string => {
    if (activityType.includes("car") || activityType.includes("motorbike") || 
        activityType.includes("bus") || activityType.includes("train") || 
        activityType.includes("flight")) {
      return "Transportasi"
    }
    if (activityType.includes("electricity") || activityType.includes("gas")) {
      return "Energi"
    }
    return "Lainnya"
  }

  return (
    <section id="dashboard" className="py-24 bg-muted/30 border-b">
      <div className="container mx-auto px-4">
        <div className="mb-12 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Statistik Global Platform</h2>
          <p className="text-muted-foreground max-w-2xl">
            Data agregat dari seluruh pengguna EcoLedger. Bergabunglah dengan komunitas yang peduli lingkungan!
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <Card className="bg-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Emisi Terlacak</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalEmission.toFixed(2)} kg</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dari {totalRecords} aktivitas global
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pengguna Aktif</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}+</div>
                  <p className="text-xs text-muted-foreground mt-1">Bergabung dengan EcoLedger</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Kategori Terpopuler</CardTitle>
                  <Car className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{topCategory}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {categoryData.length > 0 ? `${categoryData[0].percentage}% dari total emisi` : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Harian</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {weeklyData.length > 0 
                      ? (weeklyData.reduce((sum, d) => sum + d.value, 0) / 7).toFixed(2)
                      : "0.00"} kg
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Emisi global per hari</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Tren Emisi Global (7 Hari Terakhir)</CardTitle>
                  <p className="text-sm text-muted-foreground">Aktivitas dari semua pengguna platform</p>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" vertical={false} />
                      <XAxis dataKey="name" stroke="oklch(0.5 0 0)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="oklch(0.5 0 0)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}kg`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.12 0 0)",
                          border: "1px solid oklch(0.25 0 0)",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ color: "oklch(0.7 0.15 150)" }}
                        formatter={(value: number) => [`${value.toFixed(2)} kg CO2e`, "Emisi Global"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="oklch(0.7 0.15 150)"
                        strokeWidth={2}
                        dot={{ fill: "oklch(0.7 0.15 150)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Distribusi Kategori Emisi</CardTitle>
                  <p className="text-sm text-muted-foreground">Dari seluruh aktivitas pengguna</p>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  {categoryData.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      <p>Belum ada data</p>
                      <p className="text-sm mt-2">Jadilah yang pertama mencatat aktivitas!</p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="60%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "oklch(0.12 0 0)",
                              border: "1px solid oklch(0.25 0 0)",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value.toFixed(2)} kg CO2e`, ""]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 ml-4">
                        {categoryData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2 text-sm">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-muted-foreground">{item.name}</span>
                            <span className="font-medium ml-auto">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
