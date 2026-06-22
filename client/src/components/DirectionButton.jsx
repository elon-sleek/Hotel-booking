export default function DirectionButton() {
  const lat = 6.6817566;
  const lng = 3.2112908;
  const label = encodeURIComponent('The Rock Apartment 2, Ota, Ogun State');

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lng}&q=${label}`;

  function handleDirections() {
    // Detect iOS/macOS to prefer Apple Maps
    const isApple = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent) && !window.MSStream;
    window.open(isApple ? appleMapsUrl : googleMapsUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      <button className="btn btn-accent" onClick={handleDirections}>
        📍 Get Directions
      </button>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline"
        style={{ fontSize: '0.875rem' }}
      >
        🗺️ Google Maps
      </a>
      <a
        href={appleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline"
        style={{ fontSize: '0.875rem' }}
      >
        🍎 Apple Maps
      </a>
    </div>
  );
}
