import React, { useState, useEffect } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapEmbed } from "./components/MapEmbed";
import { Watermark } from "./components/Watermark";
import { PlaceDetail } from "./components/PlaceDetail";
import { SkeletonCard } from "./components/SkeletonCard";
import {
  MapPin,
  Navigation,
  Menu,
  Search,
  Layers,
  Settings,
  User,
  ChevronDown,
  ChevronRight,
  Star,
  Heart,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Mock data for locations
const DEFAULT_LOCATIONS = [
  {
    id: 1,
    name: "Torre Eiffel",
    query: "Eiffel Tower, Paris",
    type: "Landmark",
  },
  {
    id: 2,
    name: "Estátua da Liberdade",
    query: "Statue of Liberty, NY",
    type: "Landmark",
  },
  {
    id: 3,
    name: "Cristo Redentor",
    query: "Christ the Redeemer, Rio de Janeiro",
    type: "Landmark",
  },
  { id: 4, name: "Coliseu", query: "Colosseum, Rome", type: "Landmark" },
  { id: 5, name: "Taj Mahal", query: "Taj Mahal, India", type: "Landmark" },
];

interface LocationItem {
  id: number | string;
  name: string;
  query: string;
  type: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  photoUrl?: string;
}

const CATEGORIES = [
  { id: "tourist_attraction", label: "Turismo", icon: "📷" },
  { id: "restaurant", label: "Restaurantes", icon: "🍽️" },
  { id: "bar", label: "Bares", icon: "🍺" },
  { id: "lodging", label: "Hotéis", icon: "🏨" },
  { id: "store", label: "Comércio", icon: "🛍️" },
];

export default function App() {
  const [destinations, setDestinations] =
    useState<LocationItem[]>(DEFAULT_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem>(
    DEFAULT_LOCATIONS[0],
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [minDistance, setMinDistance] = useState(0);
  const [maxDistance, setMaxDistance] = useState(5000);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [isDistanceFilterOpen, setIsDistanceFilterOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState("tourist_attraction");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceFilter, setPriceFilter] = useState<string[]>([]);

  // In a real app, this would come from import.meta.env.VITE_GOOGLE_MAPS_PLACES_API_KEY
  // For this demo, we'll simulate the check.
  // Note: Since we can't easily set env vars in this preview without user action,
  // we will pass undefined to trigger the placeholder UI, or the user can edit .env
  const placesApiKey = import.meta.env.VITE_GOOGLE_MAPS_PLACES_API_KEY;
  const mapEmbedApiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KE || "";

  const toggleFavorite = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    const idStr = String(id);
    setFavorites((prev) =>
      prev.includes(idStr)
        ? prev.filter((favId) => favId !== idStr)
        : [...prev, idStr],
    );
  };

  useEffect(() => {
    // Load favorites from local storage on mount
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    // Save favorites to local storage whenever they change
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    // Check for query params on load to handle shared links
    const params = new URLSearchParams(window.location.search);
    const sharedLat = params.get("lat");
    const sharedLng = params.get("lng");
    const sharedQuery = params.get("q");
    const sharedName = params.get("name");

    if (sharedLat && sharedLng) {
      const lat = parseFloat(sharedLat);
      const lng = parseFloat(sharedLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const newLoc = {
          id: "shared-loc",
          name: sharedName || "Localização Compartilhada",
          query: `${lat},${lng}`,
          type: "Localização Compartilhada",
          photoUrl: undefined,
        };
        setSelectedLocation(newLoc);
        // Also set as user location center for map context if desired,
        // but usually we just want to show the pin.
        // If we want to center the map, we might need to update map center state if it existed,
        // but MapEmbed uses 'query' so it should center on the query.
      }
    } else if (sharedQuery) {
      const newLoc = {
        id: "shared-place",
        name: sharedName || sharedQuery,
        query: sharedQuery,
        type: "Local Compartilhado",
        photoUrl: undefined,
      };
      setSelectedLocation(newLoc);
      setShowDetail(true);
    }
  }, []);

  useEffect(() => {
    if (!userLocation || !placesApiKey) return;

    const fetchCityName = async () => {
      try {
        if (!placesApiKey) return;
        setOptions({ key: placesApiKey, v: "weekly" });
        const { Geocoder } = (await importLibrary("geocoding")) as any;
        const geocoder = new Geocoder();

        geocoder.geocode(
          { location: userLocation },
          (results: any, status: any) => {
            if (status === "OK" && results[0]) {
              const addressComponents = results[0].address_components;
              let cityName = "";

              // Prioritize administrative_area_level_2 (City/Municipality) or locality
              const cityComponent = addressComponents.find(
                (component: any) =>
                  component.types.includes("administrative_area_level_2") ||
                  component.types.includes("locality"),
              );

              if (cityComponent) {
                cityName = cityComponent.long_name;
              } else {
                cityName = results[0].formatted_address.split(",")[0];
              }

              setUserCity(cityName);

              // Update selected location name if it's currently the generic "Minha Localização"
              setSelectedLocation((prev) => {
                if (prev.id === 999) {
                  return { ...prev, name: cityName };
                }
                return prev;
              });
            }
          },
        );
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    };

    fetchCityName();
  }, [userLocation, placesApiKey]);

  useEffect(() => {
    if (!userLocation || !placesApiKey) return;

    const fetchNearbyPlaces = async () => {
      setIsLoadingPlaces(true);
      try {
        if (!placesApiKey) {
          console.error(
            "Google Maps API Key is missing. Please set VITE_GOOGLE_MAPS_PLACES_API_KEY in .env",
          );
          setIsLoadingPlaces(false);
          return;
        }

        setOptions({
          key: placesApiKey,
          v: "weekly",
        });

        const { Place } = (await importLibrary("places")) as any;
        const { spherical } = (await importLibrary("geometry")) as any;
        await importLibrary("marker");

        // Ensure google is available globally
        if (typeof google === "undefined" || !google.maps) {
          console.error("Google Maps API not loaded correctly");
          setIsLoadingPlaces(false);
          return;
        }

        // Use the new Places API (Place.searchNearby)
        const userLatLng = new google.maps.LatLng(
          userLocation.lat,
          userLocation.lng,
        );

        const request = {
          fields: [
            "displayName",
            "location",
            "formattedAddress",
            "types",
            "id",
            "rating",
            "userRatingCount",
            "priceLevel",
            "photos",
          ],
          locationRestriction: {
            center: userLatLng,
            radius: maxDistance,
          },
          includedPrimaryTypes: [selectedCategory],
          maxResultCount: 20,
        };

        const { places } = await Place.searchNearby(request);

        if (places && places.length > 0) {
          const userLatLng = new google.maps.LatLng(
            userLocation.lat,
            userLocation.lng,
          );

          const newDestinations = places
            .filter((place: any) => {
              // Distance Filter
              if (!place.location) return true;
              const distance = spherical.computeDistanceBetween(
                userLatLng,
                place.location,
              );
              if (distance < minDistance) return false;

              // Rating Filter
              if (minRating > 0 && (!place.rating || place.rating < minRating))
                return false;

              // Price Filter
              // priceLevel is usually "PRICE_LEVEL_INEXPENSIVE", etc. or mapped to symbols.
              // The API returns "PRICE_LEVEL_..." strings or undefined.
              // We will map the UI to the API values if needed, or just check existence for now.
              // For simplicity in this demo, let's assume we filter by existence if any price selected
              // or match specific levels if we had them mapped.
              // Let's assume priceFilter contains ["PRICE_LEVEL_INEXPENSIVE", ...]
              if (
                priceFilter.length > 0 &&
                (!place.priceLevel || !priceFilter.includes(place.priceLevel))
              )
                return false;

              return true;
            })
            .map((place: any) => ({
              id: place.id,
              name: place.displayName,
              query: place.formattedAddress || place.displayName,
              type: place.types?.[0]?.replace(/_/g, " ") || "Place",
              rating: place.rating,
              userRatingCount: place.userRatingCount,
              priceLevel: place.priceLevel,
              photoUrl:
                place.photos && place.photos.length > 0
                  ? place.photos[0].getURI({ maxWidth: 400 })
                  : undefined,
            }));

          // Client-side search filter
          const filteredDestinations = searchTerm
            ? newDestinations.filter((d: any) =>
                d.name.toLowerCase().includes(searchTerm.toLowerCase()),
              )
            : newDestinations;

          setDestinations(filteredDestinations);
        } else {
          console.warn("Places search returned no results");
          setDestinations([]);
        }
        setIsLoadingPlaces(false);
      } catch (error) {
        console.error(
          "Error loading Google Maps API or fetching places:",
          error,
        );
        setIsLoadingPlaces(false);
      }
    };

    fetchNearbyPlaces();
  }, [
    userLocation,
    placesApiKey,
    minDistance,
    maxDistance,
    selectedCategory,
    minRating,
    priceFilter,
    searchTerm,
  ]);

  const handleGetLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLoadingLocation(false);
        setSelectedLocation({
          id: 999,
          name: "Minha Localização",
          query: `${latitude},${longitude}`,
          type: "Local Atual",
        });
      },
      (error) => {
        setLocationError("Erro ao obter localização");
        setIsLoadingLocation(false);
        console.error(error);
      },
    );
  };

  const handleLocationSelect = (loc: LocationItem) => {
    setSelectedLocation(loc);
    setIsSidebarOpen(false);
    if (loc.id !== 999) {
      setShowDetail(true);
    }
  };

  // In a real app, this would come from import.meta.env.VITE_GOOGLE_MAPS_PLACES_API_KEY

  const handleShareLocation = () => {
    if (!userLocation) return;

    const url = `${window.location.origin}?lat=${userLocation.lat}&lng=${userLocation.lng}&name=${encodeURIComponent(userCity || "Minha Localização")}`;

    if (navigator.share) {
      navigator
        .share({
          title: "Minha Localização",
          text: `Estou aqui: ${userCity || "Minha Localização"}`,
          url: url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 transform lg:transform-none transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <MapPin className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Indicai
              </h1>
            </div>
            <div className="mt-2 pl-11">
              {userLocation ? (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {userCity ||
                      `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                  </div>
                  <button
                    onClick={handleShareLocation}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Compartilhar localização"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGetLocation}
                  disabled={isLoadingLocation}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  {isLoadingLocation
                    ? "Localizando..."
                    : "Detectar minha localização"}
                </button>
              )}
              {locationError && (
                <div className="text-xs text-red-500 mt-1">{locationError}</div>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {userLocation && (
              <div className="mt-4 space-y-4">
                {/* Distance Filter */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <button
                    onClick={() =>
                      setIsDistanceFilterOpen(!isDistanceFilterOpen)
                    }
                    className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 hover:text-gray-600 transition-colors"
                  >
                    <span>Filtros</span>
                    {isDistanceFilterOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {isDistanceFilterOpen && (
                    <div className="space-y-4">
                      {/* Distance */}
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-medium mb-2">
                          Distância (km)
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <input
                              type="number"
                              min="0"
                              max={maxDistance / 1000}
                              step="0.1"
                              value={minDistance / 1000}
                              onChange={(e) =>
                                setMinDistance(
                                  Math.max(0, Number(e.target.value) * 1000),
                                )
                              }
                              className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-500"
                              placeholder="Min"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="number"
                              min={minDistance / 1000}
                              max="50"
                              step="0.1"
                              value={maxDistance / 1000}
                              onChange={(e) =>
                                setMaxDistance(
                                  Math.min(
                                    50000,
                                    Number(e.target.value) * 1000,
                                  ),
                                )
                              }
                              className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-500"
                              placeholder="Max"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-medium mb-2">
                          Avaliação Mínima
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() =>
                                setMinRating(star === minRating ? 0 : star)
                              }
                              className={`p-1 rounded hover:bg-gray-100 transition-colors ${minRating >= star ? "text-yellow-400" : "text-gray-300"}`}
                            >
                              <Star className="w-5 h-5 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price */}
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-medium mb-2">
                          Preço
                        </div>
                        <div className="flex gap-2">
                          {[
                            { label: "$", val: "PRICE_LEVEL_INEXPENSIVE" },
                            { label: "$$", val: "PRICE_LEVEL_MODERATE" },
                            { label: "$$$", val: "PRICE_LEVEL_EXPENSIVE" },
                            {
                              label: "$$$$",
                              val: "PRICE_LEVEL_VERY_EXPENSIVE",
                            },
                          ].map((price) => (
                            <button
                              key={price.val}
                              onClick={() => {
                                setPriceFilter((prev) =>
                                  prev.includes(price.val)
                                    ? prev.filter((p) => p !== price.val)
                                    : [...prev, price.val],
                                );
                              }}
                              className={`flex-1 py-1 text-xs font-medium rounded border transition-colors ${
                                priceFilter.includes(price.val)
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {price.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        selectedCategory === cat.id
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between items-center">
              <span>
                {userLocation ? "Perto de Você" : "Destinos Populares"}
              </span>
              {isLoadingPlaces && (
                <span className="text-xs text-indigo-500">Atualizando...</span>
              )}
            </div>

            {isLoadingPlaces && destinations.length === 0
              ? // Show skeletons while loading initial data
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : destinations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleLocationSelect(loc)}
                    className={`w-full flex flex-col gap-2 px-3 py-3 rounded-xl text-sm transition-all border ${
                      selectedLocation.id === loc.id
                        ? "bg-indigo-50 border-indigo-100 shadow-sm"
                        : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-100"
                    }`}
                  >
                    {/* ... (Card content) ... */}
                    <div className="flex items-start gap-3 w-full">
                      {/* Image or Placeholder */}
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden relative">
                        {loc.photoUrl ? (
                          <img
                            src={loc.photoUrl}
                            alt={loc.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <MapPin className="w-6 h-6 opacity-50" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-start">
                          <div className="font-semibold text-gray-900 truncate pr-2">
                            {loc.name}
                          </div>
                          <div
                            onClick={(e) => toggleFavorite(e, loc.id)}
                            className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${favorites.includes(String(loc.id)) ? "text-red-500" : "text-gray-300"}`}
                          >
                            <Heart
                              className={`w-4 h-4 ${favorites.includes(String(loc.id)) ? "fill-current" : ""}`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs font-medium text-gray-700">
                            {loc.rating || "N/A"}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({loc.userRatingCount || 0})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="text-xs text-gray-500 truncate capitalize bg-gray-100 px-1.5 py-0.5 rounded">
                            {loc.type}
                          </div>
                          {loc.priceLevel && (
                            <div className="text-xs text-green-600 font-medium">
                              {loc.priceLevel}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
          </div>

          <div className="p-4 border-t border-gray-100 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
              <Settings className="w-4 h-4" />
              Configurações
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
              <User className="w-4 h-4" />
              Perfil
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedLocation.name}
              </h2>
              <p className="text-sm text-gray-500 hidden sm:block">
                {selectedLocation.type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-indigo-600 transition-colors">
              <Navigation className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-indigo-600 transition-colors">
              <Layers className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Map Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-hidden relative">
          <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
            <MapEmbed query={selectedLocation.query} apiKey={mapEmbedApiKey} />
            <Watermark text="GeoExplorer" opacity={0.08} />

            {/* Floating Action Button (Mobile style) */}
            <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center">
                <Navigation className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Place Detail Overlay */}
          <AnimatePresence>
            {showDetail && selectedLocation.id !== 999 && (
              <PlaceDetail
                location={selectedLocation}
                onClose={() => setShowDetail(false)}
                isFavorite={favorites.includes(String(selectedLocation.id))}
                onToggleFavorite={(e) => toggleFavorite(e, selectedLocation.id)}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
