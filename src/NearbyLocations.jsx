import { useState, useEffect } from "react";
import { Mic } from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import "./NearbyLocations.css";

// ----------------------------------
// Fix Leaflet marker icons
// ----------------------------------

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

// ----------------------------------
// Voice Helper
// ----------------------------------

function speakLocation(locationName) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const speech = new SpeechSynthesisUtterance(
    `You are in ${locationName}`
  );

  speech.lang = "en-IN";
  speech.rate = 0.9;
  speech.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

// ----------------------------------
// Get Short Location Name
// ----------------------------------

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

// ----------------------------------
// Use My Location Button
// ----------------------------------

function LocationButton({
  setUserLocation,
  setSelectedLocationName
}) {
  const map = useMap();

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = [
          position.coords.latitude,
          position.coords.longitude
        ];

        setUserLocation(userLocation);

        setSelectedLocationName("Your Location");

        map.setView(
          userLocation,
          15,
          {
            animate: true
          }
        );

        if ("speechSynthesis" in window) {
          const speech =
            new SpeechSynthesisUtterance(
              "You are here"
            );

          speech.lang = "en-IN";
          speech.rate = 0.9;

          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(
            speech
          );
        }
      },

      () => {
        alert(
          "Unable to get your location."
        );
      }
    );
  };

  return (
    <button
      className="location-button"
      onClick={getLocation}
    >
      📍 Use My Location
    </button>
  );
}

// ----------------------------------
// Location Search
// ----------------------------------

function LocationSearch({
  setUserLocation,
  setSelectedLocationName
}) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] =
    useState([]);

  const [isListening, setIsListening] =
    useState(false);

  // ----------------------------------
  // Search Places
  // ----------------------------------

  const searchPlaces = async (value) => {
    setSearch(value);

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          value
        )}&limit=5`
      );

      if (!response.ok) {
        throw new Error(
          "Location search failed"
        );
      }

      const data =
        await response.json();

      setSuggestions(data);
    } catch (error) {
      console.log(
        "Location search error:",
        error
      );

      setSuggestions([]);
    }
  };

  // ----------------------------------
  // Select Location
  // ----------------------------------

  const selectLocation = (place) => {
    const latitude =
      parseFloat(place.lat);

    const longitude =
      parseFloat(place.lon);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return;
    }

    const location = [
      latitude,
      longitude
    ];

    const locationName =
      getShortLocationName(place);

    setUserLocation(location);

    setSelectedLocationName(
      locationName
    );

    // Show only useful location name
    setSearch(locationName);

    setSuggestions([]);

    // Voice announcement
    speakLocation(locationName);
  };

  // ----------------------------------
  // Voice Search
  // ----------------------------------

  const startVoiceSearch = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice search is not supported in this browser."
      );
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (
      event
    ) => {
      const voiceText =
        event.results[0][0].transcript;

      setSearch(voiceText);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            voiceText
          )}&limit=1`
        );

        const data =
          await response.json();

        if (data.length > 0) {
          selectLocation(data[0]);
        } else {
          setSuggestions([]);
          alert(
            "Location not found. Please try again."
          );
        }
      } catch (error) {
        console.log(
          "Voice location search error:",
          error
        );
      }
    };

    recognition.onerror = (event) => {
      console.log(
        "Voice search error:",
        event.error
      );

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // ----------------------------------
  // Search Box UI
  // ----------------------------------

  return (
    <div className="location-search">

      <div className="search-input-wrapper">

        <input
          type="text"
          placeholder="Search location..."
          value={search}
          onChange={(e) =>
            searchPlaces(
              e.target.value
            )
          }
        />

        <button
          type="button"
          className={`voice-button ${
            isListening
              ? "listening"
              : ""
          }`}
          onClick={
            startVoiceSearch
          }
          title="Voice Search"
        >
          <Mic size={22} strokeWidth={2} />
        </button>

      </div>

      {suggestions.length > 0 && (
        <div className="location-suggestions">

          {suggestions.map(
            (place) => {

              const name =
                getShortLocationName(
                  place
                );

              const state =
                place.address?.state;

              const country =
                place.address?.country;

              return (
                <div
                  key={
                    place.place_id
                  }
                  className="location-suggestion"
                  onClick={() =>
                    selectLocation(
                      place
                    )
                  }
                >

                  <span>
                    📍 {name}
                  </span>

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
            }
          )}

        </div>
      )}

    </div>
  );
}

// ----------------------------------
// Move Map when Location Changes
// ----------------------------------

function MapLocationUpdater({
  userLocation
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    map.setView(
      userLocation,
      15,
      {
        animate: true
      }
    );
  }, [
    userLocation,
    map
  ]);

  return null;
}

// ----------------------------------
// Nearby Locations Page
// ----------------------------------

function NearbyLocations() {
  const [userLocation, setUserLocation] =
    useState(null);

  const [
    selectedLocationName,
    setSelectedLocationName
  ] = useState("");

  const [places, setPlaces] =
    useState([]);

  const [loadingPlaces, setLoadingPlaces] =
    useState(false);

  const [placesError, setPlacesError] =
    useState("");

  // ----------------------------------
  // Fetch Real Nearby Places
  // ----------------------------------

  const fetchNearbyPlaces = async (
    latitude,
    longitude
  ) => {
    setLoadingPlaces(true);
    setPlacesError("");

    const query = `
      [out:json][timeout:25];

      (
        nwr(around:3000,${latitude},${longitude})["tourism"="hotel"];
        nwr(around:3000,${latitude},${longitude})["tourism"="hostel"];
        nwr(around:3000,${latitude},${longitude})["tourism"="guest_house"];
        nwr(around:3000,${latitude},${longitude})["tourism"="motel"];
        nwr(around:3000,${latitude},${longitude})["amenity"="hospital"];
        nwr(around:3000,${latitude},${longitude})["amenity"="police"];
        nwr(around:3000,${latitude},${longitude})["amenity"="restaurant"];
        nwr(around:3000,${latitude},${longitude})["amenity"="bus_station"];
        nwr(around:3000,${latitude},${longitude})["shop"="supermarket"];
        nwr(around:3000,${latitude},${longitude})["tourism"="attraction"];
      );

      out center tags;
    `;

    try {
      const response = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          body: query
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to fetch nearby places"
        );
      }

      const data =
        await response.json();

      const mappedPlaces =
        data.elements
          .map((place) => {

            const latitude =
              place.lat ??
              place.center?.lat;

            const longitude =
              place.lon ??
              place.center?.lon;

            const tags =
              place.tags || {};

            if (
              latitude === undefined ||
              longitude === undefined
            ) {
              return null;
            }

            let type = "Place";
            let icon = "📍";

            if (
              tags.tourism ===
                "hotel" ||
              tags.tourism ===
                "motel"
            ) {
              type = "Hotel";
              icon = "🏨";
            }

            else if (
              tags.tourism ===
              "hostel"
            ) {
              type = "Hostel";
              icon = "🛏️";
            }

            else if (
              tags.tourism ===
              "guest_house"
            ) {
              type =
                "Guest House";
              icon = "🏠";
            }

            else if (
              tags.amenity ===
              "hospital"
            ) {
              type = "Hospital";
              icon = "🏥";
            }

            else if (
              tags.amenity ===
              "police"
            ) {
              type =
                "Police Station";
              icon = "👮";
            }

            else if (
              tags.amenity ===
              "restaurant"
            ) {
              type =
                "Restaurant";
              icon = "🍽️";
            }

            else if (
              tags.amenity ===
              "bus_station"
            ) {
              type =
                "Bus Station";
              icon = "🚌";
            }

            else if (
              tags.shop ===
              "supermarket"
            ) {
              type =
                "Supermarket";
              icon = "🛒";
            }

            else if (
              tags.tourism ===
              "attraction"
            ) {
              type =
                "Tourist Place";
              icon = "📸";
            }

            const address = [
              tags[
                "addr:housenumber"
              ],
              tags[
                "addr:street"
              ],
              tags[
                "addr:city"
              ]
            ]
              .filter(Boolean)
              .join(", ");

            return {
              id: `${place.type}-${place.id}`,

              name:
                tags.name ||
                "Unnamed Place",

              type,

              icon,

              location: [
                latitude,
                longitude
              ],

              address:
                address ||
                "Address not available"
            };
          })
          .filter(Boolean);

      setPlaces(
        mappedPlaces
      );
    }

    catch (error) {
      console.log(
        "Nearby places error:",
        error
      );

      setPlacesError(
        "Unable to load nearby places."
      );

      setPlaces([]);
    }

    finally {
      setLoadingPlaces(false);
    }
  };

  // ----------------------------------
  // Fetch Nearby Places after Location
  // ----------------------------------

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    fetchNearbyPlaces(
      userLocation[0],
      userLocation[1]
    );
  }, [userLocation]);

  // ----------------------------------
  // Page
  // ----------------------------------

  return (
    <div className="nearby-page">

      {/* Header */}

      <div className="nearby-header">

        <h1>
          Nearby Locations
        </h1>

        <p>
          Find stays and useful places near your location.
        </p>

      </div>

      {/* Search */}

      <div className="location-search-container">

        <LocationSearch
          setUserLocation={
            setUserLocation
          }
          setSelectedLocationName={
            setSelectedLocationName
          }
        />

      </div>

      {/* Selected Location Name */}

      {selectedLocationName && (
        <p
          style={{
            textAlign: "center",
            marginBottom: "15px",
            fontWeight: "600"
          }}
        >
          📍 {selectedLocationName}
        </p>
      )}

      {/* Loading */}

      {loadingPlaces && (
        <p
          style={{
            textAlign: "center",
            marginBottom: "15px"
          }}
        >
          🔎 Finding nearby places...
        </p>
      )}

      {/* Error */}

      {placesError && (
        <p
          style={{
            textAlign: "center",
            color: "red",
            marginBottom: "15px"
          }}
        >
          {placesError}
        </p>
      )}

      {/* Map */}

      <div className="map-box">

        <MapContainer
          center={
            userLocation ||
            [20.5937, 78.9629]
          }
          zoom={5}
          scrollWheelZoom={true}
          style={{
            width: "100%",
            height: "100%"
          }}
        >

          {/* Use My Location */}

          <LocationButton
            setUserLocation={
              setUserLocation
            }
            setSelectedLocationName={
              setSelectedLocationName
            }
          />

          {/* Move Map */}

          <MapLocationUpdater
            userLocation={
              userLocation
            }
          />

          {/* OpenStreetMap */}

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Selected Location Marker */}

          {userLocation && (
            <Marker
              position={
                userLocation
              }
            >
              <Popup>
                📍{" "}
                {selectedLocationName ||
                  "Selected Location"}
              </Popup>
            </Marker>
          )}

          {/* Real Nearby Places */}

          {places.map(
            (place) => (
              <Marker
                key={place.id}
                position={
                  place.location
                }
              >

                <Popup>

                  <strong>
                    {place.icon}{" "}
                    {place.name}
                  </strong>

                  <br />

                  Category:{" "}
                  {place.type}

                  <br />

                  Address:{" "}
                  {place.address}

                  <br />

                  <button
                    onClick={() => {
                      window.location.href =
                        "/hotel-details";
                    }}
                  >
                    View Details
                  </button>

                </Popup>

              </Marker>
            )
          )}

        </MapContainer>

      </div>

    </div>
  );
}

export default NearbyLocations;