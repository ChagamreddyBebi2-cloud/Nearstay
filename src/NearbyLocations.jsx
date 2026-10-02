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

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});
function LocationButton() {
    const map = useMap();
  
    const getLocation = () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = [
            position.coords.latitude,
            position.coords.longitude
          ];
  
          map.setView(userLocation, 15);
        },
        () => {
          alert("Unable to get your location.");
        }
      );
    };
  
    return (
      <button className="location-button" onClick={getLocation}>
        📍 Use My Location
      </button>
    );
  }

function NearbyLocations() {
    const hotels = [
        {
          name: "Hotel NearStay",
          location: [13.6300, 79.4205],
          type: "Hotel"
        },
        {
          name: "Comfort Stay",
          location: [13.6255, 79.4160],
          type: "Hotel"
        },
        {
          name: "City View Rooms",
          location: [13.6320, 79.4240],
          type: "Hotel"
        }
      ];
  const location = [13.6288, 79.4192];

  return (
    <div className="nearby-page">

      <div className="nearby-header">
        <h1>Nearby Locations</h1>
        <p>Find stays and useful places near your location.</p>
      </div>

      <div className="map-box">

        <MapContainer
          center={location}
          zoom={13}
          scrollWheelZoom={true}

        >
            <LocationButton />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

<Marker position={location}>
  <Popup>
    📍 NearStay Location
  </Popup>
</Marker>

{hotels.map((hotel, index) => (
  <Marker key={index} position={hotel.location}>
    <Popup>
      <strong>{hotel.name}</strong>
      <br />
      {hotel.type}
    </Popup>
  </Marker>
))}

        </MapContainer>

      </div>

    </div>
  );
}

export default NearbyLocations;