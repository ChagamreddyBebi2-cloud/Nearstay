import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Mic } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./NearbyLocations.css";

// --------------------
// Leaflet default icon
// --------------------
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// --------------------
// Category icons
// --------------------
const createIcon = (emoji, background = "#ffffff") =>
  L.divIcon({
    className: "category-marker",
    html: `
      <div style="
        width:38px;
        height:38px;
        border-radius:50%;
        background:${background};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:21px;
        border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
      ">
        ${emoji}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });

// Selected location
const selectedLocationIcon = createIcon("📍", "#f3d7bd");

// Category icons
const categoryIcons = {
  stay: createIcon("🏨", "#fff3e6"),
  restaurant: createIcon("🍴", "#fff0d9"),
  hospital: createIcon("🏥", "#ffe5e5"),
  police: createIcon("🚓", "#e7f0ff"),
  bus: createIcon("🚌", "#e8f7ed"),
  supermarket: createIcon("🛒", "#fff8d9"),
  tourist: createIcon("📸", "#f1e8ff"),
};

// --------------------
// Voice announcement
// --------------------
function speakLocation(locationName) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();

    const message = new SpeechSynthesisUtterance(
      `You are in ${locationName}`
    );

    message.lang = "en-IN";
    message.rate = 0.9;
    message.pitch = 1;

    window.speechSynthesis.speak(message);
  }
}

// --------------------
// Get short location name
// --------------------
function getShortLocationName(place) {
  const address = place.address || {};

  return (
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.suburb ||
    address.county ||
    place.name ||
    "this location"
  );
}

// --------------------
// Location Search
// --------------------
function LocationSearch({
  setUserLocation,
  setSelectedLocationName,
}) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const searchPlaces = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          value
        )}&limit=5`
      );

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Location search error:", error);
    }
  };

  const selectLocation = (place) => {
    const lat = Number(place.lat);
    const lon = Number(place.lon);

    const locationName = getShortLocationName(place);

    setUserLocation([lat, lon]);
    setSelectedLocationName(locationName);

    setSearch(locationName);
    setSuggestions([]);

    speakLocation(locationName);
  };

  // --------------------
  // Voice Search
  // --------------------
  const startVoiceSearch = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);

    recognition.onresult = async (event) => {
      const spokenText =
        event.results[0][0].transcript;

      setSearch(spokenText);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            spokenText
          )}&limit=1`
        );

        const data = await response.json();

        if (data.length > 0) {
          selectLocation(data[0]);
        } else {
          alert("Location not found.");
        }
      } catch (error) {
        console.error(error);
      }

      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert("Unable to understand the location.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="location-search-container">
      <div className="location-search">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={search}
            placeholder="Search a location..."
            onChange={(e) =>
              searchPlaces(e.target.value)
            }
          />

          <button
            type="button"
            className={`voice-button ${
              isListening ? "listening" : ""
            }`}
            onClick={startVoiceSearch}
            title="Voice Search"
          >
            <Mic size={22} strokeWidth={2} />
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="location-suggestions">
            {suggestions.map((place, index) => {
              const name =
                getShortLocationName(place);

              const state =
                place.address?.state;

              const country =
                place.address?.country;

              return (
                <div
                  key={index}
                  className="location-suggestion"
                  onClick={() =>
                    selectLocation(place)
                  }
                >
                  <span>📍 {name}</span>

                  <small>
                    {state
                      ? `, ${state}`
                      : ""}
                    {country
                      ? `, ${country}`
                      : ""}
                  </small>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------
// My Location
// --------------------
function LocationButton({
  setUserLocation,
  setSelectedLocationName,
}) {
  const handleLocation = () => {
    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserLocation(location);
        setSelectedLocationName(
          "Your Location"
        );

        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();

          const message =
            new SpeechSynthesisUtterance(
              "You are here"
            );

          message.lang = "en-IN";
          message.rate = 0.9;

          window.speechSynthesis.speak(message);
        }
      },
      () => {
        alert("Unable to get your location.");
      }
    );
  };

  return (
    <button
      className="location-button"
      onClick={handleLocation}
    >
      Use My Location
    </button>
  );
}

// --------------------
// Move map
// --------------------
function MapLocationUpdater({
  userLocation,
}) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 14, {
        animate: true,
      });
    }
  }, [userLocation, map]);

  return null;
}

// --------------------
// Main Component
// --------------------
function NearbyLocations() {
  const [userLocation, setUserLocation] =
    useState(null);

  const [
    selectedLocationName,
    setSelectedLocationName,
  ] = useState("");

  const [places, setPlaces] = useState([]);

  const [loadingPlaces, setLoadingPlaces] =
    useState(false);

  const [placesError, setPlacesError] =
    useState("");

  // --------------------
  // Fetch nearby places
  // --------------------
  useEffect(() => {
    if (!userLocation) return;

    const fetchNearbyPlaces = async () => {
      setLoadingPlaces(true);
      setPlacesError("");

      const [lat, lon] = userLocation;

      const query = `
        [out:json];
        (
          node["tourism"="hotel"](around:3000,${lat},${lon});
          node["tourism"="hostel"](around:3000,${lat},${lon});
          node["tourism"="guest_house"](around:3000,${lat},${lon});
          node["tourism"="motel"](around:3000,${lat},${lon});

          node["amenity"="restaurant"](around:3000,${lat},${lon});
          node["amenity"="hospital"](around:3000,${lat},${lon});
          node["amenity"="police"](around:3000,${lat},${lon});
          node["amenity"="bus_station"](around:3000,${lat},${lon});

          node["shop"="supermarket"](around:3000,${lat},${lon});

          node["tourism"="attraction"](around:3000,${lat},${lon});
        );

        out;
      `;

      try {
        const response = await fetch(
          "https://overpass-api.de/api/interpreter",
          {
            method: "POST",
            body: query,
          }
        );

        const data = await response.json();

        const formattedPlaces = data.elements
          .map((item) => {
            const placeLat = item.lat;
            const placeLon = item.lon;

            if (!placeLat || !placeLon)
              return null;

            let type = "Place";
            let icon = categoryIcons.tourist;

            if (
              item.tags?.tourism === "hotel" ||
              item.tags?.tourism === "hostel" ||
              item.tags?.tourism ===
                "guest_house" ||
              item.tags?.tourism === "motel"
            ) {
              type = "Hotel / Stay";
              icon = categoryIcons.stay;
            } else if (
              item.tags?.amenity ===
              "restaurant"
            ) {
              type = "Restaurant";
              icon =
                categoryIcons.restaurant;
            } else if (
              item.tags?.amenity === "hospital"
            ) {
              type = "Hospital";
              icon =
                categoryIcons.hospital;
            } else if (
              item.tags?.amenity === "police"
            ) {
              type = "Police";
              icon = categoryIcons.police;
            } else if (
              item.tags?.amenity ===
              "bus_station"
            ) {
              type = "Bus Station";
              icon = categoryIcons.bus;
            } else if (
              item.tags?.shop === "supermarket"
            ) {
              type = "Supermarket";
              icon =
                categoryIcons.supermarket;
            } else if (
              item.tags?.tourism ===
              "attraction"
            ) {
              type =
                "Tourist Attraction";
              icon =
                categoryIcons.tourist;
            }

            return {
              id: item.id,
              lat: placeLat,
              lon: placeLon,
              name:
                item.tags?.name ||
                "Unnamed Place",
              type,
              icon,
            };
          })
          .filter(Boolean);

        // Limit places so map stays clean
        setPlaces(
          formattedPlaces.slice(0, 40)
        );
      } catch (error) {
        console.error(error);

        setPlacesError(
          "Unable to load nearby places."
        );
      } finally {
        setLoadingPlaces(false);
      }
    };

    fetchNearbyPlaces();
  }, [userLocation]);

  return (
    <div className="nearby-page">

      <div className="nearby-header">
        <h1>Nearby Locations</h1>

        <p>
          Search any location and discover
          nearby stays, restaurants and useful
          places.
        </p>
      </div>

      <LocationSearch
        setUserLocation={setUserLocation}
        setSelectedLocationName={
          setSelectedLocationName
        }
      />

      {selectedLocationName && (
        <div className="selected-location-name">
          📍 {selectedLocationName}
        </div>
      )}

      {loadingPlaces && (
        <p className="places-status">
          Loading nearby places...
        </p>
      )}

      {placesError && (
        <p className="places-error">
          {placesError}
        </p>
      )}

      <div className="map-box">

        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={true}
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationButton
            setUserLocation={
              setUserLocation
            }
            setSelectedLocationName={
              setSelectedLocationName
            }
          />

          <MapLocationUpdater
            userLocation={userLocation}
          />

          {/* Selected location */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={selectedLocationIcon}
            >
              <Popup>
                <strong>
                  {selectedLocationName ||
                    "Selected Location"}
                </strong>
              </Popup>
            </Marker>
          )}

          {/* Nearby places */}
          {places.map((place) => (
            <Marker
              key={`${place.id}-${place.lat}-${place.lon}`}
              position={[
                place.lat,
                place.lon,
              ]}
              icon={place.icon}
            >
              <Popup>

                <div className="place-popup">

                  <h3>
                    {place.name}
                  </h3>

                  <p>
                    {place.type}
                  </p>

                  {place.type ===
                    "Hotel / Stay" && (
                    <button
                      onClick={() => {
                        window.location.href =
                          "/hotel-details";
                      }}
                    >
                      View Details
                    </button>
                  )}

                </div>

              </Popup>
            </Marker>
          ))}

        </MapContainer>

      </div>
    </div>
  );
}

export default NearbyLocations;