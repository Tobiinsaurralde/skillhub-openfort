import { useState, useEffect, useCallback } from "react";
import { useWalletAccount } from "./useWalletAccount";

export const useFavorites = () => {
    const { user, isConnected } = useWalletAccount();
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

    const fetchFavorites = useCallback(async () => {
        if (!user || !isConnected) {
            setFavorites([]);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/profile/${user}`);
            if (res.ok) {
                const data = await res.json();
                // Ensure we get an array of IDs
                if (data.profile && data.profile.favorites) {
                    // If population happened, map to IDs, otherwise assume strings
                    const favs = data.profile.favorites.map((f: any) =>
                        typeof f === 'string' ? f : f._id
                    );
                    setFavorites(favs);
                }
            }
        } catch (error) {
            console.error("Error fetching favorites:", error);
        }
    }, [user, isConnected, API_BASE_URL]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const toggleFavorite = async (serviceId: string) => {
        if (!user || !isConnected) return;

        // Optimistic update
        const isFav = favorites.includes(serviceId);
        setFavorites(prev => isFav ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);

        try {
            const res = await fetch(`${API_BASE_URL}/api/profile/favorites/${user}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serviceId }),
            });

            if (!res.ok) {
                // Revert on failure
                setFavorites(prev => isFav ? [...prev, serviceId] : prev.filter(id => id !== serviceId));
                console.error("Failed to toggle favorite");
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            // Revert on failure
            setFavorites(prev => isFav ? [...prev, serviceId] : prev.filter(id => id !== serviceId));
        }
    };

    return { favorites, toggleFavorite, loading };
};
