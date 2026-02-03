/**
 * India States & Districts Data
 * Comprehensive mapping for address form dropdowns
 */

export interface District {
  name: string;
  pincodePrefixes: string[]; // Possible pincode prefixes
}

export interface State {
  name: string;
  code: string;
  districts: District[];
}

export const INDIA_STATES: State[] = [
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    districts: [
      { name: 'Visakhapatnam', pincodePrefixes: ['530'] },
      { name: 'Krishna', pincodePrefixes: ['521'] },
      { name: 'Guntur', pincodePrefixes: ['522'] },
      { name: 'West Godavari', pincodePrefixes: ['534'] },
      { name: 'East Godavari', pincodePrefixes: ['533'] },
      { name: 'Nellore', pincodePrefixes: ['524'] },
      { name: 'Chittoor', pincodePrefixes: ['517'] },
      { name: 'Kadapa', pincodePrefixes: ['516'] },
      { name: 'Anantapur', pincodePrefixes: ['515'] },
    ],
  },
  {
    name: 'Arunachal Pradesh',
    code: 'AR',
    districts: [
      { name: 'Papum Pare', pincodePrefixes: ['791'] },
      { name: 'Changlang', pincodePrefixes: ['792'] },
      { name: 'Lohit', pincodePrefixes: ['792'] },
    ],
  },
  {
    name: 'Assam',
    code: 'AS',
    districts: [
      { name: 'Kamrup', pincodePrefixes: ['781'] },
      { name: 'Nagaon', pincodePrefixes: ['782'] },
      { name: 'Sonitpur', pincodePrefixes: ['784'] },
      { name: 'Barpeta', pincodePrefixes: ['781'] },
    ],
  },
  {
    name: 'Bihar',
    code: 'BR',
    districts: [
      { name: 'Patna', pincodePrefixes: ['800'] },
      { name: 'East Champaran', pincodePrefixes: ['845'] },
      { name: 'West Champaran', pincodePrefixes: ['844'] },
      { name: 'Madhubani', pincodePrefixes: ['847'] },
      { name: 'Mithila', pincodePrefixes: ['846'] },
      { name: 'Darbhanga', pincodePrefixes: ['846'] },
    ],
  },
  {
    name: 'Chhattisgarh',
    code: 'CG',
    districts: [
      { name: 'Raipur', pincodePrefixes: ['492'] },
      { name: 'Durg', pincodePrefixes: ['490'] },
      { name: 'Bilaspur', pincodePrefixes: ['495'] },
      { name: 'Rajnandgaon', pincodePrefixes: ['491'] },
    ],
  },
  {
    name: 'Goa',
    code: 'GA',
    districts: [
      { name: 'North Goa', pincodePrefixes: ['403'] },
      { name: 'South Goa', pincodePrefixes: ['403'] },
    ],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    districts: [
      { name: 'Ahmedabad', pincodePrefixes: ['380', '382'] },
      { name: 'Surat', pincodePrefixes: ['394', '395'] },
      { name: 'Vadodara', pincodePrefixes: ['390', '391'] },
      { name: 'Rajkot', pincodePrefixes: ['360'] },
      { name: 'Jamnagar', pincodePrefixes: ['361'] },
      { name: 'Junagadh', pincodePrefixes: ['362'] },
      { name: 'Bhavnagar', pincodePrefixes: ['364'] },
      { name: 'Gandhinagar', pincodePrefixes: ['382'] },
      { name: 'Anand', pincodePrefixes: ['388'] },
    ],
  },
  {
    name: 'Haryana',
    code: 'HR',
    districts: [
      { name: 'Faridabad', pincodePrefixes: ['121'] },
      { name: 'Gurgaon', pincodePrefixes: ['122'] },
      { name: 'Hisar', pincodePrefixes: ['125'] },
      { name: 'Ambala', pincodePrefixes: ['134'] },
      { name: 'Yamunanagar', pincodePrefixes: ['135'] },
      { name: 'Panipat', pincodePrefixes: ['132'] },
      { name: 'Rohtak', pincodePrefixes: ['124'] },
      { name: 'Sonipat', pincodePrefixes: ['131'] },
    ],
  },
  {
    name: 'Himachal Pradesh',
    code: 'HP',
    districts: [
      { name: 'Kangra', pincodePrefixes: ['176'] },
      { name: 'Mandi', pincodePrefixes: ['175'] },
      { name: 'Shimla', pincodePrefixes: ['171'] },
      { name: 'Solan', pincodePrefixes: ['173'] },
    ],
  },
  {
    name: 'Jharkhand',
    code: 'JH',
    districts: [
      { name: 'Ranchi', pincodePrefixes: ['834'] },
      { name: 'Dhanbad', pincodePrefixes: ['826'] },
      { name: 'Giridih', pincodePrefixes: ['815'] },
      { name: 'Hazaribag', pincodePrefixes: ['825'] },
    ],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    districts: [
      { name: 'Bangalore', pincodePrefixes: ['560', '562'] },
      { name: 'Mysore', pincodePrefixes: ['570'] },
      { name: 'Mangalore', pincodePrefixes: ['575'] },
      { name: 'Hubli', pincodePrefixes: ['580'] },
      { name: 'Belgaum', pincodePrefixes: ['590'] },
      { name: 'Tumkur', pincodePrefixes: ['572'] },
      { name: 'Gulbarga', pincodePrefixes: ['585'] },
    ],
  },
  {
    name: 'Kerala',
    code: 'KL',
    districts: [
      { name: 'Thiruvananthapuram', pincodePrefixes: ['695'] },
      { name: 'Kottayam', pincodePrefixes: ['686'] },
      { name: 'Kochi', pincodePrefixes: ['682', '683'] },
      { name: 'Thrissur', pincodePrefixes: ['680'] },
      { name: 'Kannur', pincodePrefixes: ['670'] },
      { name: 'Kozhikode', pincodePrefixes: ['673'] },
      { name: 'Malappuram', pincodePrefixes: ['676'] },
      { name: 'Pathanamthitta', pincodePrefixes: ['689'] },
      { name: 'Alappuzha', pincodePrefixes: ['688'] },
    ],
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    districts: [
      { name: 'Indore', pincodePrefixes: ['452'] },
      { name: 'Bhopal', pincodePrefixes: ['462'] },
      { name: 'Gwalior', pincodePrefixes: ['474'] },
      { name: 'Jabalpur', pincodePrefixes: ['482'] },
      { name: 'Ujjain', pincodePrefixes: ['456'] },
      { name: 'Ratlam', pincodePrefixes: ['457'] },
      { name: 'Dewas', pincodePrefixes: ['455'] },
    ],
  },
  {
    name: 'Maharashtra',
    code: 'MH',
    districts: [
      { name: 'Mumbai', pincodePrefixes: ['400', '401', '402'] },
      { name: 'Pune', pincodePrefixes: ['411', '412'] },
      { name: 'Nagpur', pincodePrefixes: ['440', '441'] },
      { name: 'Aurangabad', pincodePrefixes: ['431'] },
      { name: 'Nashik', pincodePrefixes: ['422'] },
      { name: 'Thane', pincodePrefixes: ['400', '421'] },
      { name: 'Kolhapur', pincodePrefixes: ['416'] },
      { name: 'Sangli', pincodePrefixes: ['416'] },
      { name: 'Ahmednagar', pincodePrefixes: ['414'] },
      { name: 'Solapur', pincodePrefixes: ['413'] },
    ],
  },
  {
    name: 'Manipur',
    code: 'MN',
    districts: [
      { name: 'Imphal East', pincodePrefixes: ['795'] },
      { name: 'Imphal West', pincodePrefixes: ['795'] },
    ],
  },
  {
    name: 'Meghalaya',
    code: 'ML',
    districts: [
      { name: 'East Khasi Hills', pincodePrefixes: ['793'] },
      { name: 'West Khasi Hills', pincodePrefixes: ['793'] },
    ],
  },
  {
    name: 'Mizoram',
    code: 'MZ',
    districts: [
      { name: 'Aizawl', pincodePrefixes: ['796'] },
    ],
  },
  {
    name: 'Nagaland',
    code: 'NL',
    districts: [
      { name: 'Kohima', pincodePrefixes: ['797'] },
      { name: 'Dimapur', pincodePrefixes: ['797'] },
    ],
  },
  {
    name: 'Odisha',
    code: 'OD',
    districts: [
      { name: 'Bhubaneswar', pincodePrefixes: ['751'] },
      { name: 'Cuttack', pincodePrefixes: ['753'] },
      { name: 'Rourkela', pincodePrefixes: ['769'] },
      { name: 'Sambalpur', pincodePrefixes: ['768'] },
      { name: 'Balasore', pincodePrefixes: ['756'] },
    ],
  },
  {
    name: 'Punjab',
    code: 'PB',
    districts: [
      { name: 'Amritsar', pincodePrefixes: ['143'] },
      { name: 'Ludhiana', pincodePrefixes: ['141'] },
      { name: 'Chandigarh', pincodePrefixes: ['160'] },
      { name: 'Jalandhar', pincodePrefixes: ['144'] },
      { name: 'Patiala', pincodePrefixes: ['147'] },
      { name: 'Bathinda', pincodePrefixes: ['151'] },
      { name: 'Ferozepur', pincodePrefixes: ['152'] },
    ],
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    districts: [
      { name: 'Jaipur', pincodePrefixes: ['302'] },
      { name: 'Jodhpur', pincodePrefixes: ['342'] },
      { name: 'Udaipur', pincodePrefixes: ['313'] },
      { name: 'Ajmer', pincodePrefixes: ['305'] },
      { name: 'Bikaner', pincodePrefixes: ['334'] },
      { name: 'Kota', pincodePrefixes: ['324'] },
      { name: 'Alwar', pincodePrefixes: ['301'] },
      { name: 'Bhilwara', pincodePrefixes: ['311'] },
      { name: 'Pali', pincodePrefixes: ['306'] },
    ],
  },
  {
    name: 'Sikkim',
    code: 'SK',
    districts: [
      { name: 'East Sikkim', pincodePrefixes: ['737'] },
      { name: 'West Sikkim', pincodePrefixes: ['737'] },
    ],
  },
  {
    name: 'Tamil Nadu',
    code: 'TN',
    districts: [
      { name: 'Chennai', pincodePrefixes: ['600', '602', '603'] },
      { name: 'Coimbatore', pincodePrefixes: ['641'] },
      { name: 'Madurai', pincodePrefixes: ['625'] },
      { name: 'Salem', pincodePrefixes: ['636'] },
      { name: 'Trichy', pincodePrefixes: ['620'] },
      { name: 'Tiruppur', pincodePrefixes: ['641'] },
      { name: 'Vellore', pincodePrefixes: ['632'] },
      { name: 'Kanyakumari', pincodePrefixes: ['629'] },
      { name: 'Theni', pincodePrefixes: ['625'] },
    ],
  },
  {
    name: 'Telangana',
    code: 'TG',
    districts: [
      { name: 'Hyderabad', pincodePrefixes: ['500'] },
      { name: 'Secunderabad', pincodePrefixes: ['500'] },
      { name: 'Warangal', pincodePrefixes: ['506'] },
      { name: 'Nizamabad', pincodePrefixes: ['503'] },
      { name: 'Khammam', pincodePrefixes: ['507'] },
    ],
  },
  {
    name: 'Tripura',
    code: 'TR',
    districts: [
      { name: 'Agartala', pincodePrefixes: ['799'] },
    ],
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    districts: [
      { name: 'Lucknow', pincodePrefixes: ['226'] },
      { name: 'Kanpur', pincodePrefixes: ['208'] },
      { name: 'Varanasi', pincodePrefixes: ['221'] },
      { name: 'Agra', pincodePrefixes: ['282'] },
      { name: 'Allahabad', pincodePrefixes: ['211'] },
      { name: 'Meerut', pincodePrefixes: ['250'] },
      { name: 'Ghaziabad', pincodePrefixes: ['201'] },
      { name: 'Noida', pincodePrefixes: ['201'] },
      { name: 'Greater Noida', pincodePrefixes: ['201'] },
      { name: 'Mathura', pincodePrefixes: ['281'] },
      { name: 'Vrindavan', pincodePrefixes: ['281'] },
    ],
  },
  {
    name: 'Uttarakhand',
    code: 'UT',
    districts: [
      { name: 'Dehradun', pincodePrefixes: ['248'] },
      { name: 'Haridwar', pincodePrefixes: ['249'] },
      { name: 'Nainital', pincodePrefixes: ['263'] },
    ],
  },
  {
    name: 'West Bengal',
    code: 'WB',
    districts: [
      { name: 'Kolkata', pincodePrefixes: ['700', '711'] },
      { name: 'Howrah', pincodePrefixes: ['711'] },
      { name: 'Darjeeling', pincodePrefixes: ['734'] },
      { name: 'Asansol', pincodePrefixes: ['713'] },
      { name: 'Siliguri', pincodePrefixes: ['734'] },
      { name: 'Durgapur', pincodePrefixes: ['713'] },
    ],
  },
  {
    name: 'Ladakh',
    code: 'LA',
    districts: [
      { name: 'Leh', pincodePrefixes: ['194'] },
      { name: 'Kargil', pincodePrefixes: ['194'] },
    ],
  },
  {
    name: 'Jammu and Kashmir',
    code: 'JK',
    districts: [
      { name: 'Srinagar', pincodePrefixes: ['190'] },
      { name: 'Jammu', pincodePrefixes: ['180'] },
      { name: 'Anantnag', pincodePrefixes: ['192'] },
    ],
  },
];

/**
 * Helper to get districts for a state
 */
export const getDistrictsByState = (stateName: string): District[] => {
  const state = INDIA_STATES.find((s) => s.name === stateName);
  return state?.districts || [];
};

/**
 * Get all state names
 */
export const getStateNames = (): string[] => {
  return INDIA_STATES.map((state) => state.name);
};

/**
 * Validate pincode format and length
 */
export const validatePincode = (pincode: string): boolean => {
  return /^\d{6}$/.test(pincode);
};

/**
 * Validate phone number (Indian format)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Must be exactly 10 digits and start with valid range
  return /^[6-9]\d{9}$/.test(digits);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
};
