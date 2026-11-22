/**
 * Google Maps styling that matches the ParkShare palette, plus helpers for
 * the custom price markers used on the listings map.
 */

type MapStyle = google.maps.MapTypeStyle[];

export const lightMapStyle: MapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f6f7fb' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6e778f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e3f1e8' }, { visibility: 'on' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9aa2b8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8eaf6' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d8e6f5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9aa2b8' }] },
];

export const darkMapStyle: MapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#14161f' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a92a8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#14161f' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1b2a24' }, { visibility: 'on' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#20232f' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6e778f' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2b3040' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1420' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4c566e' }] },
];

export const mapOptions = (theme: 'light' | 'dark'): google.maps.MapOptions => ({
  styles: theme === 'dark' ? darkMapStyle : lightMapStyle,
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
  backgroundColor: theme === 'dark' ? '#14161f' : '#f6f7fb',
});

const svgToUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', CAD: '$', AUD: '$' };

/** Teardrop pin with a price label baked in, so markers read at a glance. */
export const priceMarkerIcon = (
  price: number,
  selected: boolean,
  currency: string = 'CAD'
): google.maps.Icon => {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$';
  const label = Number.isFinite(price) ? `${symbol}${Math.round(price)}` : `${symbol}–`;
  const width = Math.max(52, 26 + label.length * 9);
  const fill = selected ? '#14b8a6' : '#5b45eb';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="46" viewBox="0 0 ${width} 46">
      <g filter="url(#s)">
        <rect x="2" y="2" width="${width - 4}" height="30" rx="15" fill="${fill}"/>
        <path d="M${width / 2 - 7} 30 L${width / 2} 42 L${width / 2 + 7} 30 Z" fill="${fill}"/>
      </g>
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(15,18,30,0.45)"/>
        </filter>
      </defs>
      <text x="${width / 2}" y="21.5" text-anchor="middle"
        font-family="Inter, Segoe UI, sans-serif" font-size="14" font-weight="700" fill="#fff">${label}</text>
    </svg>`;

  return {
    url: svgToUrl(svg),
    scaledSize: new google.maps.Size(width, 46),
    anchor: new google.maps.Point(width / 2, 42),
  };
};

/** Single pin used when picking a location while creating a listing. */
export const pinMarkerIcon = (): google.maps.Icon => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
      <g filter="url(#p)">
        <path d="M19 3c7.2 0 13 5.3 13 11.9 0 8-9.6 17.2-12.2 19.6a1.1 1.1 0 0 1-1.6 0C15.6 32.1 6 22.9 6 14.9C6 8.3 11.8 3 19 3Z" fill="#5b45eb"/>
      </g>
      <circle cx="19" cy="15" r="4.6" fill="#fff"/>
      <defs>
        <filter id="p" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(15,18,30,0.4)"/>
        </filter>
      </defs>
    </svg>`;

  return {
    url: svgToUrl(svg),
    scaledSize: new google.maps.Size(38, 48),
    anchor: new google.maps.Point(19, 44),
  };
};
