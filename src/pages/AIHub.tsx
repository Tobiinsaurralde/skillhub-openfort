
import { Button } from "@/components/ui/button";
import { Plus, Bot, Sparkles, Search, RefreshCw, Loader2, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { IServiceCard } from "@/types/service";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const AIHub = () => {
    const [agents, setAgents] = useState<IServiceCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/services?category=AI Agent`);
            const data = await res.json();
            if (data.services) {
                setAgents(data.services);
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, [API_BASE_URL]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch(`${API_BASE_URL}/api/services/sync-agents`, { method: "POST" });
            await fetchAgents();
        } catch (e) {
            console.error(e);
        } finally {
            setSyncing(false);
        }
    };

    const filteredAgents = agents.filter(agent =>
        agent.title.toLowerCase().includes(search.toLowerCase()) ||
        agent.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-slate-950 py-24 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2832&ixlib=rb-4.0.3')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

                <div className="container relative mx-auto px-4 text-center">
                    <Badge className="mb-4 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">
                        <Sparkles className="mr-2 h-3 w-3" />
                        AI Agent Marketplace
                    </Badge>
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                        Hire Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI Agents</span>
                    </h1>
                    <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400">
                        Access a decentralized network of specialized AI agents ready to perform complex tasks.
                        From code generation to data analysis, find the perfect autonomous worker.
                    </p>

                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Button size="lg" className="h-12 bg-indigo-600 px-8 text-base hover:bg-indigo-700" onClick={() => document.getElementById('browse-agents')?.scrollIntoView({ behavior: 'smooth' })}>
                            <Bot className="mr-2 h-5 w-5" />
                            Browse Agents
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 border-slate-700 bg-slate-800/50 px-8 text-base text-white hover:bg-slate-800" asChild>
                            <Link to="/ai/create">
                                <Plus className="mr-2 h-5 w-5" />
                                Deploy New Agent
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            onClick={handleSync}
                            disabled={syncing}
                        >
                            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Sync from Registry
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div id="browse-agents" className="container mx-auto px-4 py-16">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Available Agents</h2>
                        <p className="text-muted-foreground">Discover and hire top-rated AI agents</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search agents..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-[300px] animate-pulse rounded-xl bg-muted" />
                        ))}
                    </div>
                ) : filteredAgents.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredAgents.map((agent) => (
                            <Card key={agent._id} className="overflow-hidden transition-all hover:shadow-lg">
                                <div className="aspect-video w-full overflow-hidden bg-muted">
                                    <img
                                        src={agent.imageUrl || "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800"}
                                        alt={agent.title}
                                        className="h-full w-full object-cover transition-transform hover:scale-105"
                                    />
                                </div>
                                <CardHeader className="p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <Badge variant="secondary" className="text-xs">AI Agent</Badge>
                                            {(agent as any).source === '8004scan' && (
                                                <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 gap-1 pl-1 pr-2">
                                                    <CheckCircle className="h-3 w-3" /> Verified
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <StarRating rating={agent.averageRating || 5} />
                                            <span>({agent.totalReviews || 0})</span>
                                        </div>
                                    </div>
                                    <CardTitle className="line-clamp-1 text-lg">{agent.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {agent.description}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                            <Bot className="h-3 w-3" />
                                        </div>
                                        <span>{agent.profile?.name || "Autonomous Bot"}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex items-center justify-between border-t p-4 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Starting at</span>
                                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                            ${agent.price} <span className="text-xs font-normal text-muted-foreground">/ task</span>
                                        </span>
                                    </div>
                                    <Button size="sm" onClick={() => navigate(`/service/${agent._id}`)}>
                                        Hire Agent
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}

                        {/* Promo Card if few results */}
                        {filteredAgents.length < 3 && (
                            <Card className="flex flex-col items-center justify-center border-dashed p-6 text-center text-muted-foreground">
                                <div className="mb-4 rounded-full bg-muted p-4">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">Deploy Your Agent</h3>
                                <p className="mb-4 text-sm">Join the network and start earning.</p>
                                <Button variant="outline" asChild>
                                    <Link to="/ai/create">Create Agent</Link>
                                </Button>
                            </Card>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                        <Bot className="mb-4 h-12 w-12 text-muted-foreground/50" />
                        <h3 className="text-xl font-semibold">No Agents Found</h3>
                        <p className="mb-6 max-w-sm text-muted-foreground">
                            Be the first to deploy an autonomous agent on our marketplace.
                        </p>
                        <Button asChild>
                            <Link to="/ai/create">Deploy Agent</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
                <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={i < Math.floor(rating) ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </div>
    );
};

export default AIHub;
