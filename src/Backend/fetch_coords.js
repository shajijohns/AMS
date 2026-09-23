const https = require('https');
const fs = require('fs');

https.get('https://restcountries.com/v3.1/all?fields=name,latlng', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const countries = JSON.parse(data);
    let s = '';
    countries.forEach(c => {
      if(c.name && c.name.common && c.latlng && c.latlng.length >= 2) {
        const name = c.name.common.replace(/"/g, '\\"');
        // Coordinates in restcountries are [lat, lng]
        // But the C# MapDataService seems to use [lng, lat] for mapbox/d3? 
        // Let's check: { "United States", new[] { -95.7129, 37.0902 } } => -95 is Longitude, 37 is Latitude.
        // Yes, [lng, lat].
        const lat = c.latlng[0];
        const lng = c.latlng[1];
        s += `        { "${name}", new[] { ${lng}, ${lat} } },\n`;
      }
    });
    fs.writeFileSync('coords.txt', s);
    console.log('Done');
  });
}).on('error', console.error);
