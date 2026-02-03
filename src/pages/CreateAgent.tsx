
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Upload, Loader2, Bot, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWalletAccount } from "@/hooks/useWalletAccount";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

const CreateAgent = () => {
    const navigate = useNavigate();
    const { user: walletAddress } = useWalletAccount();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        price: "",
        description: "",
        capabilities: "",
        imageFile: null as File | null,
        imagePreview: "",
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({
                ...prev,
                imageFile: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletAddress) {
            toast({ title: "Connect Wallet", description: "Please connect your wallet to continue.", variant: "destructive" });
            return;
        }

        if (!formData.title || !formData.price || !formData.description || !formData.imageFile) {
            toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            const dataToSend = new FormData();
            dataToSend.append("walletAddress", walletAddress);

            // AI Agent specific defaults
            dataToSend.append("category", "AI Agent");
            dataToSend.append("deliveryTime", "Instant"); // Agents are fast!
            dataToSend.append("revisions", "Unlimited"); // AI doesn't mind iterations

            // Mapped fields
            dataToSend.append("title", formData.title);
            dataToSend.append("price", formData.price);
            dataToSend.append("description", formData.description);

            // Parse capabilities into includes array
            const includes = formData.capabilities
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);

            if (includes.length === 0) {
                includes.push("Autonomous Task Execution");
                includes.push("24/7 Availability");
            }

            dataToSend.append("includes", JSON.stringify(includes));

            if (formData.imageFile) {
                dataToSend.append("imageFile", formData.imageFile);
            }

            const response = await fetch(`${API_BASE_URL}/api/services`, {
                method: "POST",
                body: dataToSend,
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Agent Deployed!",
                    description: "Your AI Agent is now live on the marketplace.",
                    className: "bg-green-600 text-white border-none"
                });
                setTimeout(() => navigate("/ai"), 1500);
            } else {
                throw new Error(result.message || "Failed to deploy agent");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <Button variant="ghost" onClick={() => navigate("/ai")} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to AI Hub
                </Button>

                <Card className="border-indigo-100 shadow-xl dark:border-slate-800">
                    <CardHeader className="space-y-1 bg-slate-100/50 pb-8 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Bot className="h-6 w-6" />
                            <span className="font-semibold uppercase tracking-wider text-xs">Agent Deployment</span>
                        </div>
                        <CardTitle className="text-3xl font-bold">Deploy New AI Agent</CardTitle>
                        <CardDescription className="text-base">
                            Register your autonomous agent to start accepting tasks and earning crypto.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Agent Name</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. CodeReviewBot v1.0"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price">Price per Task (USDC)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            id="price"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="5.00"
                                            className="pl-7"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description & Instructions</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what your agent does and how users should interact with it..."
                                    className="min-h-[150px]"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capabilities">Capabilities (comma separated)</Label>
                                <Input
                                    id="capabilities"
                                    placeholder="e.g. Python Scripting, Data Analysis, API Integration"
                                    value={formData.capabilities}
                                    onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Agent Avatar</Label>
                                <div className="flex items-center gap-6 rounded-lg border border-dashed p-6">
                                    {formData.imagePreview ? (
                                        <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                                            <img src={formData.imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, imageFile: null, imagePreview: "" })}
                                                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                            <Bot className="h-12 w-12 opacity-20" />
                                        </div>
                                    )}

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
                                                <Upload className="mr-2 h-4 w-4" /> Upload Image
                                            </Button>
                                            <span className="text-sm text-muted-foreground">JPG, PNG up to 5MB</span>
                                        </div>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </div>
                            </div>

                        </form>
                    </CardContent>

                    <CardFooter className="flex justify-between border-t bg-slate-50 px-8 py-6 dark:bg-slate-900/50">
                        <p className="text-sm text-muted-foreground">
                            By deploying, your agent will be listed on the public registry.
                        </p>
                        <Button size="lg" onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deploying...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" /> Deploy Agent
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default CreateAgent;
