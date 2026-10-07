import { useEffect, useState } from "react";
import "./HotelDetails.css";

function HotelDetails() {
  const [hotel, setHotel] = useState(null);

  useEffect(() => {
    const savedHotel = sessionStorage.getItem("selectedHotel");

    if (savedHotel) {
      setHotel(JSON.parse(savedHotel));
    }
  }, []);

  const goBack = () => {
    window.location.href = "/nearby-locations";
  };

  if (!hotel) {
    return (
      <div className="hotel-details-page">

        <div className="hotel-details-header">
          <button
            className="back-button"
            onClick={goBack}
          >
            ← Back to Map
          </button>

          <h1>Hotel Details</h1>
        </div>

        <div className="hotel-details-card">
          <div className="hotel-info">
            <h2>No hotel selected</h2>

            <p>
              Please go back to the map and select a hotel.
            </p>

            <button
              className="book-room-button"
              onClick={goBack}
            >
              Go to Nearby Locations
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="hotel-details-page">

      {/* Header */}

      <div className="hotel-details-header">

        <button
          className="back-button"
          onClick={goBack}
        >
          ← Back to Map
        </button>

        <h1>Hotel Details</h1>

      </div>


      {/* Hotel Card */}

      <div className="hotel-details-card">

        {/* Hotel Image */}

        <div className="hotel-image">
          🏨
        </div>


        {/* Hotel Information */}

        <div className="hotel-info">

          <h2>
            {hotel.name}
          </h2>

          <p className="hotel-location">
            📍 {hotel.address || "Location available on map"}
          </p>

          <div className="hotel-rating">
            ⭐ 4.2
          </div>

          <p className="hotel-description">
            This stay is located near your selected
            location. Check the available facilities
            and room options before booking.
          </p>


          {/* Features */}

          <div className="hotel-features">

            <span>🛏️ Comfortable Rooms</span>

            <span>📶 Wi-Fi</span>

            <span>🚗 Parking</span>

            <span>🛡️ Safe Stay</span>

          </div>


          {/* Category */}

          <p className="hotel-location">
            🏷️ {hotel.type}
          </p>


          {/* Book Button */}

          <button
            className="book-room-button"
            onClick={() => {
              alert(
                "Room booking feature will be added in the next step."
              );
            }}
          >
            Book Room
          </button>

        </div>

      </div>

    </div>
  );
}

export default HotelDetails;