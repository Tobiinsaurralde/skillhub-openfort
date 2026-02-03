
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, Heart } from "lucide-react";
import { IServiceCard } from "@/types/service";
import { useFavorites } from "@/hooks/useFavorites";

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);

  // Advanced Filters State
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);

  const { favorites } = useFavorites();

  const [services, setServices] = useState<IServiceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          search: debouncedSearch,
          category: category,
          sortBy: sortBy,
          minPrice: priceRange[0].toString(),
          maxPrice: priceRange[1].toString(),
        });

        if (showFavorites) {
          if (favorites.length === 0) {
            setServices([]);
            setTotalPages(1);
            setTotalServices(0);
            setLoading(false);
            return;
          }
          queryParams.append("ids", favorites.join(","));
        }

        if (minRating > 0) {
          queryParams.append("minRating", minRating.toString());
        }

        const res = await fetch(`${API_BASE_URL}/api/services?${queryParams}`);
        const data = await res.json();

        if (data.services) {
          setServices(data.services);
          setTotalPages(data.pages);
          setTotalServices(data.total);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [debouncedSearch, category, page, API_BASE_URL, sortBy, priceRange, minRating, showFavorites, favorites]);

  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam && catParam !== category) {
      setCategory(catParam);
    } else if (!catParam && category !== "All") {
      setCategory("All");
    }
  }, [searchParams]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (newCategory === "All") {
        newParams.delete("category");
      } else {
        newParams.set("category", newCategory);
      }
      return newParams;
    });
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold">Browse Services</h1>
            <p className="text-muted-foreground">
              Explore thousands of services from talented freelancers
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="relevance" value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="rating">Best Rating</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto relative">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                  {(priceRange[0] > 0 || priceRange[1] < 1000 || minRating > 0) && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Price Range</h4>
                    <p className="text-sm text-muted-foreground">
                      ${priceRange[0]} - ${priceRange[1]}
                    </p>
                    <Slider
                      defaultValue={[0, 1000]}
                      max={1000}
                      step={10}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="py-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Minimum Rating</h4>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5].map((rating) => (
                        <Button
                          key={rating}
                          variant={minRating === rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMinRating(rating)}
                          className="flex-1"
                        >
                          {rating === 0 ? "Any" : `${rating}+`}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Favorites</h4>
                    <Button
                      variant={showFavorites ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setShowFavorites(!showFavorites)}
                    >
                      <Heart className={`mr-2 h-4 w-4 ${showFavorites ? "fill-current" : ""}`} />
                      {showFavorites ? "Showing Favorites Only" : "Show Favorites Only"}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPriceRange([0, 1000]);
                      setMinRating(0);
                      setShowFavorites(false);
                    }}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Favorites Toggle (Quick Access) */}
        <div className="mb-4">
          <Button
            variant={showFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavorites(!showFavorites)}
            className="gap-2"
          >
            <Heart className={`h-4 w-4 ${showFavorites ? "fill-current" : ""}`} />
            My Favorites
          </Button>
        </div>

        {/* Category Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            "All",
            "Logo Design",
            "Web Development",
            "Content Writing",
            "Video Editing",
            "Social Media",
            "Voice Over",
          ].map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Results */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {services.length} of {totalServices} results
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-96 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((service: IServiceCard) => (
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
                  rating={service.averageRating || 0}
                  reviews={service.totalReviews || 0}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Previous
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Browse;
