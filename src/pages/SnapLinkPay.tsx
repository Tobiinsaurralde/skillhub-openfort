import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Wallet, AlertCircle } from "lucide-react";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { useToast } from "@/components/ui/use-toast";

interface ProfileData {
    name: string;
    imageUrl: string;
    walletAddress: string;
}

const SnapLinkPay = () => {
    const { walletAddress, amount: initialAmount } = useParams();
    const [amount, setAmount] = useState(initialAmount || "");
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const { isDeployed, transfer, eoaBalance, usdcAllowance, approveUsdc, deploy, loading: sdkLoading } = useSmartAccount();
    const { toast } = useToast();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

    useEffect(() => {
        const fetchProfile = async () => {
            if (!walletAddress) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/profile/${walletAddress}`);
                const data = await res.json();
                if (res.ok && data.profile) {
                    setProfile(data.profile);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, [walletAddress, API_BASE_URL]);

    const handlePay = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
            return;
        }
        if (!walletAddress) return;

        setPaymentStatus("processing");
        try {
            // Validations
            if (!isDeployed) {
                toast({
                    title: "Smart Account Not Active",
                    description: "Please active your Smart Account in your Profile first.",
                    variant: "destructive",
                    action: <Link to="/profile" className="underline">Go to Profile</Link>
                });
                setPaymentStatus("error");
                return;
            }

            const priceBigInt = BigInt(Math.floor(Number(amount) * 1000000)); // USDC 6 decimals

            if (eoaBalance !== undefined && eoaBalance < priceBigInt) {
                toast({
                    title: "Insufficient Balance",
                    description: `You need at least ${amount} USDC in your MetaMask wallet.`,
                    variant: "destructive"
                });
                setPaymentStatus("error");
                return;
            }

            if (usdcAllowance < priceBigInt) {
                toast({
                    title: "Approval Needed",
                    description: "Please approve USDC spending.",
                    action: <Button variant="outline" size="sm" onClick={() => approveUsdc()}>Approve Now</Button>
                });
                setPaymentStatus("error");
                return;
            }

            // Execute Payment
            await transfer(walletAddress as `0x${string}`, priceBigInt.toString());

            setPaymentStatus("success");
            toast({ title: "Payment Successful!", description: `Sent $${amount} to ${profile?.name || walletAddress}` });

        } catch (error: any) {
            console.error("Payment failed:", error);
            setPaymentStatus("error");
            toast({ title: "Payment Failed", description: error.message || "Unknown error", variant: "destructive" });
        }
    };

    if (loadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile && !loadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Card className="w-full max-w-md text-center p-6">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">User Not Found</h2>
                    <p className="text-muted-foreground">The wallet address in this link doesn't match any SnapSkill profile.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 relative">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg mx-auto">
                            <AvatarImage src={profile?.imageUrl} />
                            <AvatarFallback className="text-2xl">{profile?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 right-[calc(50%-2.5rem)] bg-background text-xs font-mono py-1 px-2 rounded-full border shadow-sm flex items-center gap-1">
                            <Wallet className="h-3 w-3 text-muted-foreground" />
                            {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
                        </div>
                    </div>
                    <CardTitle className="text-2xl">{profile?.name}</CardTitle>
                    <CardDescription>requested a payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">

                    {paymentStatus === "success" ? (
                        <div className="text-center space-y-4 py-6">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-green-700">Payment Sent!</h3>
                            <p className="text-muted-foreground">You successfully sent <strong className="text-foreground">${amount} USDC</strong> to {profile?.name}.</p>
                            <Button className="w-full mt-4" variant="outline" asChild>
                                <Link to="/">Go Home</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Amount to Pay (USDC)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-7 text-lg font-bold h-12"
                                        placeholder="0.00"
                                        readOnly={!!initialAmount}
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 text-lg gap-2 shadow-lg shadow-primary/20"
                                onClick={handlePay}
                                disabled={paymentStatus === "processing" || sdkLoading || !amount}
                            >
                                {paymentStatus === "processing" || sdkLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay now with Smart Account
                                    </>
                                )}
                            </Button>

                            <p className="text-center text-xs text-muted-foreground mt-4">
                                Gasless Transaction • Secured by ERC-4337
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SnapLinkPay;
