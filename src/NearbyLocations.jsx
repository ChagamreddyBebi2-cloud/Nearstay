import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import MarkerClusterGroup from "react-leaflet-cluster";

import L from "leaflet";

import {
  Mic,
  SlidersHorizontal,
  X,
} from "lucide-react";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import "./NearbyLocations.css";

// ==========================================
// LEAFLET DEFAULT ICON FIX
// ==========================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ==========================================
// CATEGORY MARKER
// ==========================================

const createIcon = (emoji, background) =>
  L.divIcon({
    className: "category-marker",

    html: `
      <div
        style="
          width:38px;
          height:38px;
          border-radius:50%;
          background:${background};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:20px;
          border:2px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
        "
      >
        ${emoji}
      </div>
    `,

    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });

// ==========================================
// SELECTED LOCATION ICON
// ==========================================

const selectedLocationIcon = createIcon(
  "📍",
  "#f3d7bd"
);

// ==========================================
// CATEGORY DATA
// ==========================================

const categoryData = {
  stay: {
    label: "Hotels / Stays",
    icon: "🏨",
    color: "#fff3e6",

    osm: [
      ["tourism", "hotel"],
      ["tourism", "hostel"],
      ["tourism", "guest_house"],
      ["tourism", "motel"],
    ],
  },

  restaurant: {
    label: "Restaurants",
    icon: "🍴",
    color: "#fff0d9",

    osm: [
      ["amenity", "restaurant"],
      ["amenity", "fast_food"],
      ["amenity", "cafe"],
    ],
  },

  hospital: {
    label: "Hospitals",
    icon: "🏥",
    color: "#ffe5e5",

    osm: [
      ["amenity", "hospital"],
      ["amenity", "clinic"],
    ],
  },

  movie: {
    label: "Movie Halls",
    icon: "🎬",
    color: "#eee5ff",

    osm: [
      ["amenity", "cinema"],
    ],
  },

  tourist: {
    label: "Tourist Places",
    icon: "📸",
    color: "#f1e8ff",

    osm: [
      ["tourism", "attraction"],
      ["tourism", "viewpoint"],
      ["tourism", "museum"],
    ],
  },

  shopping: {
    label: "Shopping",
    icon: "🛍️",
    color: "#fff8d9",

    osm: [
      ["shop", "mall"],
      ["shop", "supermarket"],
      ["shop", "department_store"],
    ],
  },

  police: {
    label: "Police Stations",
    icon: "🚓",
    color: "#e7f0ff",

    osm: [
      ["amenity", "police"],
    ],
  },

  bus: {
    label: "Bus Stations",
    icon: "🚌",
    color: "#e8f7ed",

    osm: [
      ["amenity", "bus_station"],
      ["public_transport", "station"],
    ],
  },

  petrol: {
    label: "Petrol Bunks",
    icon: "⛽",
    color: "#ffe9e9",

    osm: [
      ["amenity", "fuel"],
    ],
  },

  pharmacy: {
    label: "Pharmacies",
    icon: "💊",
    color: "#e5f8f4",

    osm: [
      ["amenity", "pharmacy"],
    ],
  },
};

// ==========================================
// CATEGORY ICON
// ==========================================

const getCategoryIcon = (category) => {
  const item = categoryData[category];

  return createIcon(
    item.icon,
    item.color
  );
};

// ==========================================
// CLEAN CLUSTER ICON
// ==========================================

const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();

  return L.divIcon({
    html: `
      <div
        style="
          width:48px;
          height:48px;
          border-radius:50%;
          background:#8b5e3c;
          color:white;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:15px;
          font-weight:700;
          border:4px solid rgba(255,255,255,0.9);
          box-shadow:0 3px 12px rgba(0,0,0,0.30);
        "
      >
        ${count}
      </div>
    `,

    className: "custom-marker-cluster",

    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

// ==========================================
// VOICE
// ==========================================

function speakLocation(locationName) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();

    const message =
      new SpeechSynthesisUtterance(
        `You are in ${locationName}`
      );

    message.lang = "en-IN";
    message.rate = 0.9;
    message.pitch = 1;

    window.speechSynthesis.speak(message);
  }
}

// ==========================================
// LOCATION NAME
// ==========================================

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

// ==========================================
// PHOTON RESULT CONVERTER
// ==========================================

function convertPhotonResult(feature) {
  const properties =
    feature.properties || {};

  const coordinates =
    feature.geometry?.coordinates || [];

  return {
    lat: coordinates[1],
    lon: coordinates[0],

    name:
      properties.city ||
      properties.town ||
      properties.village ||
      properties.name ||
      properties.street ||
      "Unknown location",

    address: {
      city:
        properties.city ||
        properties.town ||
        properties.village,

      state: properties.state,
      country: properties.country,
      suburb: properties.suburb,
    },
  };
}

// ==========================================
// LOCATION SEARCH
// ==========================================

function LocationSearch({
  setUserLocation,
  setSelectedLocationName,
  showExplore,
  setShowExplore,
  selectedCategories,
  toggleCategory,
  toggleAllCategories,
  clearCategories,
}) {
  const [search, setSearch] =
    useState("");

  const [suggestions, setSuggestions] =
    useState([]);

  const [isListening, setIsListening] =
    useState(false);

  const [searching, setSearching] =
    useState(false);

  // ========================================
  // NOMINATIM SEARCH
  // ========================================

  const searchWithNominatim =
    async (value) => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          value
        )}&limit=5`
      );

      if (!response.ok) {
        throw new Error(
          "Nominatim request failed"
        );
      }

      return await response.json();
    };

  // ========================================
  // PHOTON SEARCH
  // ========================================

  const searchWithPhoton =
    async (value) => {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          value
        )}&limit=5`
      );

      if (!response.ok) {
        throw new Error(
          "Photon request failed"
        );
      }

      const data =
        await response.json();

      return data.features.map(
        convertPhotonResult
      );
    };

  // ========================================
  // SEARCH PLACES
  // ========================================

  const searchPlaces = async (
    value
  ) => {
    setSearch(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    setSearching(true);

    try {
      let data = [];

      try {
        data =
          await searchWithNominatim(
            value
          );
      } catch (error) {
        console.log(
          "Nominatim failed. Trying Photon..."
        );
      }

      if (
        !data ||
        data.length === 0
      ) {
        data =
          await searchWithPhoton(
            value
          );
      }

      setSuggestions(data);
    } catch (error) {
      console.error(
        "Location search error:",
        error
      );

      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  // ========================================
  // SELECT LOCATION
  // ========================================

  const selectLocation = (place) => {
    const lat = Number(place.lat);
    const lon = Number(place.lon);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon)
    ) {
      return;
    }

    const locationName =
      getShortLocationName(place);

    setUserLocation([
      lat,
      lon,
    ]);

    setSelectedLocationName(
      locationName
    );

    setSearch(locationName);
    setSuggestions([]);

    speakLocation(locationName);
  };

  // ========================================
  // VOICE SEARCH
  // ========================================

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

    setIsListening(true);

    recognition.onresult =
      async (event) => {
        const spokenText =
          event.results[0][0]
            .transcript;

        setSearch(spokenText);

        try {
          let data = [];

          try {
            data =
              await searchWithNominatim(
                spokenText
              );
          } catch (error) {
            console.log(
              "Nominatim voice search failed."
            );
          }

          if (
            !data ||
            data.length === 0
          ) {
            data =
              await searchWithPhoton(
                spokenText
              );
          }

          if (data.length > 0) {
            selectLocation(
              data[0]
            );
          } else {
            alert(
              "Location not found."
            );
          }
        } catch (error) {
          console.error(
            "Voice search error:",
            error
          );

          alert(
            "Unable to find this location."
          );
        }

        setIsListening(false);
      };

    recognition.onerror = () => {
      setIsListening(false);

      alert(
        "Unable to understand the location."
      );
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // ========================================
  // SEARCH UI
  // ========================================

  return (
    <div className="location-search-container">

      <div className="location-search">

        {/* SEARCH BAR */}

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

          {/* MICROPHONE */}

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
            <Mic
              size={22}
              strokeWidth={2}
            />
          </button>

          {/* FILTER */}

          <button
            type="button"
            className="explore-icon-button"
            onClick={() =>
              setShowExplore(
                !showExplore
              )
            }
            title="Nearby Categories"
          >
            <SlidersHorizontal
              size={20}
            />
          </button>

        </div>

        {/* SEARCHING */}

        {searching && (
          <div className="location-suggestions">

            <div className="location-suggestion">

              <span>
                Searching locations...
              </span>

            </div>

          </div>
        )}

        {/* SUGGESTIONS */}

        {!searching &&
          suggestions.length > 0 && (
            <div className="location-suggestions">

              {suggestions.map(
                (place, index) => {

                  const name =
                    getShortLocationName(
                      place
                    );

                  return (
                    <div
                      key={`${name}-${index}`}
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
                        {place.address
                          ?.state
                          ? `, ${place.address.state}`
                          : ""}

                        {place.address
                          ?.country
                          ? `, ${place.address.country}`
                          : ""}
                      </small>

                    </div>
                  );
                }
              )}

            </div>
          )}

        {/* CATEGORY PANEL */}

        {showExplore && (
          <div className="explore-panel">

            <div className="explore-panel-header">

              <h3>
                Nearby Categories
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowExplore(
                    false
                  )
                }
                className="close-explore"
              >
                <X size={20} />
              </button>

            </div>

            <p>
              Choose what you want
              to see on the map.
            </p>

            {/* SELECT ALL */}

            <div className="select-all-option">

              <label>

                <input
                  type="checkbox"
                  checked={
                    selectedCategories.length ===
                    Object.keys(
                      categoryData
                    ).length
                  }
                  onChange={
                    toggleAllCategories
                  }
                />

                <span>
                  Select All
                </span>

              </label>

            </div>

            {/* CATEGORY LIST */}

            <div className="category-list">

              {Object.entries(
                categoryData
              ).map(
                ([key, item]) => (

                  <label
                    key={key}
                    className={`category-option ${
                      selectedCategories.includes(
                        key
                      )
                        ? "selected"
                        : ""
                    }`}
                  >

                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(
                        key
                      )}
                      onChange={() =>
                        toggleCategory(
                          key
                        )
                      }
                    />

                    <span className="category-icon">
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>

                  </label>

                )
              )}

            </div>

            {/* CLEAR ALL */}

            <button
              type="button"
              className="clear-categories"
              onClick={
                clearCategories
              }
            >
              Clear All
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

// ==========================================
// MY LOCATION
// ==========================================

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

        setUserLocation(
          location
        );

        setSelectedLocationName(
          "Your Location"
        );

        if (
          "speechSynthesis" in
          window
        ) {
          window.speechSynthesis.cancel();

          const message =
            new SpeechSynthesisUtterance(
              "You are here"
            );

          message.lang = "en-IN";
          message.rate = 0.9;

          window.speechSynthesis.speak(
            message
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
      type="button"
      className="location-button"
      onClick={handleLocation}
    >
      Use My Location
    </button>
  );
}

// ==========================================
// MAP LOCATION UPDATER
// ==========================================

function MapLocationUpdater({
  userLocation,
}) {
  const map = useMap();

  useEffect(() => {

    if (!userLocation) {
      return;
    }

    map.invalidateSize();

    map.flyTo(
      userLocation,
      15,
      {
        animate: true,
        duration: 1.5,
      }
    );

  }, [
    userLocation,
    map,
  ]);

  return null;
}

// ==========================================
// OVERPASS FETCH HELPER
// ==========================================

async function fetchOverpassQuery(
  query,
  signal
) {
  const servers = [
    "https://overpass-api.de/api/interpreter",

    "https://overpass.kumi.systems/api/interpreter",

    "https://overpass.private.coffee/api/interpreter",
  ];

  let lastError = null;

  for (const server of servers) {

    try {

      const url =
        `${server}?data=${encodeURIComponent(
          query
        )}`;

      const response =
        await fetch(url, {
          method: "GET",
          signal,
        });

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data =
        await response.json();

      if (
        data &&
        Array.isArray(
          data.elements
        )
      ) {
        return data.elements;
      }

      throw new Error(
        "Invalid Overpass response"
      );

    } catch (error) {

      if (
        error.name ===
        "AbortError"
      ) {
        throw error;
      }

      console.log(
        "Overpass server failed:",
        server
      );

      lastError = error;
    }
  }

  throw (
    lastError ||
    new Error(
      "All Overpass servers failed"
    )
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

function NearbyLocations() {

  const [
    userLocation,
    setUserLocation,
  ] = useState(null);

  const [
    selectedLocationName,
    setSelectedLocationName,
  ] = useState("");

  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState([]);

  const [
    places,
    setPlaces,
  ] = useState([]);

  const [
    loadingPlaces,
    setLoadingPlaces,
  ] = useState(false);

  const [
    placesError,
    setPlacesError,
  ] = useState("");

  const [
    showExplore,
    setShowExplore,
  ] = useState(false);

  // ========================================
  // TOGGLE CATEGORY
  // ========================================

  const toggleCategory = (
    category
  ) => {

    setSelectedCategories(
      (previous) => {

        if (
          previous.includes(
            category
          )
        ) {

          return previous.filter(
            (item) =>
              item !== category
          );
        }

        return [
          ...previous,
          category,
        ];
      }
    );
  };

  // ========================================
  // SELECT ALL
  // ========================================

  const toggleAllCategories =
    () => {

      const allCategories =
        Object.keys(
          categoryData
        );

      if (
        selectedCategories.length ===
        allCategories.length
      ) {

        setSelectedCategories([]);

      } else {

        setSelectedCategories(
          allCategories
        );
      }
    };

  // ========================================
  // CLEAR ALL
  // ========================================

  const clearCategories = () => {

    setSelectedCategories([]);

    setPlaces([]);

    setPlacesError("");
  };

  // ========================================
  // FETCH NEARBY PLACES
  // ========================================

  useEffect(() => {

    if (
      !userLocation ||
      selectedCategories.length === 0
    ) {

      setPlaces([]);
      setPlacesError("");
      setLoadingPlaces(false);

      return;
    }

    const controller =
      new AbortController();

    const fetchNearbyPlaces =
      async () => {

        setLoadingPlaces(true);
        setPlacesError("");
        setPlaces([]);

        const [
          lat,
          lon,
        ] = userLocation;

        try {

          // ====================================
          // SEARCH EACH SELECTED CATEGORY
          // ====================================

          const categoryResults =
            await Promise.allSettled(

              selectedCategories.map(
                async (category) => {

                  const categoryInfo =
                    categoryData[
                      category
                    ];

                  const osmQueries =
                    categoryInfo.osm
                      .map(
                        ([key, value]) =>
                          `
                          nwr["${key}"="${value}"](
                            around:5000,
                            ${lat},
                            ${lon}
                          );
                          `
                      )
                      .join("");

                  const query = `
                    [out:json][timeout:25];

                    (
                      ${osmQueries}
                    );

                    out center tags;
                  `;

                  console.log(
                    `Searching ${categoryInfo.label}...`
                  );

                  const elements =
                    await fetchOverpassQuery(
                      query,
                      controller.signal
                    );

                  console.log(
                    `${categoryInfo.label}: ${elements.length} results`
                  );

                  return {
                    category,
                    elements,
                  };
                }
              )
            );

          // ====================================
          // COMBINE RESULTS
          // ====================================

          const allPlaces = [];

          let successfulCategories = 0;

          categoryResults.forEach(
            (result) => {

              if (
                result.status !==
                "fulfilled"
              ) {

                console.log(
                  "Category request failed:",
                  result.reason
                );

                return;
              }

              successfulCategories++;

              const {
                category,
                elements,
              } = result.value;

              elements.forEach(
                (item) => {

                  const placeLat =
                    item.lat ??
                    item.center?.lat;

                  const placeLon =
                    item.lon ??
                    item.center?.lon;

                  if (
                    placeLat ===
                      undefined ||
                    placeLon ===
                      undefined
                  ) {
                    return;
                  }

                  const name =
                    item.tags?.name ||
                    item.tags?.[
                      "name:en"
                    ] ||
                    "Unnamed Place";

                  allPlaces.push({

                    id: `${category}-${item.type}-${item.id}`,

                    lat: Number(
                      placeLat
                    ),

                    lon: Number(
                      placeLon
                    ),

                    name,

                    category,

                    tags:
                      item.tags || {},
                  });
                }
              );
            }
          );

          // ====================================
          // REMOVE DUPLICATES
          // ====================================

          const uniquePlaces =
            Array.from(
              new Map(
                allPlaces.map(
                  (place) => [
                    `${place.category}-${place.lat}-${place.lon}-${place.name}`,
                    place,
                  ]
                )
              ).values()
            );

          // ====================================
          // SHOW RESULTS
          // ====================================

          if (
            !controller.signal.aborted
          ) {

            setPlaces(
              uniquePlaces.slice(
                0,
                300
              )
            );

            if (
              successfulCategories ===
                0 &&
              selectedCategories.length >
                0
            ) {

              setPlacesError(
                "Nearby places could not be loaded. Please try again."
              );

            } else if (
              uniquePlaces.length ===
              0
            ) {

              setPlacesError(
                "No selected places found within 5 km."
              );

            } else {

              setPlacesError("");
            }
          }

        } catch (error) {

          if (
            error.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Nearby places error:",
            error
          );

          if (
            !controller.signal.aborted
          ) {

            setPlaces([]);

            setPlacesError(
              "Unable to load nearby places. Please try again."
            );
          }

        } finally {

          if (
            !controller.signal.aborted
          ) {
            setLoadingPlaces(false);
          }
        }
      };

    fetchNearbyPlaces();

    return () => {
      controller.abort();
    };

  }, [
    userLocation,
    selectedCategories,
  ]);

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="nearby-page">

      {/* HEADER */}

      <div className="nearby-header">

        <h1>
          Nearby Locations
        </h1>

        <p>
          Search any location and explore
          places around you.
        </p>

      </div>

      {/* SEARCH */}

      <LocationSearch
        setUserLocation={
          setUserLocation
        }

        setSelectedLocationName={
          setSelectedLocationName
        }

        showExplore={
          showExplore
        }

        setShowExplore={
          setShowExplore
        }

        selectedCategories={
          selectedCategories
        }

        toggleCategory={
          toggleCategory
        }

        toggleAllCategories={
          toggleAllCategories
        }

        clearCategories={
          clearCategories
        }
      />

      {/* SELECTED LOCATION */}

      {selectedLocationName && (
        <div className="selected-location-name">
          📍 {selectedLocationName}
        </div>
      )}

      {/* MAP */}

      <div className="map-box">

        <MapContainer
          center={[
            20.5937,
            78.9629,
          ]}
          zoom={5}
          scrollWheelZoom={true}
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* MY LOCATION */}

          <LocationButton
            setUserLocation={
              setUserLocation
            }

            setSelectedLocationName={
              setSelectedLocationName
            }
          />

          {/* MAP ZOOM */}

          <MapLocationUpdater
            userLocation={
              userLocation
            }
          />

          {/* SELECTED LOCATION */}

          {userLocation && (
            <Marker
              position={
                userLocation
              }
              icon={
                selectedLocationIcon
              }
            >

              <Popup>

                <strong>
                  {
                    selectedLocationName ||
                    "Selected Location"
                  }
                </strong>

              </Popup>

            </Marker>
          )}

          {/* ====================================
              CLUSTERED NEARBY PLACES
              ==================================== */}

          <MarkerClusterGroup
            chunkedLoading={true}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
            removeOutsideVisibleBounds={true}
            iconCreateFunction={
              createClusterCustomIcon
            }
          >

            {places.map(
              (place) => (

                <Marker
                  key={`${place.id}-${place.lat}-${place.lon}`}
                  position={[
                    place.lat,
                    place.lon,
                  ]}
                  icon={getCategoryIcon(
                    place.category
                  )}
                >

                  <Popup>

                    <div className="place-popup">

                      <h3>
                        {
                          categoryData[
                            place.category
                          ].icon
                        }{" "}
                        {place.name}
                      </h3>

                      <p>
                        {
                          categoryData[
                            place.category
                          ].label
                        }
                      </p>

                      {/* HOTEL DETAILS */}

                      {place.category ===
                        "stay" && (

                        <button
                          type="button"
                          onClick={() => {

                            sessionStorage.setItem(
                              "selectedHotel",
                              JSON.stringify({
                                ...place,

                                address:
                                  "Location available on map",

                                type:
                                  place.tags?.tourism ||
                                  "Hotel",
                              })
                            );

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

              )
            )}

          </MarkerClusterGroup>

        </MapContainer>

      </div>

      {/* LOADING */}

      {loadingPlaces && (
        <p className="places-status">
          🔎 Finding nearby places...
        </p>
      )}

      {/* ERROR */}

      {placesError && (
        <p className="places-error">
          {placesError}
        </p>
      )}

      {/* RESULT COUNT */}

      {!loadingPlaces &&
        places.length > 0 && (

          <p className="places-status">
            📍 Showing{" "}
            {places.length} nearby places
          </p>

        )}

    </div>
  );
}

export default NearbyLocations;