"use client"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Lightbulb } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export function EcoAssistant() {
    const [tips, setTips] = useState<string>("")
    const [loading, setLoading] = useState(false)

    const handleGenerateTips = async () => {
        setLoading(true)
        try {
            const response = await apiClient.getAiTips()
            setTips(response.tips)
        } catch (error) {
            console.error("AI Error:", error)
            setTips("Maaf, gagal menghubungi Eco-Assistant. Silakan coba lagi nanti.\nPastikan Anda sudah Login kembali.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-600/5 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <Sparkles className="h-5 w-5" />
                    ✨ Eco-Assistant AI (V2)
                </CardTitle>
                <CardDescription>
                    Dapatkan tips personal untuk mengurangi jejak karbon Anda.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!tips ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Lightbulb className="h-12 w-12 text-indigo-500/40 mb-4 animate-pulse" />
                        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                            AI akan menganalisis aktivitas terbaru Anda dan memberikan saran yang relevan.
                        </p>
                        <Button
                            onClick={handleGenerateTips}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sedang Menganalisis...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Minta Saran AI
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium">
                            {tips}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGenerateTips}
                            className="w-full mt-4 text-xs text-muted-foreground hover:text-indigo-500"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh Tips"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
