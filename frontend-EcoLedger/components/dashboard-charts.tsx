"use client"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface DashboardChartsProps {
  pieData?: { labels: string[], data: number[] };
  lineData?: { labels: string[], data: number[] };
}

export function DashboardCharts({ pieData, lineData }: DashboardChartsProps) {
  
  console.log('🎨 DashboardCharts rendering with:', { pieData, lineData });
  
  // Konfigurasi Line Chart
  const lineChartData = {
    labels: lineData?.labels || [],
    datasets: [
      {
        label: 'Emisi Harian (kgCO2)',
        data: lineData?.data || [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Konfigurasi Pie Chart
  const pieChartData = {
    labels: pieData?.labels || [],
    datasets: [
      {
        data: pieData?.data || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)', 
          'rgba(54, 162, 235, 0.8)', 
          'rgba(255, 206, 86, 0.8)', 
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
      },
    ],
  };

  const hasLineData = lineData?.labels && lineData.labels.length > 0;
  const hasPieData = pieData?.labels && pieData.labels.length > 0;

  console.log('🎨 Has data:', { hasLineData, hasPieData });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Tren Emisi Aktual</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {!hasLineData ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <p className="text-lg font-medium">Belum ada data aktivitas</p>
                <p className="text-sm mt-2">Mulai catat aktivitas untuk melihat tren emisi</p>
              </div>
            </div>
          ) : (
            <Line 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top' as const,
                  }
                }
              }} 
              data={lineChartData} 
            />
          )}
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Sumber Polusi</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {!hasPieData ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <p className="text-lg font-medium">Belum ada data</p>
                <p className="text-sm mt-2">Data akan muncul setelah mencatat aktivitas</p>
              </div>
            </div>
          ) : (
            <Pie 
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom' as const,
                  }
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}