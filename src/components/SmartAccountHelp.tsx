import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, ShieldCheck, Zap, Wallet } from "lucide-react";

export const SmartAccountHelp = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                    <Info className="h-4 w-4" />
                    How it works
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-none bg-gradient-to-br from-background to-muted/50 p-0 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-12 translate-y-12 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                                Magic Wallet
                            </span>
                            <span className="text-foreground">Explained</span>
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground mt-2">
                            Experience the future of crypto payments. Secure, fast, and gasless.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6">
                        <div className="flex gap-4 items-start rounded-xl p-4 bg-card/50 border border-border/50 hover:bg-card/80 transition-colors">
                            <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-1">Your Smart Account</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Think of this as a VIP lane for your transactions. It's a special wallet we deploy <span className="text-foreground font-medium">just for you</span> that handles gas fees automatically, so you don't have to worry about ETH.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start rounded-xl p-4 bg-card/50 border border-border/50 hover:bg-card/80 transition-colors">
                            <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-500 shrink-0">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-1">One-Time Approval</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Instead of signing every single time, you give your Smart Account permission to handle payments.
                                    <br />
                                    <span className="italic text-xs opacity-80">(Refers to "Infinite Approve")</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start rounded-xl p-4 bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors">
                            <div className="rounded-lg bg-green-500/10 p-2.5 text-green-600 shrink-0">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-green-700 dark:text-green-400 mb-1">Is it Safe? Absolutely.</h3>
                                <p className="text-sm text-green-800/80 dark:text-green-300/80 leading-relaxed">
                                    The "Infinite Approval" might sound scary, but it's 100% safe here. You are approving <strong>YOUR OWN</strong> Smart Account, not a third party.
                                    <br />
                                    Only <strong>YOU</strong> control this wallet. Your funds stay in your main wallet until you explicitly decide to make a payment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/50 p-4 text-center text-xs text-muted-foreground border-t">
                    Powered by ERC-4337 Account Abstraction
                </div>
            </DialogContent>
        </Dialog>
    );
};
