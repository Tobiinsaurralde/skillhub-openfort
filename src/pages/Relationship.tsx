import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  RefreshCw,
  Star,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Copy,
  MessageCircle,
  Send,
} from "lucide-react";
import { useWalletAccount } from "@/hooks/useWalletAccount";
import { useToast } from "@/hooks/use-toast";
import { ReviewModal } from "@/components/ReviewModal";

interface TransferItem {
  txHash: string;
  amount: string;
  blockNumber: string;
  timestamp: string;
  reviewed: boolean;
  buyerWallet: string;
}

interface PurchaseItem {
  _id: string;
  txHash: string;
  serviceId: {
    _id: string;
    title: string;
    imageUrl: string;
    price: number;
  };
  createdAt: string;
}

interface ReviewItem {
  _id: string;
  txHash: string;
  rating: number;
  comment: string;
  createdAt: string;
  service?: {
    title: string;
    imageUrl: string;
  };
}

interface SellerProfile {
  name: string;
  imageUrl: string;
  walletAddress: string;
  whatsapp?: string;
  telegram?: string;
}

const Relationship = () => {
  const { sellerWallet } = useParams();
  const { user } = useWalletAccount();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  const fetchData = async () => {
    if (!user || !sellerWallet) return;

    try {
      // Fetch seller profile
      const profileRes = await fetch(`${API_BASE_URL}/api/profile/${sellerWallet}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setSellerProfile(profileData.profile);
      }

      // Fetch cached transfers
      const transfersRes = await fetch(
        `${API_BASE_URL}/api/transfers/${user}/${sellerWallet}`
      );
      if (transfersRes.ok) {
        const transfersData = await transfersRes.json();
        setTransfers(transfersData.transfers || []);
        setHasMore(transfersData.hasMore || false);
      }

      // Fetch on-site purchases
      const purchasesRes = await fetch(
        `${API_BASE_URL}/api/transfers/${user}/${sellerWallet}/purchases`
      );
      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json();
        setPurchases(purchasesData.purchases || []);
      }

      // Fetch reviews for this relationship
      const reviewsRes = await fetch(
        `${API_BASE_URL}/api/reviews/relationship/${user}/${sellerWallet}`
      );
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching relationship data:", error);
      toast({
        title: "Error",
        description: "Failed to load relationship data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user || !sellerWallet) return;

    setRefreshing(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/transfers/${user}/${sellerWallet}/refresh`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers || []);
        setHasMore(data.hasMore || false);

        if (data.warning) {
          toast({
            title: "Partial refresh",
            description: data.warning,
            variant: "default",
          });
        } else {
          toast({
            title: "Refreshed",
            description: `Found ${data.transfers?.length || 0} off-site payments`,
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing transfers:", error);
      toast({
        title: "Error",
        description: "Failed to refresh transfers",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, sellerWallet]);

  // Check if a purchase has been reviewed
  const isPurchaseReviewed = (txHash: string) => {
    return reviews.some((r) => r.txHash.toLowerCase() === txHash.toLowerCase());
  };

  // Format USDC amount (stored as string with 6 decimals)
  const formatAmount = (amount: string) => {
    const value = parseFloat(amount) / 1e6;
    return `$${value.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Please connect your wallet</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const unreviewedTransfers = transfers.filter((t) => !t.reviewed);
  const unreviewedPurchases = purchases.filter((p) => !isPurchaseReviewed(p.txHash));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/profile">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </Button>

        {/* Seller Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
            {sellerProfile?.imageUrl ? (
              <img
                src={sellerProfile.imageUrl}
                alt={sellerProfile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold">
                {sellerWallet?.slice(0, 2)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {sellerProfile?.name || `${sellerWallet?.slice(0, 6)}...${sellerWallet?.slice(-4)}`}
            </h1>

            {/* Wallet Address & Copy */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span className="font-mono">{sellerWallet}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  if (sellerWallet) {
                    navigator.clipboard.writeText(sellerWallet);
                    toast({ description: "Address copied to clipboard" });
                  }
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {/* Contact Actions */}
            <div className="flex items-center gap-2 mt-2">
              {sellerProfile?.whatsapp && (
                <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                  <a
                    href={`https://wa.me/${sellerProfile.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    WhatsApp
                  </a>
                </Button>
              )}
              {sellerProfile?.telegram && (
                <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                  <a
                    href={`https://t.me/${sellerProfile.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Send className="h-4 w-4 text-blue-500" />
                    Telegram
                  </a>
                </Button>
              )}
            </div>

            <p className="text-muted-foreground mt-2">Your work history together</p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchases.length + transfers.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reviews Left
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {unreviewedTransfers.length + unreviewedPurchases.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* On-site Purchases */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">On-site Purchases</h2>
          {purchases.length === 0 ? (
            <p className="text-muted-foreground italic">No purchases yet.</p>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => {
                const reviewed = isPurchaseReviewed(purchase.txHash);
                return (
                  <Card key={purchase._id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 overflow-hidden rounded bg-muted">
                          {purchase.serviceId?.imageUrl && (
                            <img
                              src={purchase.serviceId.imageUrl}
                              alt={purchase.serviceId.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {purchase.serviceId?.title || "Service"}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            <span>${purchase.serviceId?.price}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(purchase.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {reviewed ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Reviewed
                          </Badge>
                        ) : (
                          <ReviewModal
                            serviceId={purchase.serviceId?._id}
                            reviewerWallet={user}
                            onReviewSubmitted={fetchData}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Off-site Transfers */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Off-site Payments</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Check for new payments
            </Button>
          </div>

          {hasMore && (
            <p className="mb-4 text-sm text-muted-foreground">
              More payment history available. Click refresh to load more.
            </p>
          )}

          {transfers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No off-site payments detected yet.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Send USDC directly to this seller's wallet, then click "Check for
                  new payments" to unlock a review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer) => {
                const isSent = transfer.buyerWallet?.toLowerCase() === user.toLowerCase();
                const review = reviews.find(r => r.txHash.toLowerCase() === transfer.txHash.toLowerCase());

                return (
                  <Card key={transfer.txHash}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isSent ? 'text-red-500' : 'text-green-500'}`}>
                            {isSent ? "-" : "+"}{formatAmount(transfer.amount)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {isSent ? "Sent" : "Received"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(transfer.timestamp)}</span>
                          <span>•</span>
                          <span className="font-mono text-xs">
                            {transfer.txHash.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                      <div>
                        {review ? (
                          <div className="text-right">
                            <div className="flex justify-end gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {isSent ? "You: " : "They: "}{review.comment}
                            </p>
                          </div>
                        ) : (
                          isSent ? (
                            <TransferReviewButton
                              txHash={transfer.txHash}
                              reviewerWallet={user}
                              onReviewSubmitted={fetchData}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Received
                            </span>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Reviews Left */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Your Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground italic">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review._id}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    {review.service?.title && (
                      <p className="mb-1 text-sm font-medium text-muted-foreground">
                        For: {review.service.title}
                      </p>
                    )}
                    <p className="text-sm">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for reviewing off-site transfers
const TransferReviewButton = ({
  txHash,
  reviewerWallet,
  onReviewSubmitted,
}: {
  txHash: string;
  reviewerWallet: string;
  onReviewSubmitted: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }
    if (comment.length < 10) {
      toast({
        title: "Comment too short",
        description: "Please provide at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          reviewerWallet,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      setOpen(false);
      onReviewSubmitted();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Leave Review
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Rate this Payment</h3>

            <div className="mb-4 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                      }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Describe your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-4 min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Relationship;

