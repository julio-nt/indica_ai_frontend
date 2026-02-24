import React from 'react';

interface MapProps {
  query?: string;
  apiKey?: string;
}

export function MapEmbed({ query = "Eiffel Tower", apiKey }: MapProps) {
  // Fallback to a direct embed if no API key is provided, or use the Embed API if key exists.
  // Note: The 'pb' parameter version doesn't require a key but is hardcoded.
  // The 'v1/place' version requires a key.
  
  if (!apiKey) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center flex-col p-8 text-center">
        <div className="bg-white p-6 rounded-xl shadow-sm max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">API Key Required</h3>
          <p className="text-gray-600 mb-4">
            To use the dynamic Google Maps Embed API, you need to add your API key to the <code>.env</code> file.
          </p>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs font-mono text-gray-500 break-all">
            GOOGLE_MAPS_API_KEY=your_key_here
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Showing a static placeholder for now.
          </p>
        </div>
      </div>
    );
  }

  const encodedQuery = encodeURIComponent(query);
  const src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedQuery}`;

  return (
    <iframe
      title="Google Map"
      width="100%"
      height="100%"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={src}
      className="w-full h-full rounded-xl"
    />
  );
}
