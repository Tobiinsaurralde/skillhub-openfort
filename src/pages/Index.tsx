import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import CategoryCard from "@/components/CategoryCard";
import ServiceCard from "@/components/ServiceCard";
import {
  Palette,
  Code,
  Video,
  Megaphone,
  Music,
  Briefcase,
  Search,
  ArrowRight,
} from "lucide-react";
import { categories } from "@/data/mockData";
import { useEffect, useState } from "react";
import { IServiceCard } from "@/types/service";

const Index = () => {
  const [services, setServices] = useState<IServiceCard[]>([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/services?limit=6`);
        const data = await res.json();
        if (data.services) {
          setServices(data.services);
        }
      } catch (error) {
        console.error("Error loading popular services:", error);
      }
    };
    fetchServices();
  }, [API_BASE_URL]);
  const categoryIcons = [
    { icon: Palette, color: "#ff6b6b" },
    { icon: Megaphone, color: "#4ecdc4" },
    { icon: Code, color: "#45b7d1" },
    { icon: Video, color: "#f7b731" },
    { icon: Music, color: "#5f27cd" },
    { icon: Code, color: "#00d2d3" },
    { icon: Briefcase, color: "#ff9ff3" },
    { icon: Palette, color: "#54a0ff" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-accent py-20 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
              Find the perfect freelance services for your business
            </h1>
            <p className="mb-8 text-xl opacity-90">
              Work with talented people at the most affordable price
            </p>
            <div className="mx-auto flex max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Try 'building mobile app'"
                  className="h-14 pl-12 text-base bg-background text-foreground"
                />
              </div>
              <Button size="lg" className="h-14 px-8 bg-accent hover:bg-accent/90">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Popular Categories</h2>
            <Button variant="ghost" asChild>
              <Link to="/browse">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((category, index) => (
              <CategoryCard
                key={category.name}
                title={category.name}
                icon={categoryIcons[index].icon}
                color={categoryIcons[index].color}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Popular Services</h2>
            <p className="text-muted-foreground">
              Most popular services by our top sellers
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service._id}
                _id={service._id}
                title={service.title}
                price={service.price}
                category={service.category}
                imageUrl={service.imageUrl}
                walletAddress={service.walletAddress}
                profile={service.profile}
                sellerLevel="Seller"
                rating={service.averageRating || 0} // Mock rating for now -> Real rating
                reviews={service.totalReviews || 0} // Mock reviews for now -> Real reviews
              />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button size="lg" asChild>
              <Link to="/browse">
                Browse All Services <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-12 text-center text-primary-foreground">
            <h2 className="mb-4 text-4xl font-bold">
              Ready to get started?
            </h2>
            <p className="mb-8 text-xl opacity-90">
              Join millions of people who use our platform to turn their ideas into reality
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90" asChild>
                <Link to="/profile">Become a Seller</Link>
              </Button>
              <Button size="lg" className="bg-accent hover:bg-accent/90" asChild>
                <Link to="/browse">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-bold">Categories</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Graphics & Design</li>
                <li>Digital Marketing</li>
                <li>Writing & Translation</li>
                <li>Video & Animation</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold">About</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Careers</li>
                <li>Press & News</li>
                <li>Partnerships</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help & Support</li>
                <li>Trust & Safety</li>
                <li>Selling</li>
                <li>Buying</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Events</li>
                <li>Blog</li>
                <li>Forum</li>
                <li>Affiliates</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 SkillHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
