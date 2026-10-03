import "./HotelDetails.css";

function HotelDetails() {
  return (
    <div className="hotel-details-page">

      <div className="hotel-details-header">
        <h1>Hotel NearStay</h1>
        <p>Comfortable stay near your location</p>
      </div>

      <div className="hotel-details-card">

        <div className="hotel-image">
          🏨
        </div>

        <div className="hotel-info">

          <h2>Hotel NearStay</h2>

          <p className="hotel-location">
            📍 Near your selected location
          </p>

          <p>
            A comfortable place to stay with clean rooms and useful
            facilities for travelers.
          </p>

          <div className="hotel-features">
            <span>🛏️ Comfortable Rooms</span>
            <span>📶 Wi-Fi</span>
            <span>🚗 Parking</span>
            <span>🛡️ Safe Stay</span>
          </div>

          <div className="hotel-price">
            <strong>₹999</strong>
            <span> / night</span>
          </div>

          <button className="book-hotel-button">
            BOOK NOW
          </button>

        </div>

      </div>

    </div>
  );
}

export default HotelDetails;