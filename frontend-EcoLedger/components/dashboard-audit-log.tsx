import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface LogItem {
  user: string;
  action: string;
  time: string | Date;
  status: string;
}

export function DashboardAuditLog({ logs }: { logs: LogItem[] }) {
  console.log('📋 DashboardAuditLog rendering with:', logs);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log ({logs?.length || 0} aktivitas)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Aktivitas tercatat di Blockchain/Database Log.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Aktivitas</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!logs || logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                  <div>
                    <p className="font-medium">Belum ada log tersedia</p>
                    <p className="text-sm mt-1">Log aktivitas akan muncul di sini</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{log.user || 'Unknown'}</TableCell>
                  <TableCell>{log.action || 'N/A'}</TableCell>
                  <TableCell>
                    {log.time ? new Date(log.time).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    }) : "Baru saja"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={log.status === 'Success' ? 'default' : 'destructive'}>
                      {log.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}