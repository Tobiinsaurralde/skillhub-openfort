
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface TopService {
    _id: string;
    title: string;
    imageUrl: string;
    price: number;
}

interface TopSeller {
    walletAddress: string;
    name: string;
    imageUrl: string;
    totalEarnings: number;
    totalSales: number;
    topService: TopService | null;
}

const TopSellers = () => {
    const [sellers, setSellers] = useState<TopSeller[]>([]);
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

    useEffect(() => {
        const fetchTopSellers = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/profile/top`);
                const data = await res.json();
                if (data.sellers) {
                    setSellers(data.sellers);
                }
            } catch (error) {
                console.error("Error fetching top sellers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopSellers();
    }, [API_BASE_URL]);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Top Sellers</h1>
                    <p className="text-muted-foreground">Detailed insights into our most successful sellers.</p>
                </div>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-64 animate-pulse rounded-xl bg-muted" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {sellers.map((seller, index) => (
                            <Card key={seller.walletAddress} className="relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
                                {index < 3 && (
                                    <div className={`absolute top-0 right-0 p-3 bg-gradient-to-bl ${index === 0 ? "from-yellow-400 to-amber-200" : index === 1 ? "from-gray-300 to-slate-200" : "from-orange-400 to-amber-600"} text-white rounded-bl-xl shadow-md z-10`}>
                                        <Trophy className="h-6 w-6" />
                                    </div>
                                )}

                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className="relative">
                                        <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                                            <AvatarImage src={seller.imageUrl} alt={seller.name} className="object-cover" />
                                            <AvatarFallback>{seller.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <Badge className="absolute -bottom-2 -right-2 px-2 py-0.5 min-w-[1.5rem] justify-center text-xs">
                                            #{index + 1}
                                        </Badge>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg truncate">{seller.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground truncate">{seller.walletAddress ? `${seller.walletAddress.slice(0, 6)}...${seller.walletAddress.slice(-4)}` : ""}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-3">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                                                <DollarSign className="h-3 w-3" /> Earnings
                                            </div>
                                            <p className="font-bold text-lg">${seller.totalEarnings.toLocaleString()}</p>
                                        </div>
                                        <div className="text-center border-l border-background">
                                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                                                <TrendingUp className="h-3 w-3" /> Sales
                                            </div>
                                            <p className="font-bold text-lg">{seller.totalSales}</p>
                                        </div>
                                    </div>

                                    {seller.topService && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">Most Popular Service</p>
                                            <Link to={`/service/${seller.topService._id}`} className="flex items-center gap-3 rounded-md border p-2 hover:bg-accent transition-colors group">
                                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-secondary">
                                                    <img src={seller.topService.imageUrl} className="h-full w-full object-cover" alt="" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium leading-tight truncate group-hover:text-primary transition-colors">{seller.topService.title}</p>
                                                    <p className="text-xs text-muted-foreground font-bold mt-0.5">${seller.topService.price}</p>
                                                </div>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopSellers;
