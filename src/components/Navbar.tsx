import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Menu } from "lucide-react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton.tsx";
import { useWalletAccount } from "@/hooks/useWalletAccount";
import { useState, useEffect, useRef } from "react";
import { IServiceCard } from "@/types/service";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const { isConnected } = useWalletAccount();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<IServiceCard[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/services?search=${debouncedQuery}&limit=5`);
        const data = await res.json();
        if (data.services) setResults(data.services);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [debouncedQuery, API_BASE_URL]);

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (id: string) => {
    setShowResults(false);
    setQuery("");
    navigate(`/service/${id}`);
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">skillhub</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for services..."
                className="pl-10"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />

              {/* Search Results Dropdown */}
              {showResults && (query.length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-md border shadow-md overflow-hidden z-50">
                  {loading ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">Loading...</div>
                  ) : results.length > 0 ? (
                    <div className="py-2">
                      {results.map((service) => (
                        <div
                          key={service._id}
                          className="px-4 py-2 hover:bg-accent cursor-pointer flex items-center gap-3 transition-colors"
                          onClick={() => handleResultClick(service._id)}
                        >
                          <div className="h-10 w-10 shrink-0 rounded overflow-hidden bg-muted">
                            <img src={service.imageUrl} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{service.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">by {service.profile?.name || "User"}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium text-foreground">{service.averageRating?.toFixed(1) || "0.0"}</span>
                                <span className="text-muted-foreground">({service.totalReviews || 0})</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-bold">${service.price}</span>
                        </div>
                      ))}
                      <div className="border-t mt-2 pt-2 px-2">
                        <Button variant="ghost" className="w-full text-xs h-8" asChild onClick={() => setShowResults(false)}>
                          <Link to={`/browse?search=${query}`}>
                            View all results for "{query}"
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-center text-muted-foreground">No services found.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/ai" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50">
                AI Agents
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/top-sellers">Top Sellers</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/profile">Profile</Link>
            </Button>
            {isConnected && (
              <Button variant="outline" asChild>
                <Link to="/createservice">Offer Service</Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/browse">Get Started</Link>
            </Button>
            <div className="ml-2">
              <ConnectWalletButton />
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader className="text-left mb-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4">
                  {/* Mobile Search - Simplified version without dropdown for now, or just link to browse */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      className="pl-10"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          navigate(`/browse?search=${query}`);
                        }
                      }}
                    />
                  </div>

                  <Link to="/browse" className="text-lg font-medium hover:text-primary transition-colors">Browse</Link>
                  <Link to="/ai" className="text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">AI Agents</Link>
                  <Link to="/top-sellers" className="text-lg font-medium hover:text-primary transition-colors">Top Sellers</Link>
                  <Link to="/profile" className="text-lg font-medium hover:text-primary transition-colors">Profile</Link>
                  {isConnected && (
                    <Link to="/createservice" className="text-lg font-medium hover:text-primary transition-colors">Offer Service</Link>
                  )}

                  <div className="h-px bg-border my-2" />

                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full justify-start">
                      <Link to="/browse">Get Started</Link>
                    </Button>
                    <div className="w-full">
                      <ConnectWalletButton />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
