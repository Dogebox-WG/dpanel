/**
 * Timezone formatting utilities for converting IANA timezone IDs
 * to human-readable labels with GMT offsets
 */

/**
 * Get the GMT offset for a timezone
 * @param {string} ianaId - IANA timezone identifier (e.g., "Australia/Adelaide")
 * @returns {string} Formatted GMT offset (e.g., "GMT +10:30")
 */
function getGMTOffset(ianaId) {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaId,
      timeZoneName: 'longOffset',
    });
    
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    if (offsetPart && offsetPart.value.startsWith('GMT')) {
      return offsetPart.value;
    }
    
    // Fallback: calculate offset manually
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: ianaId }));
    const offsetMinutes = (tzDate - utcDate) / (1000 * 60);
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    
    if (minutes === 0) {
      return `GMT ${sign}${hours}`;
    }
    return `GMT ${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn(`Failed to get offset for ${ianaId}:`, error);
    return 'GMT';
  }
}


/**
 * Mapping of specific timezone IDs to proper city/country names
 */
const timezoneNameMapping = {
  // Europe - map to countries
  'Europe/Lisbon': { city: 'Lisbon', region: 'Portugal' },
  'Europe/London': { city: 'London', region: 'United Kingdom' },
  'Europe/Paris': { city: 'Paris', region: 'France' },
  'Europe/Berlin': { city: 'Berlin', region: 'Germany' },
  'Europe/Madrid': { city: 'Madrid', region: 'Spain' },
  'Europe/Rome': { city: 'Rome', region: 'Italy' },
  'Europe/Moscow': { city: 'Moscow', region: 'Russia' },
  'Europe/Athens': { city: 'Athens', region: 'Greece' },
  'Europe/Amsterdam': { city: 'Amsterdam', region: 'Netherlands' },
  'Europe/Brussels': { city: 'Brussels', region: 'Belgium' },
  'Europe/Vienna': { city: 'Vienna', region: 'Austria' },
  'Europe/Warsaw': { city: 'Warsaw', region: 'Poland' },
  'Europe/Prague': { city: 'Prague', region: 'Czech Republic' },
  'Europe/Budapest': { city: 'Budapest', region: 'Hungary' },
  'Europe/Stockholm': { city: 'Stockholm', region: 'Sweden' },
  'Europe/Copenhagen': { city: 'Copenhagen', region: 'Denmark' },
  'Europe/Oslo': { city: 'Oslo', region: 'Norway' },
  'Europe/Helsinki': { city: 'Helsinki', region: 'Finland' },
  'Europe/Dublin': { city: 'Dublin', region: 'Ireland' },
  'Europe/Zurich': { city: 'Zurich', region: 'Switzerland' },
  
  // Americas
  'America/New_York': { city: 'New York', region: 'USA' },
  'America/Los_Angeles': { city: 'Los Angeles', region: 'USA' },
  'America/Chicago': { city: 'Chicago', region: 'USA' },
  'America/Denver': { city: 'Denver', region: 'USA' },
  'America/Phoenix': { city: 'Phoenix', region: 'USA' },
  'America/Detroit': { city: 'Detroit', region: 'USA' },
  'America/Anchorage': { city: 'Anchorage', region: 'USA' },
  'America/Toronto': { city: 'Toronto', region: 'Canada' },
  'America/Vancouver': { city: 'Vancouver', region: 'Canada' },
  'America/Mexico_City': { city: 'Mexico City', region: 'Mexico' },
  'America/Sao_Paulo': { city: 'São Paulo', region: 'Brazil' },
  'America/Buenos_Aires': { city: 'Buenos Aires', region: 'Argentina' },
  
  // Asia
  'Asia/Tokyo': { city: 'Tokyo', region: 'Japan' },
  'Asia/Shanghai': { city: 'Shanghai', region: 'China' },
  'Asia/Hong_Kong': { city: 'Hong Kong', region: 'China' },
  'Asia/Singapore': { city: 'Singapore', region: 'Singapore' },
  'Asia/Seoul': { city: 'Seoul', region: 'South Korea' },
  'Asia/Bangkok': { city: 'Bangkok', region: 'Thailand' },
  'Asia/Dubai': { city: 'Dubai', region: 'UAE' },
  'Asia/Kolkata': { city: 'Kolkata', region: 'India' },
  'Asia/Mumbai': { city: 'Mumbai', region: 'India' },
  'Asia/Delhi': { city: 'Delhi', region: 'India' },
  'Asia/Jakarta': { city: 'Jakarta', region: 'Indonesia' },
  'Asia/Manila': { city: 'Manila', region: 'Philippines' },
  
  // Africa
  'Africa/Cairo': { city: 'Cairo', region: 'Egypt' },
  'Africa/Johannesburg': { city: 'Johannesburg', region: 'South Africa' },
  'Africa/Lagos': { city: 'Lagos', region: 'Nigeria' },
  'Africa/Nairobi': { city: 'Nairobi', region: 'Kenya' },
  'Africa/Abidjan': { city: 'Abidjan', region: 'Ivory Coast' },
  
  // Pacific
  'Pacific/Auckland': { city: 'Auckland', region: 'New Zealand' },
  'Pacific/Fiji': { city: 'Fiji', region: 'Fiji' },
  'Pacific/Honolulu': { city: 'Honolulu', region: 'USA' },
  'Pacific/Tahiti': { city: 'Tahiti', region: 'French Polynesia' },
  
  // Australia
  'Australia/Adelaide': { city: 'Adelaide', region: 'Australia' },
  'Australia/Brisbane': { city: 'Brisbane', region: 'Australia' },
  'Australia/Melbourne': { city: 'Melbourne', region: 'Australia' },
  'Australia/Sydney': { city: 'Sydney', region: 'Australia' },
  'Australia/Perth': { city: 'Perth', region: 'Australia' },
  'Australia/Darwin': { city: 'Darwin', region: 'Australia' },
  'Australia/Hobart': { city: 'Hobart', region: 'Australia' },
  
  // Americas - US States
  'America/Indiana/Indianapolis': { city: 'Indianapolis', region: 'Indiana, USA' },
  'America/Indiana/Knox': { city: 'Knox', region: 'Indiana, USA' },
  'America/Indiana/Marengo': { city: 'Marengo', region: 'Indiana, USA' },
  'America/Indiana/Petersburg': { city: 'Petersburg', region: 'Indiana, USA' },
  'America/Indiana/Tell_City': { city: 'Tell City', region: 'Indiana, USA' },
  'America/Indiana/Vevay': { city: 'Vevay', region: 'Indiana, USA' },
  'America/Indiana/Vincennes': { city: 'Vincennes', region: 'Indiana, USA' },
  'America/Indiana/Winamac': { city: 'Winamac', region: 'Indiana, USA' },
  'America/Kentucky/Louisville': { city: 'Louisville', region: 'Kentucky, USA' },
  'America/Kentucky/Monticello': { city: 'Monticello', region: 'Kentucky, USA' },
  'America/North_Dakota/Center': { city: 'Center', region: 'North Dakota, USA' },
  'America/North_Dakota/New_Salem': { city: 'New Salem', region: 'North Dakota, USA' },
  'America/North_Dakota/Beulah': { city: 'Beulah', region: 'North Dakota, USA' },
  
  // Americas - Other USA
  'America/Boise': { city: 'Boise', region: 'USA' },
  'America/Nome': { city: 'Nome', region: 'USA' },
  'America/Sitka': { city: 'Sitka', region: 'USA' },
  'America/Juneau': { city: 'Juneau', region: 'USA' },
  'America/Yakutat': { city: 'Yakutat', region: 'USA' },
  'America/Metlakatla': { city: 'Metlakatla', region: 'USA' },
  'America/Adak': { city: 'Adak', region: 'USA' },
  'America/Menominee': { city: 'Menominee', region: 'USA' },
  
  // Americas - Canada
  'America/Edmonton': { city: 'Edmonton', region: 'Canada' },
  'America/Winnipeg': { city: 'Winnipeg', region: 'Canada' },
  'America/Regina': { city: 'Regina', region: 'Canada' },
  'America/Halifax': { city: 'Halifax', region: 'Canada' },
  'America/St_Johns': { city: 'St. John\'s', region: 'Canada' },
  'America/Moncton': { city: 'Moncton', region: 'Canada' },
  'America/Goose_Bay': { city: 'Goose Bay', region: 'Canada' },
  'America/Glace_Bay': { city: 'Glace Bay', region: 'Canada' },
  'America/Blanc-Sablon': { city: 'Blanc-Sablon', region: 'Canada' },
  'America/Iqaluit': { city: 'Iqaluit', region: 'Canada' },
  'America/Pangnirtung': { city: 'Pangnirtung', region: 'Canada' },
  'America/Resolute': { city: 'Resolute', region: 'Canada' },
  'America/Rankin_Inlet': { city: 'Rankin Inlet', region: 'Canada' },
  'America/Cambridge_Bay': { city: 'Cambridge Bay', region: 'Canada' },
  'America/Yellowknife': { city: 'Yellowknife', region: 'Canada' },
  'America/Inuvik': { city: 'Inuvik', region: 'Canada' },
  'America/Dawson_Creek': { city: 'Dawson Creek', region: 'Canada' },
  'America/Fort_Nelson': { city: 'Fort Nelson', region: 'Canada' },
  'America/Whitehorse': { city: 'Whitehorse', region: 'Canada' },
  'America/Dawson': { city: 'Dawson', region: 'Canada' },
  'America/Swift_Current': { city: 'Swift Current', region: 'Canada' },
  
  // Americas - Mexico
  'America/Tijuana': { city: 'Tijuana', region: 'Mexico' },
  'America/Hermosillo': { city: 'Hermosillo', region: 'Mexico' },
  'America/Mazatlan': { city: 'Mazatlan', region: 'Mexico' },
  'America/Chihuahua': { city: 'Chihuahua', region: 'Mexico' },
  'America/Monterrey': { city: 'Monterrey', region: 'Mexico' },
  'America/Matamoros': { city: 'Matamoros', region: 'Mexico' },
  'America/Merida': { city: 'Mérida', region: 'Mexico' },
  'America/Cancun': { city: 'Cancún', region: 'Mexico' },
  'America/Bahia_Banderas': { city: 'Bahia Banderas', region: 'Mexico' },
  'America/Ojinaga': { city: 'Ojinaga', region: 'Mexico' },
  'America/Ciudad_Juarez': { city: 'Ciudad Juárez', region: 'Mexico' },
  
  // Americas - Central America
  'America/Guatemala': { city: 'Guatemala City', region: 'Guatemala' },
  'America/Belize': { city: 'Belize City', region: 'Belize' },
  'America/El_Salvador': { city: 'San Salvador', region: 'El Salvador' },
  'America/Tegucigalpa': { city: 'Tegucigalpa', region: 'Honduras' },
  'America/Managua': { city: 'Managua', region: 'Nicaragua' },
  'America/Costa_Rica': { city: 'San José', region: 'Costa Rica' },
  'America/Panama': { city: 'Panama City', region: 'Panama' },
  
  // Americas - Caribbean
  'America/Havana': { city: 'Havana', region: 'Cuba' },
  'America/Jamaica': { city: 'Kingston', region: 'Jamaica' },
  'America/Port-au-Prince': { city: 'Port-au-Prince', region: 'Haiti' },
  'America/Santo_Domingo': { city: 'Santo Domingo', region: 'Dominican Republic' },
  'America/Puerto_Rico': { city: 'San Juan', region: 'Puerto Rico' },
  'America/Barbados': { city: 'Bridgetown', region: 'Barbados' },
  'America/Martinique': { city: 'Fort-de-France', region: 'Martinique' },
  'America/Grand_Turk': { city: 'Grand Turk', region: 'Turks & Caicos' },
  
  // Americas - South America
  'America/Bogota': { city: 'Bogotá', region: 'Colombia' },
  'America/Caracas': { city: 'Caracas', region: 'Venezuela' },
  'America/Guyana': { city: 'Georgetown', region: 'Guyana' },
  'America/Paramaribo': { city: 'Paramaribo', region: 'Suriname' },
  'America/Cayenne': { city: 'Cayenne', region: 'French Guiana' },
  'America/Lima': { city: 'Lima', region: 'Peru' },
  'America/La_Paz': { city: 'La Paz', region: 'Bolivia' },
  'America/Guayaquil': { city: 'Guayaquil', region: 'Ecuador' },
  'America/Santiago': { city: 'Santiago', region: 'Chile' },
  'America/Asuncion': { city: 'Asunción', region: 'Paraguay' },
  'America/Montevideo': { city: 'Montevideo', region: 'Uruguay' },
  'America/Punta_Arenas': { city: 'Punta Arenas', region: 'Chile' },
  'America/Coyhaique': { city: 'Coyhaique', region: 'Chile' },
  
  // Americas - Brazil
  'America/Fortaleza': { city: 'Fortaleza', region: 'Brazil' },
  'America/Belem': { city: 'Belém', region: 'Brazil' },
  'America/Recife': { city: 'Recife', region: 'Brazil' },
  'America/Araguaina': { city: 'Araguaína', region: 'Brazil' },
  'America/Maceio': { city: 'Maceió', region: 'Brazil' },
  'America/Bahia': { city: 'Salvador', region: 'Brazil' },
  'America/Campo_Grande': { city: 'Campo Grande', region: 'Brazil' },
  'America/Cuiaba': { city: 'Cuiabá', region: 'Brazil' },
  'America/Porto_Velho': { city: 'Porto Velho', region: 'Brazil' },
  'America/Boa_Vista': { city: 'Boa Vista', region: 'Brazil' },
  'America/Manaus': { city: 'Manaus', region: 'Brazil' },
  'America/Eirunepe': { city: 'Eirunepé', region: 'Brazil' },
  'America/Rio_Branco': { city: 'Rio Branco', region: 'Brazil' },
  'America/Santarem': { city: 'Santarém', region: 'Brazil' },
  'America/Noronha': { city: 'Fernando de Noronha', region: 'Brazil' },
  
  // Americas - Greenland
  'America/Nuuk': { city: 'Nuuk', region: 'Greenland' },
  'America/Danmarkshavn': { city: 'Danmarkshavn', region: 'Greenland' },
  'America/Scoresbysund': { city: 'Scoresbysund', region: 'Greenland' },
  'America/Thule': { city: 'Thule', region: 'Greenland' },
  
  // Americas - St. Pierre and Miquelon
  'America/Miquelon': { city: 'St. Pierre', region: 'St. Pierre & Miquelon' },
  
  // Europe - More countries
  'Europe/Istanbul': { city: 'Istanbul', region: 'Turkey' },
  'Europe/Kyiv': { city: 'Kyiv', region: 'Ukraine' },
  'Europe/Bucharest': { city: 'Bucharest', region: 'Romania' },
  'Europe/Sofia': { city: 'Sofia', region: 'Bulgaria' },
  'Europe/Belgrade': { city: 'Belgrade', region: 'Serbia' },
  'Europe/Chisinau': { city: 'Chișinău', region: 'Moldova' },
  'Europe/Minsk': { city: 'Minsk', region: 'Belarus' },
  'Europe/Riga': { city: 'Riga', region: 'Latvia' },
  'Europe/Tallinn': { city: 'Tallinn', region: 'Estonia' },
  'Europe/Vilnius': { city: 'Vilnius', region: 'Lithuania' },
  'Europe/Kaliningrad': { city: 'Kaliningrad', region: 'Russia' },
  'Europe/Volgograd': { city: 'Volgograd', region: 'Russia' },
  'Europe/Simferopol': { city: 'Simferopol', region: 'Crimea' },
  'Europe/Astrakhan': { city: 'Astrakhan', region: 'Russia' },
  'Europe/Saratov': { city: 'Saratov', region: 'Russia' },
  'Europe/Ulyanovsk': { city: 'Ulyanovsk', region: 'Russia' },
  'Europe/Samara': { city: 'Samara', region: 'Russia' },
  'Europe/Kirov': { city: 'Kirov', region: 'Russia' },
  'Europe/Andorra': { city: 'Andorra la Vella', region: 'Andorra' },
  'Europe/Gibraltar': { city: 'Gibraltar', region: 'Gibraltar' },
  'Europe/Malta': { city: 'Valletta', region: 'Malta' },
  'Europe/Tirane': { city: 'Tirana', region: 'Albania' },
  
  // Asia - More detailed
  'Asia/Karachi': { city: 'Karachi', region: 'Pakistan' },
  'Asia/Kabul': { city: 'Kabul', region: 'Afghanistan' },
  'Asia/Tashkent': { city: 'Tashkent', region: 'Uzbekistan' },
  'Asia/Samarkand': { city: 'Samarkand', region: 'Uzbekistan' },
  'Asia/Almaty': { city: 'Almaty', region: 'Kazakhstan' },
  'Asia/Qyzylorda': { city: 'Qyzylorda', region: 'Kazakhstan' },
  'Asia/Qostanay': { city: 'Qostanay', region: 'Kazakhstan' },
  'Asia/Aqtobe': { city: 'Aqtobe', region: 'Kazakhstan' },
  'Asia/Aqtau': { city: 'Aqtau', region: 'Kazakhstan' },
  'Asia/Atyrau': { city: 'Atyrau', region: 'Kazakhstan' },
  'Asia/Oral': { city: 'Oral', region: 'Kazakhstan' },
  'Asia/Bishkek': { city: 'Bishkek', region: 'Kyrgyzstan' },
  'Asia/Dushanbe': { city: 'Dushanbe', region: 'Tajikistan' },
  'Asia/Ashgabat': { city: 'Ashgabat', region: 'Turkmenistan' },
  'Asia/Tehran': { city: 'Tehran', region: 'Iran' },
  'Asia/Baghdad': { city: 'Baghdad', region: 'Iraq' },
  'Asia/Riyadh': { city: 'Riyadh', region: 'Saudi Arabia' },
  'Asia/Qatar': { city: 'Doha', region: 'Qatar' },
  'Asia/Damascus': { city: 'Damascus', region: 'Syria' },
  'Asia/Amman': { city: 'Amman', region: 'Jordan' },
  'Asia/Beirut': { city: 'Beirut', region: 'Lebanon' },
  'Asia/Jerusalem': { city: 'Jerusalem', region: 'Israel' },
  'Asia/Gaza': { city: 'Gaza', region: 'Palestine' },
  'Asia/Hebron': { city: 'Hebron', region: 'Palestine' },
  'Asia/Nicosia': { city: 'Nicosia', region: 'Cyprus' },
  'Asia/Famagusta': { city: 'Famagusta', region: 'Cyprus' },
  'Asia/Baku': { city: 'Baku', region: 'Azerbaijan' },
  'Asia/Tbilisi': { city: 'Tbilisi', region: 'Georgia' },
  'Asia/Yerevan': { city: 'Yerevan', region: 'Armenia' },
  'Asia/Dhaka': { city: 'Dhaka', region: 'Bangladesh' },
  'Asia/Kathmandu': { city: 'Kathmandu', region: 'Nepal' },
  'Asia/Thimphu': { city: 'Thimphu', region: 'Bhutan' },
  'Asia/Colombo': { city: 'Colombo', region: 'Sri Lanka' },
  'Asia/Yangon': { city: 'Yangon', region: 'Myanmar' },
  'Asia/Ho_Chi_Minh': { city: 'Ho Chi Minh City', region: 'Vietnam' },
  'Asia/Taipei': { city: 'Taipei', region: 'Taiwan' },
  'Asia/Ulaanbaatar': { city: 'Ulaanbaatar', region: 'Mongolia' },
  'Asia/Hovd': { city: 'Hovd', region: 'Mongolia' },
  'Asia/Pyongyang': { city: 'Pyongyang', region: 'North Korea' },
  'Asia/Macau': { city: 'Macau', region: 'China' },
  
  // Asia - Indonesia
  'Asia/Pontianak': { city: 'Pontianak', region: 'Indonesia' },
  'Asia/Makassar': { city: 'Makassar', region: 'Indonesia' },
  'Asia/Jayapura': { city: 'Jayapura', region: 'Indonesia' },
  
  // Asia - Russia
  'Asia/Yekaterinburg': { city: 'Yekaterinburg', region: 'Russia' },
  'Asia/Omsk': { city: 'Omsk', region: 'Russia' },
  'Asia/Novosibirsk': { city: 'Novosibirsk', region: 'Russia' },
  'Asia/Novokuznetsk': { city: 'Novokuznetsk', region: 'Russia' },
  'Asia/Krasnoyarsk': { city: 'Krasnoyarsk', region: 'Russia' },
  'Asia/Irkutsk': { city: 'Irkutsk', region: 'Russia' },
  'Asia/Chita': { city: 'Chita', region: 'Russia' },
  'Asia/Yakutsk': { city: 'Yakutsk', region: 'Russia' },
  'Asia/Khandyga': { city: 'Khandyga', region: 'Russia' },
  'Asia/Vladivostok': { city: 'Vladivostok', region: 'Russia' },
  'Asia/Ust-Nera': { city: 'Ust-Nera', region: 'Russia' },
  'Asia/Magadan': { city: 'Magadan', region: 'Russia' },
  'Asia/Sakhalin': { city: 'Sakhalin', region: 'Russia' },
  'Asia/Srednekolymsk': { city: 'Srednekolymsk', region: 'Russia' },
  'Asia/Kamchatka': { city: 'Petropavlovsk-Kamchatsky', region: 'Russia' },
  'Asia/Anadyr': { city: 'Anadyr', region: 'Russia' },
  'Asia/Barnaul': { city: 'Barnaul', region: 'Russia' },
  'Asia/Tomsk': { city: 'Tomsk', region: 'Russia' },
  'Asia/Urumqi': { city: 'Ürümqi', region: 'China' },
  
  // Asia - Malaysia
  'Asia/Kuching': { city: 'Kuching', region: 'Malaysia' },
  'Asia/Kuala_Lumpur': { city: 'Kuala Lumpur', region: 'Malaysia' },
  
  // Asia - Timor
  'Asia/Dili': { city: 'Dili', region: 'East Timor' },
  
  // Africa - More detailed
  'Africa/Algiers': { city: 'Algiers', region: 'Algeria' },
  'Africa/Tunis': { city: 'Tunis', region: 'Tunisia' },
  'Africa/Tripoli': { city: 'Tripoli', region: 'Libya' },
  'Africa/Casablanca': { city: 'Casablanca', region: 'Morocco' },
  'Africa/El_Aaiun': { city: 'El Aaiún', region: 'Western Sahara' },
  'Africa/Bissau': { city: 'Bissau', region: 'Guinea-Bissau' },
  'Africa/Monrovia': { city: 'Monrovia', region: 'Liberia' },
  'Africa/Sao_Tome': { city: 'São Tomé', region: 'São Tomé & Príncipe' },
  'Africa/Ndjamena': { city: 'N\'Djamena', region: 'Chad' },
  'Africa/Khartoum': { city: 'Khartoum', region: 'Sudan' },
  'Africa/Juba': { city: 'Juba', region: 'South Sudan' },
  'Africa/Windhoek': { city: 'Windhoek', region: 'Namibia' },
  'Africa/Maputo': { city: 'Maputo', region: 'Mozambique' },
  'Africa/Ceuta': { city: 'Ceuta', region: 'Spain' },
  
  // Atlantic
  'Atlantic/Azores': { city: 'Azores', region: 'Portugal' },
  'Atlantic/Madeira': { city: 'Madeira', region: 'Portugal' },
  'Atlantic/Canary': { city: 'Canary Islands', region: 'Spain' },
  'Atlantic/Faroe': { city: 'Faroe Islands', region: 'Denmark' },
  'Atlantic/Bermuda': { city: 'Bermuda', region: 'UK Territory' },
  'Atlantic/Cape_Verde': { city: 'Cape Verde', region: 'Cape Verde' },
  'Atlantic/Stanley': { city: 'Stanley', region: 'Falkland Islands' },
  'Atlantic/South_Georgia': { city: 'South Georgia', region: 'UK Territory' },
  
  // Pacific - More detailed
  'Pacific/Guadalcanal': { city: 'Honiara', region: 'Solomon Islands' },
  'Pacific/Noumea': { city: 'Nouméa', region: 'New Caledonia' },
  'Pacific/Norfolk': { city: 'Kingston', region: 'Norfolk Island' },
  'Pacific/Bougainville': { city: 'Bougainville', region: 'Papua New Guinea' },
  'Pacific/Port_Moresby': { city: 'Port Moresby', region: 'Papua New Guinea' },
  'Pacific/Guam': { city: 'Hagåtña', region: 'Guam' },
  'Pacific/Pago_Pago': { city: 'Pago Pago', region: 'American Samoa' },
  'Pacific/Apia': { city: 'Apia', region: 'Samoa' },
  'Pacific/Tongatapu': { city: 'Nuku\'alofa', region: 'Tonga' },
  'Pacific/Tarawa': { city: 'Tarawa', region: 'Kiribati' },
  'Pacific/Kanton': { city: 'Kanton', region: 'Kiribati' },
  'Pacific/Kiritimati': { city: 'Kiritimati', region: 'Kiribati' },
  'Pacific/Majuro': { city: 'Majuro', region: 'Marshall Islands' },
  'Pacific/Kwajalein': { city: 'Kwajalein', region: 'Marshall Islands' },
  'Pacific/Kosrae': { city: 'Kosrae', region: 'Micronesia' },
  'Pacific/Chuuk': { city: 'Chuuk', region: 'Micronesia' },
  'Pacific/Pohnpei': { city: 'Pohnpei', region: 'Micronesia' },
  'Pacific/Palau': { city: 'Ngerulmud', region: 'Palau' },
  'Pacific/Nauru': { city: 'Yaren', region: 'Nauru' },
  'Pacific/Efate': { city: 'Port Vila', region: 'Vanuatu' },
  'Pacific/Chatham': { city: 'Chatham Islands', region: 'New Zealand' },
  'Pacific/Fakaofo': { city: 'Fakaofo', region: 'Tokelau' },
  'Pacific/Niue': { city: 'Alofi', region: 'Niue' },
  'Pacific/Rarotonga': { city: 'Avarua', region: 'Cook Islands' },
  'Pacific/Pitcairn': { city: 'Adamstown', region: 'Pitcairn Islands' },
  'Pacific/Marquesas': { city: 'Marquesas Islands', region: 'French Polynesia' },
  'Pacific/Gambier': { city: 'Gambier Islands', region: 'French Polynesia' },
  'Pacific/Easter': { city: 'Easter Island', region: 'Chile' },
  'Pacific/Galapagos': { city: 'Galápagos', region: 'Ecuador' },
  
  // Antarctica
  'Antarctica/Casey': { city: 'Casey Station', region: 'Antarctica' },
  'Antarctica/Davis': { city: 'Davis Station', region: 'Antarctica' },
  'Antarctica/Macquarie': { city: 'Macquarie Island', region: 'Australia' },
  'Antarctica/Mawson': { city: 'Mawson Station', region: 'Antarctica' },
  'Antarctica/Palmer': { city: 'Palmer Station', region: 'Antarctica' },
  'Antarctica/Rothera': { city: 'Rothera Station', region: 'Antarctica' },
  'Antarctica/Troll': { city: 'Troll Station', region: 'Antarctica' },
  'Antarctica/Vostok': { city: 'Vostok Station', region: 'Antarctica' },
  'Antarctica/DumontDUrville': { city: 'Dumont d\'Urville', region: 'Antarctica' },
  'Antarctica/Syowa': { city: 'Syowa Station', region: 'Antarctica' },
};

/**
 * Extract city and region from IANA timezone ID
 * @param {string} ianaId - IANA timezone identifier
 * @returns {{city: string, region: string}} Parsed city and region
 */
function parseTimezoneId(ianaId) {
  // Handle special cases
  if (ianaId === 'UTC' || ianaId === 'GMT') {
    return { city: ianaId, region: '' };
  }
  
  // Check for explicit mapping (should cover all real timezones)
  if (timezoneNameMapping[ianaId]) {
    return timezoneNameMapping[ianaId];
  }
  
  // Fallback for any unmapped timezone (shouldn't happen with our comprehensive list)
  const parts = ianaId.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  const region = parts.slice(0, -1).join(', ').replace(/_/g, ' ');
  
  return { city, region };
}

/**
 * Format a timezone ID into a human-readable label
 * @param {string} ianaId - IANA timezone identifier (e.g., "Australia/Adelaide")
 * @returns {string} Formatted label (e.g., "Adelaide, Australia (GMT +10:30)")
 */
export function formatTimezoneLabel(ianaId) {
  const { city, region } = parseTimezoneId(ianaId);
  const offset = getGMTOffset(ianaId);
  
  if (!region) {
    return `${city} (${offset})`;
  }
  
  return `${city}, ${region} (${offset})`;
}

/**
 * Transform a timezone object with formatted display label
 * @param {{id: string, label: string}} timezone - Timezone object from API
 * @returns {{id: string, label: string, displayLabel: string, city: string}} Enhanced timezone object
 */
export function formatTimezoneWithOffset(timezone) {
  const { id, label } = timezone;
  const displayLabel = formatTimezoneLabel(id || label);
  const { city } = parseTimezoneId(id || label);
  
  return {
    id: id || label,
    label,
    displayLabel,
    city: city.toLowerCase(), // For sorting
  };
}

/**
 * Sort timezones alphabetically by city name
 * @param {Array} timezones - Array of timezone objects with city property
 * @returns {Array} Sorted array of timezones
 */
export function sortTimezonesByCity(timezones) {
  return [...timezones].sort((a, b) => {
    const cityA = (a.city || '').toLowerCase();
    const cityB = (b.city || '').toLowerCase();
    return cityA.localeCompare(cityB);
  });
}
