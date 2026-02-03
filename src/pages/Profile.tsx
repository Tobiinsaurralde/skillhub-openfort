import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useWalletAccount } from "../hooks/useWalletAccount";
import { useToast } from "../hooks/use-toast";
import { CheckCircle2, User, Upload, Plus, X, LayoutDashboard, Settings, Star, DollarSign, Award, MessageSquare, Users, ArrowRight, Wallet } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { SmartAccountCard } from "../components/SmartAccountCard";
import {

  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface DashboardStats {
  totalEarnings: number;
  mostPurchasedService: string;
  averageRating: number;
  totalReviews: number;
  recentReviews: any[];
  totalUniqueClients: number;
  recentSales: any[];
  salesByCategory: Record<string, number>;
}

interface SellerRelationship {
  sellerWallet: string;
  sellerProfile?: {
    name: string;
    imageUrl: string;
  };
}

const Profile = () => {
  const { user } = useWalletAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Buyer relationships (sellers they've worked with)
  const [sellerRelationships, setSellerRelationships] = useState<SellerRelationship[]>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setFetching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${user}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setName(data.profile.name);
            setBio(data.profile.bio);
            setSkills(data.profile.skills || []);
            setImagePreview(data.profile.imageUrl);
            setWhatsapp(data.profile.whatsapp || "");
            setTelegram(data.profile.telegram || "");
            setIsEditing(true);
          }
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user, API_BASE_URL]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoadingStats(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/stats/${user}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, API_BASE_URL]);

  // Fetch seller relationships (as a buyer)
  useEffect(() => {
    const fetchRelationships = async () => {
      if (!user) return;
      setLoadingRelationships(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/transfers/relationships/${user}`);
        if (res.ok) {
          const data = await res.json();
          const sellers = data.sellers || [];

          // Fetch profiles for each seller
          const relationshipsWithProfiles = await Promise.all(
            sellers.map(async (sellerWallet: string) => {
              try {
                const profileRes = await fetch(`${API_BASE_URL}/api/profile/${sellerWallet}`);
                if (profileRes.ok) {
                  const profileData = await profileRes.json();
                  return {
                    sellerWallet,
                    sellerProfile: profileData.profile ? {
                      name: profileData.profile.name,
                      imageUrl: profileData.profile.imageUrl,
                    } : undefined,
                  };
                }
              } catch {
                // Ignore profile fetch errors
              }
              return { sellerWallet };
            })
          );

          setSellerRelationships(relationshipsWithProfiles);
        }
      } catch (error) {
        console.error("Error fetching relationships", error);
      } finally {
        setLoadingRelationships(false);
      }
    };

    if (user) {
      fetchRelationships();
    }
  }, [user, API_BASE_URL]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!name || !bio) {
      toast({
        title: "Missing fields",
        description: "Name and Bio are required",
        variant: "destructive",
      });
      return;
    }

    if (!imageFile && !imagePreview) {
      toast({
        title: "Missing image",
        description: "Profile image is required",
        variant: "destructive",
      });
      return;
    }

    if (!whatsapp.trim() && !telegram.trim()) {
      toast({
        title: "Missing contact info",
        description: "At least one contact method (WhatsApp or Telegram) is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("walletAddress", user);
      formData.append("name", name);
      formData.append("bio", bio);
      formData.append("skills", JSON.stringify(skills));
      formData.append("whatsapp", whatsapp);
      formData.append("telegram", telegram);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: method,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to save profile");

      toast({
        title: "Success",
        description: `Profile ${isEditing ? 'updated' : 'created'} successfully`,
      });

      // Update state to editing mode after successful create
      if (!isEditing) setIsEditing(true);

    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Profile</h1>
          {isEditing && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
              Profile Active
            </Badge>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-2">
              <Wallet className="h-4 w-4" />
              Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loadingStats ? "..." : `$${stats?.totalEarnings || 0}`}
                    </div>
                    <p className="text-xs text-muted-foreground">Lifetime revenue</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loadingStats ? "..." : (stats?.averageRating || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {stats?.totalReviews || 0} reviews
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loadingStats ? "..." : (stats?.totalUniqueClients || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Distinct buyers</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Service</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-bold truncate">
                      {loadingStats ? "..." : (stats?.mostPurchasedService || "No sales yet")}
                    </div>
                    <p className="text-xs text-muted-foreground">Most purchased gig</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Sales & Categories */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <p className="text-muted-foreground">Loading sales...</p>
                    ) : stats?.recentSales && stats.recentSales.length > 0 ? (
                      <ul className="space-y-2">
                        {stats.recentSales.map((sale: any) => (
                          <li key={sale._id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                            <div className="truncate max-w-[60%]">
                              <p className="font-medium truncate">{sale.serviceTitle}</p>
                              <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="font-bold">${sale.price}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent sales.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Sales by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <p className="text-muted-foreground">Loading...</p>
                    ) : stats?.salesByCategory && Object.keys(stats.salesByCategory).length > 0 ? (
                      <ul className="space-y-2">
                        {Object.entries(stats.salesByCategory).map(([category, count]) => (
                          <li key={category} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{category}</span>
                            <Badge variant="secondary">{count} sales</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No sales data.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Reviews */}
              <div className="grid gap-4">
                <h2 className="text-xl font-semibold mt-4">Recent Reviews</h2>
                {loadingStats ? (
                  <p className="text-muted-foreground">Loading reviews...</p>
                ) : stats?.recentReviews && stats.recentReviews.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {stats.recentReviews.map((review: any) => (
                      <Card key={review._id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="fill-current w-4 h-4" />
                              <span className="font-bold text-sm">{review.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <CardTitle className="text-base line-clamp-1 mt-1">
                            {review.serviceId?.title || "Service"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            "{review.comment}"
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No reviews yet.</p>
                  </div>
                )}
              </div>

              {/* Seller Relationships (as a buyer) */}
              <div className="grid gap-4 mt-8">
                <h2 className="text-xl font-semibold">Sellers You've Worked With</h2>
                {loadingRelationships ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : sellerRelationships.length > 0 ? (
                  <div className="grid gap-3">
                    {sellerRelationships.map((rel) => (
                      <Card key={rel.sellerWallet}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                              {rel.sellerProfile?.imageUrl ? (
                                <img
                                  src={rel.sellerProfile.imageUrl}
                                  alt={rel.sellerProfile.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                                  {rel.sellerWallet.slice(0, 2)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {rel.sellerProfile?.name || `${rel.sellerWallet.slice(0, 6)}...${rel.sellerWallet.slice(-4)}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                View payment history & leave reviews
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/relationship/${rel.sellerWallet}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No seller relationships yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Purchase a service to establish a relationship.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-card p-6 shadow-sm">
                {/* Image Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/25 hover:border-primary/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-muted/50 text-muted-foreground">
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-xs">Upload Photo</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <p className="text-sm text-muted-foreground">Click to upload profile picture</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp (Optional)</Label>
                      <Input
                        id="whatsapp"
                        placeholder="+1234567890"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram">Telegram (Optional)</Label>
                      <Input
                        id="telegram"
                        placeholder="@username"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex gap-2">
                      <Select
                        value={skillInput}
                        onValueChange={(val) => {
                          if (val && !skills.includes(val)) {
                            setSkills([...skills, val]);
                            setSkillInput(""); // Reset select if needed, though Select value binds to this
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a skill to add..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="React" disabled className="font-bold opacity-100 bg-muted">Development</SelectItem>
                          {["React", "Node.js", "TypeScript", "Solidity", "Smart Contracts", "Web3", "Python", "Go", "Rust"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}

                          <SelectItem value="Design" disabled className="font-bold opacity-100 bg-muted mt-2">Design</SelectItem>
                          {["Logo Design", "UI/UX", "Illustration", "Photoshop", "Figma", "3D Modeling", "Video Editing"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}

                          <SelectItem value="Marketing" disabled className="font-bold opacity-100 bg-muted mt-2">Marketing</SelectItem>
                          {["SEO", "Social Media", "Content Writing", "Email Marketing", "Copywriting", "Ads Management"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}

                          <SelectItem value="Business" disabled className="font-bold opacity-100 bg-muted mt-2">Business</SelectItem>
                          {["Consulting", "Project Management", "Translation", "Data Entry", "Virtual Assistant"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No skills selected yet.</p>
                      )}
                      {skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="gap-1 pl-3">
                          {skill}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="wallet">
            <div className="max-w-3xl mx-auto">
              <SmartAccountCard profileName={name} profileImage={imagePreview} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div >
  );
};

export default Profile;
