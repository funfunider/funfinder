import React from 'react';
import InteractiveMap from './InteractiveMap';

/**
 * GoogleMap Compatibility Component
 * Uses Leaflet & OpenStreetMap under the hood so it works 100% of the time
 * without any Google Maps API keys, billing or setup required!
 */
const GoogleMap = (props) => {
  return <InteractiveMap {...props} />;
};

export { InteractiveMap };
export default GoogleMap;
