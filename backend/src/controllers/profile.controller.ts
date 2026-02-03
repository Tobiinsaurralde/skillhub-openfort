import { Request, Response } from "express";
import { Profile } from "../models/profile.model";
import { Purchase } from "../models/purchase.model";
import { Service } from "../models/service.model";
import { Review } from "../models/review.model";
import cloudinary from "../config/cloudinary";

interface CreateProfileBody {
    name: string;
    bio: string;
    skills: string; // JSON string array
    walletAddress: string;
    whatsapp?: string;
    telegram?: string;
}

export const createUpdateProfile = async (
    req: Request<{}, {}, CreateProfileBody>,
    res: Response
) => {
    try {
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);
        console.log("File:", req.file);

        const body = req.body || {};
        let { name, bio, skills, walletAddress, whatsapp, telegram } = body;

        // Normalize wallet
        if (walletAddress) walletAddress = walletAddress.toLowerCase();

        if (!walletAddress) {
            return res.status(400).json({ message: "Wallet address is required" });
        }

        if (!name || !bio) {
            return res.status(400).json({ message: "Name and Bio are required" });
        }

        if ((!whatsapp || whatsapp.trim() === "") && (!telegram || telegram.trim() === "")) {
            return res.status(400).json({ message: "You must provide at least one contact method (WhatsApp or Telegram)" });
        }

        let parsedSkills: string[] = [];
        try {
            parsedSkills = JSON.parse(skills);
        } catch (e) {
            parsedSkills = [];
        }

        let imageUrl = "";
        let imagePublicId = "";

        const existingProfile = await Profile.findOne({ walletAddress });

        if (req.file) {
            // Upload new image
            const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
                folder: "profiles",
            });
            imageUrl = uploadedImage.secure_url;
            imagePublicId = uploadedImage.public_id;
        } else {
            if (existingProfile) {
                imageUrl = existingProfile.imageUrl;
                imagePublicId = existingProfile.imagePublicId;
            } else {
                return res.status(400).json({ message: "Image is required for new profile" });
            }
        }

        const profileData = {
            walletAddress,
            name,
            bio,
            skills: parsedSkills,
            imageUrl,
            imagePublicId,
            whatsapp,
            telegram
        };

        const profile = await Profile.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            profileData,
            { new: true, upsert: true }
        );

        return res.status(200).json({
            message: "Profile saved successfully",
            profile,
        });

    } catch (error) {
        console.error("ERROR CREATE/UPDATE PROFILE:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.params;

        // Case-insensitive lookup
        const profile = await Profile.findOne({
            walletAddress: { $regex: new RegExp(`^${walletAddress}$`, "i") }
        });

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        return res.status(200).json({ profile });

    } catch (error) {
        console.error("ERROR GET PROFILE:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};

export const getProfileStats = async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.params;
        const walletRegex = { $regex: new RegExp(`^${walletAddress}$`, "i") };

        // 1. Calculate Total Earnings & Sales by Category & Unique Clients
        // Find purchases where this user is the seller
        const purchases = await Purchase.find({ sellerWallet: walletRegex });

        let totalEarnings = 0;
        const serviceSalesCount: Record<string, number> = {};
        const uniqueClients = new Set<string>();
        const salesByCategory: Record<string, number> = {};

        // To get price and category, we need to look up the services
        const sales = await Purchase.aggregate([
            { $match: { sellerWallet: { $regex: new RegExp(`^${walletAddress}$`, "i") } } },
            {
                $lookup: {
                    from: "services",
                    localField: "serviceId",
                    foreignField: "_id",
                    as: "service"
                }
            },
            { $unwind: "$service" },
            { $sort: { createdAt: -1 } } // Sort by newest for recent sales
        ]);

        const recentSales = sales.slice(0, 5).map(sale => ({
            _id: sale._id,
            serviceTitle: sale.service.title,
            price: sale.service.price,
            buyerWallet: sale.buyerWallet,
            createdAt: sale.createdAt
        }));

        sales.forEach(sale => {
            // Earnings
            totalEarnings += (sale.service.price || 0);

            // Most Purchased Service
            const title = sale.service.title;
            serviceSalesCount[title] = (serviceSalesCount[title] || 0) + 1;

            // Unique Clients
            if (sale.buyerWallet) {
                uniqueClients.add(sale.buyerWallet);
            }

            // Sales by Category
            const category = sale.service.category || "Uncategorized";
            salesByCategory[category] = (salesByCategory[category] || 0) + 1;
        });

        const totalUniqueClients = uniqueClients.size;


        let mostPurchasedService = "None";
        let maxSales = 0;

        for (const [title, count] of Object.entries(serviceSalesCount)) {
            if (count > maxSales) {
                maxSales = count;
                mostPurchasedService = title;
            }
        }

        // 3. Fetch Last 3 Reviews (across all services owned by this wallet)
        // First find all services by this wallet
        const myServices = await Service.find({ walletAddress }).select("_id");
        const myServiceIds = myServices.map(s => s._id);

        const recentReviews = await Review.find({ serviceId: { $in: myServiceIds } })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("serviceId", "title");

        // 4. Calculate Average Rating
        const allReviews = await Review.find({ serviceId: { $in: myServiceIds } });
        console.log("DEBUG: allReviews count:", allReviews.length);
        console.log("DEBUG: allReviews ratings:", allReviews.map(r => r.rating));

        const totalRating = allReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        console.log("DEBUG: totalRating:", totalRating);

        const averageRating = allReviews.length > 0 ? (totalRating / allReviews.length) : 0;
        console.log("DEBUG: averageRating (raw):", averageRating); // Keep detailed log

        // Return strict number
        const formattedRating = Number(averageRating.toFixed(1));

        return res.status(200).json({
            stats: {
                totalEarnings,
                mostPurchasedService,
                averageRating: formattedRating,
                totalReviews: allReviews.length,
                recentReviews,
                totalUniqueClients,
                recentSales,
                salesByCategory
            }
        });

    } catch (error) {
        console.error("ERROR GET PROFILE STATS:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};


export const getTopSellers = async (req: Request, res: Response) => {
    try {
        const topSellers = await Purchase.aggregate([
            {
                $lookup: {
                    from: "services",
                    localField: "serviceId",
                    foreignField: "_id",
                    as: "service"
                }
            },
            { $unwind: "$service" },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$sellerWallet" } } },
                    totalEarnings: { $sum: "$service.price" },
                    totalSales: { $sum: 1 },
                    sales: {
                        $push: {
                            _id: "$service._id",
                            title: "$service.title",
                            price: "$service.price",
                            imageUrl: "$service.imageUrl"
                        }
                    }
                }
            },
            { $sort: { totalEarnings: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "profiles",
                    let: { sellerWallet: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        { $toLower: "$walletAddress" },
                                        { $toLower: "$$sellerWallet" },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "profile"
                }
            },
            { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } }
        ]);

        const formattedSellers = topSellers.map(seller => {
            const serviceCounts: Record<string, any> = {};
            let topService: any = null;
            let maxCount = 0;

            seller.sales.forEach((s: any) => {
                const id = s._id.toString();
                if (!serviceCounts[id]) serviceCounts[id] = { ...s, count: 0 };
                serviceCounts[id].count++;

                if (serviceCounts[id].count > maxCount) {
                    maxCount = serviceCounts[id].count;
                    topService = serviceCounts[id];
                }
            });

            return {
                walletAddress: seller._id,
                name: seller.profile?.name || "Unknown",
                imageUrl: seller.profile?.imageUrl || "",
                totalEarnings: seller.totalEarnings,
                totalSales: seller.totalSales,
                topService: topService ? {
                    _id: topService._id,
                    title: topService.title,
                    imageUrl: topService.imageUrl,
                    price: topService.price
                } : null
            };
        });

        return res.status(200).json({ sellers: formattedSellers });

    } catch (error) {
        console.error("ERROR GET TOP SELLERS:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};

export const toggleFavorite = async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.params;
        const { serviceId } = req.body;

        if (!walletAddress || !serviceId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const profile = await Profile.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Initialize favorites if undefined (for old records)
        if (!profile.favorites) {
            profile.favorites = []; // @ts-ignore
        }

        // Assuming favorites are stored as ObjectIds or Strings, let's treat as strings for comparison
        // @ts-ignore
        const index = profile.favorites.findIndex(fav => fav.toString() === serviceId);

        let isFavorite = false;

        if (index > -1) {
            // Remove
            // @ts-ignore
            profile.favorites.splice(index, 1);
            isFavorite = false;
        } else {
            // Add
            // @ts-ignore
            profile.favorites.push(serviceId);
            isFavorite = true;
        }

        await profile.save();

        return res.status(200).json({ message: "Success", isFavorite, favorites: profile.favorites });
    } catch (error) {
        console.error("ERROR TOGGLE FAVORITE:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
