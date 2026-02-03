import express from "express";
import { paymentMiddleware } from "x402-express";
import cors from "cors";
import uploadRoutes from "./routes/upload.routes";
import serviceRoutes from "./routes/service.route";
import protectedRoutes from "./routes/protected.route";
import profileRoutes from "./routes/profile.route";
import purchaseRoutes from "./routes/purchase.route";
import { Service } from "./models/service.model";

export interface IServiceSchema {
  _id: string;
  title: string;
  walletAddress: string;
  category: string;
  price: number;
  deliveryTime: string;
  revisions: string;
  description: string;
  includes: string[];
  imageUrl: string;
  imagePublicId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getSellerWallet(serviceId: string): Promise<string> {
  const service = await Service.findById(serviceId).lean<IServiceSchema>();
  if (!service) throw new Error("Servicio no encontrado");
  return service.walletAddress;
}

export async function getServicePrice(serviceId: string): Promise<number> {
  const service = await Service.findById(serviceId).lean<IServiceSchema>();
  if (!service) throw new Error("Servicio no encontrado");
  return service.price;
}

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

import reviewRoutes from "./routes/review.route";
import transferRoutes from "./routes/transfer.route";

app.use("/api/upload", uploadRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/transfers", transferRoutes);
import proxyRoutes from "./routes/proxy.routes";
app.use("/api/proxy", proxyRoutes);

app.use("/protected/service/:id", async (req, res, next) => {
  console.log(res.getHeaders());
  try {
    const serviceId = req.params.id;
    const service = await Service.findById(serviceId).lean<IServiceSchema>();
    if (!service) return res.status(404).json({ message: "Service not found" });

    const sellerWallet = service.walletAddress;
    const price = service.price.toString();

    return paymentMiddleware(
      sellerWallet,
      {
        [req.path]: {
          price,
          network: "base-sepolia",
          config: { description: "Pago directo al vendedor" },
        },
      },
      { url: "https://facilitator.ultravioletadao.xyz" }
    )(req, res, next);
  } catch (err) {
    console.error("ERROR middleware dinámico:", err);
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return res
      .status(500)
      .json({ message: "Server error", error: errorMessage });
  }
});

// Rutas protegidas
app.use("/protected", protectedRoutes);

export default app;
