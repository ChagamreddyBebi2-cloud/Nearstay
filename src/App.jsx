import "./App.css";
import NearbyLocations from "./NearbyLocations";

function App() {
  if (window.location.pathname === "/nearby-locations") {
    return <NearbyLocations />;
  }
  return (
    <div className="nearstay">

      <div className="top-bar">
        <div>
          <span>✉ info@nearstay.com</span>
          <span>☎ +91 98765 43210</span>
        </div>

        <div>
          <span>🔒 Login</span>
          <span>👤 Register</span>
        </div>
      </div>

      <nav className="navbar">

        <div className="logo">
          <div className="logo-icon">🏨</div>

          <div>
            <strong>NEAR</strong>
            <br />
            <span>STAY</span>
          </div>
        </div>

        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#about">About Us</a>
          <a href="#rooms">Rooms</a>
          <a href="#places">Places</a>
          <a href="#">Contact Us</a>
          <a href="#" className="search-icon">🔎</a>
        </div>

        <button className="book-button">BOOK NOW</button>

      </nav>

      <section className="hero">
        <div className="hero-content">

          <p className="welcome">WELCOME TO NEARSTAY</p>

          <h1>
            Find Your Perfect Stay at a
            <span> Dream Location</span>
          </h1>

          <p className="hero-text">
            Discover comfortable rooms, PGs and hotels near you.
          </p>

          <div className="booking-box">

            <div className="booking-field">
              <label>LOCATION</label>
              <input
                type="text"
                placeholder="Select Location"
              />
            </div>

            <div className="booking-field">
              <label>CHECK-IN</label>
              <input
                type="text"
                placeholder="________________"
              />
            </div>

            <div className="booking-field">
              <label>CHECK-OUT</label>
              <input
                type="text"
                placeholder="________________"
              />
            </div>

            <button className="search-button">
              SEARCH →
            </button>

          </div>
        </div>
      </section>
      <section id="about">
  <h2>About NearStay</h2>
  <p>
    NearStay helps you find comfortable rooms, PGs and hotels near your location.
  </p>
</section>

      <section className="why-nearstay">

        <p className="section-small-title">
        <section id="rooms">
  <h2>Our Rooms</h2>
  <p>
    Explore comfortable rooms, PGs and hotels that suit your needs.
  </p>
</section>
<section id="places">
  <h2>Nearby Places</h2>
  <p>
    Find restaurants, tourist places, hospitals and transport near your stay.
  </p>
</section>
          WHY CHOOSE NEARSTAY
        </p>

        <h2>
          Everything You Need for a{" "}
          <span>Comfortable Stay</span>
        </h2>

        <p className="section-description">
          Find suitable stays and useful places around you, all in one place.
        </p>

        <div className="features">

        <div
  className="feature-card"
  onClick={() => window.location.href = "/nearby-locations"}
>
  <div className="feature-icon">📍</div>
  <h3>Nearby Locations</h3>
  <p>
    Discover rooms and stays close to your selected location.
  </p>
</div>
          <div className="feature-card">
            <div className="feature-icon">🛏️</div>
            <h3>Comfortable Rooms</h3>
            <p>
              Explore rooms, PGs and hotels with useful details.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Real Reviews</h3>
            <p>
              Check ratings and reviews before choosing your stay.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Safe Stay</h3>
            <p>
              Make informed choices for a comfortable stay.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}

export default App;