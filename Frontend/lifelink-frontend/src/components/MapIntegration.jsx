import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapIntegration({ latitude, longitude, onLocationSelect, height = '300px' }) {
  const [markerPosition, setMarkerPosition] = useState(
    latitude && longitude ? [latitude, longitude] : null
  );

  // Update marker position when latitude/longitude props change
  useEffect(() => {
    if (latitude && longitude) {
      setMarkerPosition([latitude, longitude]);
    } else {
      setMarkerPosition(null);
    }
  }, [latitude, longitude]);

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      },
    });
    return null;
  };

  // Determine center based on marker position or default to Beirut
  const mapCenter = markerPosition || [33.8889, 35.4955];

  return (
    <div style={{ height: height, width: '100%', marginTop: height === '100%' ? '0' : '10px' }}>
      <MapContainer
        center={mapCenter}
        zoom={markerPosition ? 15 : 13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        {markerPosition && <Marker position={markerPosition} />}
      </MapContainer>
    </div>
  );
}
