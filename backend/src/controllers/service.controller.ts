import { Request, Response } from "express";
import { Service } from "../models/service.model";
import { Purchase } from "../models/purchase.model";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary";
import { isEvmAddress } from "../utils/address";

interface CreateServiceBody {
  title: string;
  category: string;
  price: string;
  deliveryTime: string;
  revisions: string;
  description: string;
  walletAddress: string;
  includes: string;
}

export const createService = async (
  req: Request<{}, {}, CreateServiceBody>,
  res: Response
) => {
  try {
    const {
      title,
      category,
      price,
      deliveryTime,
      revisions,
      description,
      walletAddress: rawWalletAddress,
      includes: includesJson,
    } = req.body;

    const walletAddress = rawWalletAddress ? rawWalletAddress.toLowerCase() : "";

    if (!walletAddress || !isEvmAddress(walletAddress)) {
      return res.status(400).json({
        message: "Invalid or missing walletAddress",
      });
    }

    if (!title || title.length < 5) {
      return res.status(400).json({
        message: "Title must be at least 5 characters",
      });
    }

    if (!category) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    if (!revisions) {
      return res.status(400).json({
        message: "Revisions field is required",
      });
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        message: "Invalid price: must be a positive number",
      });
    }

    if (!deliveryTime) {
      return res.status(400).json({
        message: "Delivery time is required",
      });
    }

    if (!description || description.length < 100) {
      return res.status(400).json({
        message: "Description too short (minimum 100 characters)",
      });
    }

    let includes: string[] = [];
    try {
      const parsedIncludes = JSON.parse(includesJson);
      if (!Array.isArray(parsedIncludes) || parsedIncludes.length === 0) {
        return res.status(400).json({
          message: "At least one 'include' is required and must be an array",
        });
      }
      includes = parsedIncludes;
    } catch (e) {
      return res
        .status(400)
        .json({ message: "Invalid JSON format for 'includes'" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
      folder: "services",
    });

    const service = await Service.create({
      title,
      category,
      price: parsedPrice,
      deliveryTime,
      revisions,
      description,
      walletAddress,
      includes,
      imageUrl: uploadedImage.secure_url,
      imagePublicId: uploadedImage.public_id,
    });

    return res.status(201).json({
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("ERROR CREATE SERVICE:", error);
    return res.status(500).json({ message: "Server error", details: error });
  }
};

export const getServices = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const priceMin = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const priceMax = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const ratingMin = req.query.minRating ? Number(req.query.minRating) : undefined;
    const sortBy = (req.query.sortBy as string) || "relevance";
    const category = (req.query.category as string) || "All";
    const ids = (req.query.ids as string) || "";

    const query: any = {};

    if (ids) {
      const idList = ids.split(",");
      query._id = { $in: idList.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (category !== "All") {
      query.category = category;
    }

    // Price Filter
    if (priceMin !== undefined || priceMax !== undefined) {
      query.price = {};
      if (priceMin !== undefined) query.price.$gte = priceMin;
      if (priceMax !== undefined) query.price.$lte = priceMax;
    }

    // Rating Filter
    if (ratingMin !== undefined) {
      query.averageRating = { $gte: ratingMin };
    }

    const skip = (page - 1) * limit;

    let sortStage: any = { createdAt: -1 }; // Default: Newest

    if (sortBy === "price-low") {
      sortStage = { price: 1 };
    } else if (sortBy === "price-high") {
      sortStage = { price: -1 };
    } else if (sortBy === "rating") {
      sortStage = { averageRating: -1 };
    }
    // relevance falls back to createdAt: -1 for now unless we add text scoring

    // Use aggregate to lookup profile
    const services = await Service.aggregate([
      { $match: query },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "profiles",
          let: { sellerWallet: "$walletAddress" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: "$walletAddress" },
                    { $toLower: "$$sellerWallet" }
                  ]
                }
              }
            }
          ],
          as: "profile",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          // If no profile, we can key returning null or partial info.
          // Frontend will handle it.
        }
      }
    ]);

    const total = await Service.countDocuments(query);

    return res.status(200).json({
      services,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("ERROR GET SERVICES:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};



export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { buyer } = req.query; // Check if a buyer is viewing this
    console.log(`=== GET SERVICE BY ID: ${id} ===`);
    console.log("Buyer param:", buyer);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Service ID" });
    }

    const services = await Service.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id)
        }
      },
      {
        $lookup: {
          from: "profiles",
          let: { sellerWallet: "$walletAddress" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: "$walletAddress" },
                    { $toLower: "$$sellerWallet" }
                  ]
                }
              }
            }
          ],
          as: "profile",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!services || services.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const service = services[0];
    let contactInfo = null;

    // Check if purchased
    if (buyer) {
      const buyerLower = (buyer as string).toLowerCase();
      console.log("Checking purchase for buyer:", buyerLower);
      const purchase = await Purchase.findOne({
        serviceId: id,
        buyerWallet: buyerLower,
      });

      console.log("Purchase found:", purchase);

      if (purchase) {
        // Unlock contact info
        if (service.profile) {
          contactInfo = {
            whatsapp: service.profile.whatsapp,
            telegram: service.profile.telegram,
          };
        }
      }
    }

    // Always strip these from the main profile object to be safe, only return explicitly via contactInfo
    if (service.profile) {
      delete service.profile.whatsapp;
      delete service.profile.telegram;
    }

    return res.status(200).json({ service, contactInfo });
  } catch (error) {
    console.error("ERROR GET SERVICE BY ID:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
