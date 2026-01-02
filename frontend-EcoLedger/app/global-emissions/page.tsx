"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, TrendingUp, Factory, MapPin, Loader2, RefreshCw, Building2, Flame } from "lucide-react"
import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"

interface CountryRanking {
    rank: number
    country: string
    name: string
    emissionsQuantity: number
    percentage: number
    emissionsPerCapita?: number
}

interface EmissionSource {
    id: number
    name: string
    country: string
    sector: string
    subsector: string
    emissionsQuantity: number
    assetType?: string
}

export default function GlobalEmissionsPage() {
    const [countryRankings, setCountryRankings] = useState<CountryRanking[]>([])
    const [topSources, setTopSources] = useState<EmissionSource[]>([])
    const [indonesiaSources, setIndonesiaSources] = useState<EmissionSource[]>([])
    const [sectors, setSectors] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("countries")
    const [selectedSector, setSelectedSector] = useState<string>("all")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            // Fetch country rankings
            const rankingsRes = await fetch(`${baseUrl}/api/climate-trace/rankings/countries`)
            if (rankingsRes.ok) {
                const data = await rankingsRes.json()
                setCountryRankings(data.rankings || [])
            }

            // Fetch sectors
            const sectorsRes = await fetch(`${baseUrl}/api/climate-trace/sectors`)
            if (sectorsRes.ok) {
                const data = await sectorsRes.json()
                setSectors(data.sectors || [])
            }

            // Fetch top sources
            const sourcesRes = await fetch(`${baseUrl}/api/climate-trace/sources?limit=20`)
            if (sourcesRes.ok) {
                const data = await sourcesRes.json()
                setTopSources(data.sources || [])
            }

            // Fetch Indonesia sources
            const idnRes = await fetch(`${baseUrl}/api/climate-trace/indonesia?limit=20`)
            if (idnRes.ok) {
                const data = await idnRes.json()
                setIndonesiaSources(data.top_sources || [])
            }
        } catch (error) {
            console.error("Failed to load Climate TRACE data:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadSourcesBySector = async (sector: string) => {
        setSelectedSector(sector)
        if (sector === "all") {
            loadData()
            return
        }

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const res = await fetch(`${baseUrl}/api/climate-trace/sources?sector=${sector}&limit=20`)
            if (res.ok) {
                const data = await res.json()
                setTopSources(data.sources || [])
            }
        } catch (error) {
            console.error("Failed to load sources by sector:", error)
        }
    }

    const formatEmission = (value: number) => {
        if (!value) return "N/A"
        if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B tonnes`
        if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M tonnes`
        if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K tonnes`
        return `${value.toFixed(2)} tonnes`
    }

    const getCountryFlag = (code: string) => {
        // Convert ISO3 to ISO2 for flag emoji (simplified)
        const flagMap: { [key: string]: string } = {
            "CHN": "🇨🇳", "USA": "🇺🇸", "IND": "🇮🇳", "RUS": "🇷🇺", "JPN": "🇯🇵",
            "IDN": "🇮🇩", "BRA": "🇧🇷", "DEU": "🇩🇪", "GBR": "🇬🇧", "FRA": "🇫🇷",
            "KOR": "🇰🇷", "CAN": "🇨🇦", "AUS": "🇦🇺", "MEX": "🇲🇽", "SAU": "🇸🇦",
            "TUR": "🇹🇷", "POL": "🇵🇱", "THA": "🇹🇭", "ZAF": "🇿🇦", "MYS": "🇲🇾"
        }
        return flagMap[code] || "🌍"
    }

    const getSectorIcon = (sector: string) => {
        const icons: { [key: string]: string } = {
            "power": "⚡", "oil-and-gas": "🛢️", "transportation": "🚗",
            "manufacturing": "🏭", "buildings": "🏢", "agriculture": "🌾",
            "waste": "🗑️", "mineral-extraction": "⛏️", "forestry-and-land-use": "🌲"
        }
        return icons[sector] || "🏭"
    }

    return (
        <div className="flex min-h-screen flex-col overflow-hidden bg-background">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Globe className="h-10 w-10 text-blue-500" />
                                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                                    Global Emissions
                                </h1>
                            </div>
                            <p className="text-muted-foreground text-lg">
                                Data emisi global real-time dari Climate TRACE
                            </p>
                        </div>
                        <Button variant="outline" onClick={loadData} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Countries Tracked</p>
                                        <p className="text-3xl font-bold text-blue-500">{countryRankings.length}+</p>
                                    </div>
                                    <Globe className="h-8 w-8 text-blue-500/50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Emission Sources</p>
                                        <p className="text-3xl font-bold text-orange-500">500K+</p>
                                    </div>
                                    <Factory className="h-8 w-8 text-orange-500/50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Sectors</p>
                                        <p className="text-3xl font-bold text-red-500">{sectors.length}</p>
                                    </div>
                                    <Building2 className="h-8 w-8 text-red-500/50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Data Source</p>
                                        <p className="text-lg font-bold text-green-500">Climate TRACE</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-green-500/50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="countries" className="gap-2">
                                <Globe className="h-4 w-4" />
                                Country Rankings
                            </TabsTrigger>
                            <TabsTrigger value="sources" className="gap-2">
                                <Factory className="h-4 w-4" />
                                Top Polluters
                            </TabsTrigger>
                            <TabsTrigger value="indonesia" className="gap-2">
                                🇮🇩
                                Indonesia
                            </TabsTrigger>
                        </TabsList>

                        {/* Country Rankings Tab */}
                        <TabsContent value="countries">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-blue-500" />
                                        Country Emissions Ranking
                                    </CardTitle>
                                    <CardDescription>
                                        Ranking negara berdasarkan total emisi CO2e (100-year GWP)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-16">Rank</TableHead>
                                                    <TableHead>Country</TableHead>
                                                    <TableHead className="text-right">Emissions</TableHead>
                                                    <TableHead className="text-right">% Global</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {countryRankings.slice(0, 20).map((country) => (
                                                    <TableRow key={country.country} className="hover:bg-muted/50">
                                                        <TableCell>
                                                            <Badge variant={country.rank <= 3 ? "destructive" : "secondary"}>
                                                                #{country.rank}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            <span className="mr-2 text-xl">{getCountryFlag(country.country)}</span>
                                                            {country.name || country.country}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {formatEmission(country.emissionsQuantity)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge variant="outline">
                                                                {(country.percentage * 100).toFixed(2)}%
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Top Polluters Tab */}
                        <TabsContent value="sources">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Factory className="h-5 w-5 text-orange-500" />
                                                Top Emission Sources
                                            </CardTitle>
                                            <CardDescription>
                                                Fasilitas pencemar terbesar di dunia
                                            </CardDescription>
                                        </div>
                                        <Select value={selectedSector} onValueChange={loadSourcesBySector}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Filter by Sector" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sectors</SelectItem>
                                                {sectors.map((sector) => (
                                                    <SelectItem key={sector} value={sector}>
                                                        {getSectorIcon(sector)} {sector.replace(/-/g, ' ')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">#</TableHead>
                                                    <TableHead>Facility</TableHead>
                                                    <TableHead>Country</TableHead>
                                                    <TableHead>Sector</TableHead>
                                                    <TableHead className="text-right">Emissions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {topSources.map((source, idx) => (
                                                    <TableRow key={source.id} className="hover:bg-muted/50">
                                                        <TableCell className="font-mono text-muted-foreground">
                                                            {idx + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Flame className="h-4 w-4 text-orange-500" />
                                                                <span className="font-medium">{source.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="mr-1">{getCountryFlag(source.country)}</span>
                                                            {source.country}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="gap-1">
                                                                {getSectorIcon(source.sector)}
                                                                {source.sector?.replace(/-/g, ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {formatEmission(source.emissionsQuantity)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Indonesia Tab */}
                        <TabsContent value="indonesia">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span className="text-2xl">🇮🇩</span>
                                        Indonesia Emissions
                                    </CardTitle>
                                    <CardDescription>
                                        Sumber emisi terbesar di Indonesia
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : indonesiaSources.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>Data Indonesia sedang dimuat...</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">#</TableHead>
                                                    <TableHead>Facility</TableHead>
                                                    <TableHead>Sector</TableHead>
                                                    <TableHead>Subsector</TableHead>
                                                    <TableHead className="text-right">Emissions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {indonesiaSources.map((source, idx) => (
                                                    <TableRow key={source.id} className="hover:bg-muted/50">
                                                        <TableCell className="font-mono text-muted-foreground">
                                                            {idx + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Factory className="h-4 w-4 text-red-500" />
                                                                <span className="font-medium">{source.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {getSectorIcon(source.sector)} {source.sector?.replace(/-/g, ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {source.subsector?.replace(/-/g, ' ')}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {formatEmission(source.emissionsQuantity)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Attribution */}
                    <div className="text-center text-sm text-muted-foreground py-4">
                        Data provided by <a href="https://climatetrace.org" target="_blank" rel="noopener" className="text-blue-500 hover:underline">Climate TRACE</a>
                    </div>
                </div>
            </main>
        </div>
    )
}
