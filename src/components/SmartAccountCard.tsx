import { useSmartAccount } from "../hooks/useSmartAccount";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Loader2, ShieldCheck, Wallet, CheckCircle2 } from "lucide-react";
import { SmartAccountHelp } from "@/components/SmartAccountHelp";
import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, ArrowDownLeft, QrCode as QrCodeIcon, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QRCode from "react-qr-code";
import { useRef } from "react";
import html2canvas from "html2canvas";

interface SmartAccountCardProps {
    profileName?: string;
    profileImage?: string;
}

export const SmartAccountCard = ({ profileName, profileImage }: SmartAccountCardProps) => {
    const { smartAccountAddress, isDeployed, deploy, approveUsdc, loading, ownerAddress, usdcAllowance, eoaBalance } = useSmartAccount();
    const { toast } = useToast();
    const [actionLoading, setActionLoading] = useState(false);

    const isApproved = usdcAllowance > BigInt(0);

    const handleDeploy = async () => {
        try {
            setActionLoading(true);
            await deploy();
            toast({
                title: "Success",
                description: "Smart Account activated successfully!",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to activate Smart Account",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            const hash = await approveUsdc();
            toast({
                title: "Transaction Sent",
                description: "USDC Approval transaction sent. Hash: " + hash,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to approve USDC. " + (error as Error).message,
            });
        } finally {
            setActionLoading(false);
        }
    };

    const isLoading = loading || actionLoading;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">Your Wallet</CardTitle>
                    <SmartAccountHelp />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isDeployed && usdcAllowance >= BigInt("100000000000") && (
                    <div className="flex gap-2">
                        <p className="text-sm text-green-500 flex items-center gap-1 flex-1">
                            <CheckCircle2 className="h-4 w-4" />
                            USDC Approved
                        </p>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary" size="sm" className="gap-2">
                                    <ArrowDownLeft className="h-4 w-4" />
                                    Receive / Create Link
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Payment Link</DialogTitle>
                                    <DialogDescription>
                                        Generate a SnapLink to get paid instantly in USDC.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Amount (USDC)</Label>
                                        <Input
                                            placeholder="Example: 50"
                                            type="number"
                                            id="link-amount"
                                        />
                                    </div>
                                    <Button className="w-full gap-2" onClick={() => {
                                        const amount = (document.getElementById("link-amount") as HTMLInputElement).value;
                                        if (!amount) return;
                                        const link = `${window.location.origin}/pay/${ownerAddress}/${amount}`;
                                        navigator.clipboard.writeText(link);
                                        toast({ title: "Copied!", description: "Payment link copied to clipboard." });
                                    }}>
                                        <Copy className="h-4 w-4" />
                                        Copy Link
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <QrCodeIcon className="h-4 w-4" />
                                    Smart Card
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none p-0">
                                <div className="flex flex-col items-center justify-center space-y-6">
                                    <div
                                        id="smart-card"
                                        className="relative w-[340px] h-[540px] rounded-[2.5rem] overflow-hidden bg-slate-950 text-white shadow-2xl flex flex-col items-center justify-between p-8 border border-white/10"
                                    >
                                        {/* Mesh Gradients Background */}
                                        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] opacity-70 animate-pulse" />
                                        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] opacity-70 animate-pulse delay-1000" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px]" />

                                        {/* Glass Overlay Texture */}
                                        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px]" />

                                        <div className="relative z-10 w-full flex flex-col items-center">
                                            {/* Logo */}
                                            <div className="flex items-center gap-2 mb-8 opacity-90">
                                                <Wallet className="h-5 w-5 text-blue-400" />
                                                <span className="font-bold tracking-tight text-sm uppercase">SnapSkill Pay</span>
                                            </div>

                                            {/* Profile Image with Glow */}
                                            <div className="relative mb-6 group">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                                                <div className="relative w-24 h-24 rounded-full border-2 border-white/50 overflow-hidden bg-slate-900 shadow-xl">
                                                    {profileImage ? (
                                                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                                            <span className="text-3xl font-bold text-white/50">
                                                                {profileName?.charAt(0) || "U"}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Name & Tagline */}
                                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 text-center leading-tight mb-1">
                                                {profileName || "Anonymous User"}
                                            </h2>
                                            <p className="text-slate-400 text-sm font-medium tracking-wide">Official Payment Link</p>
                                        </div>

                                        {/* QR Code Container with Glassmorphism */}
                                        <div className="relative z-10 bg-white p-4 rounded-3xl shadow-2xl mx-auto transform transition-transform hover:scale-105 duration-300">
                                            <QRCode
                                                value={`${window.location.origin}/pay/${ownerAddress}`}
                                                size={160}
                                                level="H"
                                                fgColor="#020617"
                                            />
                                            <div className="absolute inset-0 border-[3px] border-white/20 rounded-3xl pointer-events-none"></div>
                                        </div>

                                        {/* Footer Info */}
                                        <div className="relative z-10 w-full text-center space-y-2">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <p className="font-mono text-xs text-white/80 tracking-wider">
                                                    {ownerAddress?.slice(0, 6)}...{ownerAddress?.slice(-4)}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-light">
                                                Secured by Ethereum
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-900/20"
                                        onClick={async () => {
                                            const element = document.getElementById('smart-card');
                                            if (element) {
                                                const canvas = await html2canvas(element, {
                                                    scale: 3,
                                                    backgroundColor: null,
                                                    useCORS: true,
                                                    allowTaint: true,
                                                });
                                                const image = canvas.toDataURL("image/png");
                                                const link = document.createElement("a");
                                                link.href = image;
                                                link.download = `snapskill-card-${profileName?.replace(/\s+/g, '-').toLowerCase() || 'user'}.png`;
                                                link.click();
                                                toast({ title: "Downloaded!", description: "Your Business Card is ready." });
                                            }
                                        }}
                                    >
                                        <Download className="h-4 w-4" />
                                        Download High-Res Card
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {/* Status Display */}
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Status</span>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isDeployed ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`} />
                        <span className="text-sm text-muted-foreground">{isDeployed ? "Active on Base" : "Not Deployed"}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">EOA (MetaMask) Address</span>
                    <div className="p-2 bg-muted rounded-md font-mono text-xs break-all">
                        {ownerAddress || "Loading..."}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Smart Wallet Address</span>
                    <div className="p-2 bg-muted rounded-md font-mono text-xs break-all">
                        {smartAccountAddress || "Not Created"}
                    </div>
                </div>

                {/* EOA Balance Display */}
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">EOA USDC Balance</span>
                    <div className="p-2 bg-muted/50 border rounded-md font-mono text-sm flex items-center justify-between">
                        <span className="font-bold">
                            {(Number(eoaBalance) / 1000000).toFixed(2)} USDC
                        </span>
                        <span className="text-xs text-muted-foreground">in MetaMask</span>
                    </div>
                </div>

                {!isDeployed ? (
                    <Button
                        className="w-full gap-2 relative overflow-hidden group"
                        onClick={handleDeploy}
                        disabled={actionLoading || loading}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/0 group-hover:from-primary/20 transition-all" />
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        Activate Smart Account
                    </Button>
                ) : (
                    !isApproved && (
                        <Button
                            variant="outline"
                            className="w-full border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                            onClick={() => approveUsdc()}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve USDC"}
                        </Button>
                    )
                )}
            </CardContent>
        </Card>
    );
};
