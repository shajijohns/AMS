import { countries, continents } from 'countries-list';

// Helper to group countries by continent
export interface CountryData {
  code: string;
  name: string;
  continentCode: string;
}

export interface GroupedCountries {
  continent: string;
  countries: CountryData[];
}

export const getGroupedCountries = (): GroupedCountries[] => {
  const grouped: Record<string, CountryData[]> = {};

  Object.entries(countries).forEach(([code, data]) => {
    const continentName = (continents as Record<string, string>)[data.continent] || data.continent;
    if (!grouped[continentName]) {
      grouped[continentName] = [];
    }
    grouped[continentName].push({
      code,
      name: data.name,
      continentCode: data.continent
    });
  });

  // Sort continents
  const result = Object.keys(grouped)
    .sort()
    .map(continent => ({
      continent,
      // Sort countries within each continent alphabetically, but put US first
      countries: grouped[continent].sort((a, b) => {
        if (a.code === 'US') return -1;
        if (b.code === 'US') return 1;
        return a.name.localeCompare(b.name);
      })
    }));

  return result;
};

export const getFlatCountries = () => {
  const flatList: { name: string; continent: string; code: string; flag: string }[] = [];
  
  const getFlagEmoji = (countryCode: string) => {
    return String.fromCodePoint(...countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0)));
  };

  getGroupedCountries().forEach(group => {
    group.countries.forEach(c => {
      flatList.push({
        name: c.name,
        continent: group.continent,
        code: c.code,
        flag: getFlagEmoji(c.code)
      });
    });
  });
  return flatList;
};

export const flatCountries = getFlatCountries();

// 50 US States
export const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];
