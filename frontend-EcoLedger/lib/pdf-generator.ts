import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ActivityResponse } from './api-client'

interface ExportPDFOptions {
  activities: ActivityResponse[]
  totalEmission: number
  userId: string
  dateRange?: string
}

export const generateActivityPDF = (options: ExportPDFOptions) => {
  const { activities, totalEmission, userId, dateRange } = options
  
  // Create new PDF document
  const doc = new jsPDF()
  
  // Set document properties
  doc.setProperties({
    title: 'EcoLedger - Laporan Emisi Karbon',
    subject: 'Laporan Aktivitas Emisi Karbon',
    author: 'EcoLedger',
    keywords: 'carbon, emission, report',
    creator: 'EcoLedger Application'
  })

  // Professional Color Palette
  const colors = {
    primary: [16, 185, 129] as [number, number, number],
    secondary: [31, 41, 55] as [number, number, number],
    accent: [59, 130, 246] as [number, number, number],
    success: [34, 197, 94] as [number, number, number],
    lightGray: [249, 250, 251] as [number, number, number],
    mediumGray: [156, 163, 175] as [number, number, number],
    darkGray: [75, 85, 99] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    borderGray: [229, 231, 235] as [number, number, number]
  }

  let yPos = 20

  // ============================================
  // HEADER WITH LOGO & BRANDING
  // ============================================
  
  // Header background bar
  doc.setFillColor(...colors.primary)
  doc.rect(0, 0, 210, 35, 'F')
  
  // Logo circle (visual brand mark)
  doc.setFillColor(...colors.white)
  doc.circle(20, 17, 8, 'F')
  doc.setFillColor(...colors.primary)
  doc.circle(20, 17, 6, 'F')
  
  // Company name
  doc.setTextColor(...colors.white)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('EcoLedger', 32, 15)
  
  // Tagline
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Immutable Carbon Tracker', 32, 21)
  
  // Date badge (lebih rapi)
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  doc.setFillColor(...colors.white)
  doc.roundedRect(122, 10, 78, 15, 2, 2, 'F')
  doc.setTextColor(...colors.secondary)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Digenerate:', 126, 15)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(currentDate, 126, 20)
  
  yPos = 48

  // ============================================
  // TITLE SECTION (lebih clean)
  // ============================================
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...colors.secondary)
  doc.text('Laporan Emisi Karbon', 20, yPos)
  
  // Decorative line under title (lebih tebal)
  doc.setDrawColor(...colors.primary)
  doc.setLineWidth(1.5)
  doc.line(20, yPos + 3, 82, yPos + 3)
  
  yPos += 14

  // ============================================
  // METADATA SECTION (lebih rapi dengan box)
  // ============================================
  
  // Box untuk metadata
  doc.setDrawColor(...colors.borderGray)
  doc.setLineWidth(0.5)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(20, yPos, 170, 28, 2, 2, 'FD')
  
  yPos += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...colors.darkGray)
  
  // User ID
  doc.setFont('helvetica', 'bold')
  doc.text('User ID:', 26, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(userId, 52, yPos)
  
  // Period (di sebelah kanan)
  if (dateRange) {
    doc.setFont('helvetica', 'bold')
    doc.text('Periode:', 105, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(dateRange, 128, yPos)
  }
  yPos += 6
  
  // Total activities
  doc.setFont('helvetica', 'bold')
  doc.text('Total Aktivitas:', 26, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(`${activities.length} catatan`, 52, yPos)
  
  // Total emission (di sebelah kanan, lebih prominent)
  doc.setFont('helvetica', 'bold')
  doc.text('Total Emisi:', 105, yPos)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.primary)
  doc.setFontSize(11)
  doc.text(`${totalEmission.toFixed(2)} kg CO2e`, 128, yPos)
  
  yPos += 16

  // ============================================
  // SUMMARY STATISTICS BOX (lebih rapi)
  // ============================================
  
  // Box background dengan border yang lebih tegas
  doc.setFillColor(...colors.lightGray)
  doc.setDrawColor(...colors.borderGray)
  doc.setLineWidth(0.5)
  doc.roundedRect(20, yPos, 170, 30, 3, 3, 'FD')
  
  // Calculate statistics
  const avgEmission = activities.length > 0 
    ? (totalEmission / activities.length).toFixed(2) 
    : '0.00'
  
  const categoryCount = new Set(
    activities.map(a => getCategoryName(a.activity_type))
  ).size

  const statsY = yPos + 11
  
  // Stat 1: Total (lebih centered)
  doc.setFontSize(9)
  doc.setTextColor(...colors.mediumGray)
  doc.setFont('helvetica', 'normal')
  doc.text('Total Emisi', 40, statsY, { align: 'center' })
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.primary)
  doc.text(`${totalEmission.toFixed(2)} kg`, 40, statsY + 8, { align: 'center' })
  
  // Stat 2: Average
  doc.setFontSize(9)
  doc.setTextColor(...colors.mediumGray)
  doc.setFont('helvetica', 'normal')
  doc.text('Rata-rata per Aktivitas', 105, statsY, { align: 'center' })
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.accent)
  doc.text(`${avgEmission} kg`, 105, statsY + 8, { align: 'center' })
  
  // Stat 3: Categories
  doc.setFontSize(9)
  doc.setTextColor(...colors.mediumGray)
  doc.setFont('helvetica', 'normal')
  doc.text('Jumlah Kategori', 165, statsY, { align: 'center' })
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.darkGray)
  doc.text(`${categoryCount}`, 165, statsY + 8, { align: 'center' })
  
  yPos += 38

  // ============================================
  // TABLE HEADER
  // ============================================
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.secondary)
  doc.text('Rincian Aktivitas', 20, yPos)
  
  yPos += 8

  // ============================================
  // ACTIVITY TABLE (SHORTENED HASH untuk readability)
  // ============================================
  
  // Prepare table data dengan SHORTENED HASH
  const tableData = activities.map((activity, index) => {
    const date = new Date(activity.timestamp).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
    
    const category = getCategoryName(activity.activity_type)
    const details = getActivityDetails(activity)
    const emission = `${activity.emission.toFixed(2)} kg`
    
    // SHORTENED HASH untuk tabel (16 karakter pertama)
    const shortHash = activity.current_hash.substring(0, 16) + '...'
    
    return [
      index + 1,
      date,
      category,
      activity.activity_type,
      details,
      emission,
      shortHash
    ]
  })

  // Generate professional table dengan layout yang lebih rapi
  autoTable(doc, {
    startY: yPos,
    head: [[
      'No',
      'Tanggal',
      'Kategori',
      'Tipe',
      'Detail',
      'Emisi',
      'Hash ID'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      overflow: 'linebreak',
      font: 'helvetica',
      lineColor: colors.borderGray,
      lineWidth: 0.3,
      halign: 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.white,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { 
        cellWidth: 10, 
        halign: 'center', 
        fontStyle: 'bold',
        fillColor: colors.lightGray
      },
      1: { 
        cellWidth: 24, 
        halign: 'left',
        fontSize: 9
      },
      2: { 
        cellWidth: 26, 
        halign: 'left',
        fontStyle: 'bold',
        fontSize: 9
      },
      3: { 
        cellWidth: 30, 
        halign: 'left', 
        fontSize: 8,
        textColor: colors.darkGray
      },
      4: { 
        cellWidth: 24, 
        halign: 'left',
        fontSize: 9
      },
      5: { 
        cellWidth: 22, 
        halign: 'right', 
        fontStyle: 'bold', 
        textColor: colors.primary,
        fontSize: 10
      },
      6: { 
        cellWidth: 34, 
        halign: 'left', 
        fontSize: 7.5,
        fontStyle: 'italic',
        textColor: colors.mediumGray
      }
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253]
    },
    margin: { left: 20, right: 20 }
  })

  // ============================================
  // APPENDIX: FULL HASH VERIFICATION LIST
  // ============================================
  
  // Add new page for full hash list
  doc.addPage()
  yPos = 25
  
  // Appendix header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.secondary)
  doc.text('Lampiran: Daftar Hash Lengkap', 20, yPos)
  
  doc.setDrawColor(...colors.primary)
  doc.setLineWidth(1)
  doc.line(20, yPos + 3, 88, yPos + 3)
  
  yPos += 8
  
  // Info box
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...colors.darkGray)
  doc.setFillColor(...colors.lightGray)
  doc.roundedRect(20, yPos, 170, 12, 2, 2, 'F')
  doc.text('Daftar hash SHA-256 lengkap untuk verifikasi integritas data:', 25, yPos + 5)
  doc.text('Setiap hash dapat digunakan untuk memverifikasi keaslian aktivitas di blockchain.', 25, yPos + 9)
  
  yPos += 18

  // Full hash table
  const hashTableData = activities.map((activity, index) => {
    const date = new Date(activity.timestamp).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return [
      index + 1,
      date,
      activity.activity_type,
      activity.current_hash  // FULL HASH di sini!
    ]
  })

  autoTable(doc, {
    startY: yPos,
    head: [[
      'No',
      'Timestamp',
      'Tipe Aktivitas',
      'Hash SHA-256 (64 karakter)'
    ]],
    body: hashTableData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      overflow: 'linebreak',
      font: 'courier',  // Monospace font untuk hash
      lineColor: colors.borderGray,
      lineWidth: 0.3,
      halign: 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: colors.secondary,
      textColor: colors.white,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica'
    },
    columnStyles: {
      0: { 
        cellWidth: 10, 
        halign: 'center',
        fillColor: colors.lightGray,
        font: 'helvetica'
      },
      1: { 
        cellWidth: 28,
        fontSize: 7,
        font: 'helvetica'
      },
      2: { 
        cellWidth: 32,
        fontSize: 7,
        font: 'helvetica'
      },
      3: { 
        cellWidth: 100,
        fontSize: 6.5,
        textColor: colors.darkGray,
        font: 'courier'  // Monospace untuk hash
      }
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253]
    },
    margin: { left: 20, right: 20 }
  })

  // ============================================
  // FOOTER ON EVERY PAGE (lebih professional)
  // ============================================
  
  const pageCount = doc.getNumberOfPages()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Footer background
    doc.setFillColor(...colors.lightGray)
    doc.rect(0, 280, 210, 17, 'F')
    
    // Footer line (lebih subtle)
    doc.setDrawColor(...colors.borderGray)
    doc.setLineWidth(0.3)
    doc.line(20, 282, 190, 282)
    
    // Footer content (lebih rapi)
    doc.setFontSize(8)
    doc.setTextColor(...colors.darkGray)
    doc.setFont('helvetica', 'bold')
    
    // Left: Branding
    doc.text('EcoLedger', 20, 287)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colors.mediumGray)
    doc.text('Sistem pelacak emisi karbon dengan integritas blockchain-like', 20, 291)
    
    // Center: Verification badge
    doc.setFontSize(7)
    doc.setTextColor(...colors.success)
    doc.setFont('helvetica', 'bold')
    doc.text('✓ Dokumen terverifikasi dengan hash chain', 105, 289, { align: 'center' })
    
    // Right: Page number (lebih prominent)
    doc.setFontSize(9)
    doc.setTextColor(...colors.darkGray)
    doc.setFont('helvetica', 'normal')
    doc.text(`Halaman ${i} dari ${pageCount}`, 190, 289, { align: 'right' })
  }

  // ============================================
  // SAVE PDF
  // ============================================
  
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `EcoLedger_Laporan_${userId}_${timestamp}.pdf`
  doc.save(filename)
  
  return filename
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getCategoryName = (activityType: string): string => {
  if (activityType.includes('car') || activityType.includes('motorbike') || 
      activityType.includes('bus') || activityType.includes('train') || 
      activityType.includes('taxi')) {
    return 'Transportasi'
  }
  if (activityType.includes('electricity') || activityType.includes('gas')) {
    return 'Energi'
  }
  return 'Lainnya'
}

const getActivityDetails = (activity: ActivityResponse): string => {
  if (activity.distance_km) return `${activity.distance_km} km`
  if (activity.energy_kwh) return `${activity.energy_kwh} kWh`
  if (activity.weight_kg) return `${activity.weight_kg} kg`
  if (activity.money_spent) return `$${activity.money_spent}`
  return '-'
}
