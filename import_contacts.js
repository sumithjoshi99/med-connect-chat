import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wfhslrzkjgyrxwxlyjyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaHNscnpramd5cnh3eGx5anl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzODMwNzUsImV4cCI6MjA2Mzk1OTA3NX0.Z_WdGbmE_K7hmiokgiMq9wbFbT3TA8rSYBaAdShbmBM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Contact data from Google Sheets
const contacts = [
  {
    firstName: "Nadine",
    middleName: "Jumpdan Epse Mark Phillip",
    lastName: "",
    dob: "7/1/1983",
    gender: "F",
    phone: "(347) 207-4064",
    email: "naddan274@gmail.com",
    address: "2300 Grand Concourse, Apt 4D",
    city: "Bronx",
    state: "NY",
    zip: "10458-6924",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Rubi",
    middleName: "Chamorro Moroch",
    lastName: "",
    dob: "4/20/2023",
    gender: "F",
    phone: "(347) 261-9800",
    email: "",
    address: "43 Duryea Ave Apt #2",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Virginia",
    middleName: "JimenezDeBautista",
    lastName: "",
    dob: "6/26/1957",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "Spanish",
    status: "Active"
  },
  {
    firstName: "Taneshia",
    middleName: "Chambers",
    lastName: "",
    dob: "5/28/2000",
    gender: "F",
    phone: "(914) 530-5601",
    email: "",
    address: "150 S 2nd Ave # 1A",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jared",
    middleName: "Smith",
    lastName: "",
    dob: "9/13/2002",
    gender: "M",
    phone: "(914) 363-9082",
    email: "",
    address: "123 S 12th Ave, Apt 2",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2914",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Van",
    middleName: "Kelley",
    lastName: "",
    dob: "7/26/1969",
    gender: "M",
    phone: "(914) 497-3124",
    email: "",
    address: "4111 Baychester Ave",
    city: "Bronx",
    state: "NY",
    zip: "10466-2121",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Christopher",
    middleName: "Doyle",
    lastName: "",
    dob: "12/30/1993",
    gender: "M",
    phone: "(914) 349-3658",
    email: "",
    address: "16 Glover Ave",
    city: "Yonkers",
    state: "NY",
    zip: "10704-4204",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Hubert",
    middleName: "G",
    lastName: "Harris",
    dob: "9/28/1972",
    gender: "M",
    phone: "(347) 241-9256",
    email: "",
    address: "1319 E 224th St, Apt 3",
    city: "Bronx",
    state: "NY",
    zip: "10466-6091",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Deborah",
    middleName: "J",
    lastName: "Dickerson",
    dob: "1/13/1979",
    gender: "F",
    phone: "(914) 815-8884",
    email: "debdickerson@yahoo.com",
    address: "353 S 5th Ave, Fl 1",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-4111",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Andres",
    middleName: "Delgado",
    lastName: "",
    dob: "12/19/1968",
    gender: "M",
    phone: "(631) 889-9273",
    email: "",
    address: "1591 E 233rd St, Apt 7",
    city: "Bronx",
    state: "NY",
    zip: "10466-3336",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jacqueline",
    middleName: "M",
    lastName: "Harris",
    dob: "8/5/1974",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jacqueline",
    middleName: "M",
    lastName: "Harris",
    dob: "8/5/1974",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jacqueline",
    middleName: "M",
    lastName: "Harris",
    dob: "8/5/1974",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jacqueline",
    middleName: "M",
    lastName: "Harris",
    dob: "8/5/1974",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jacqueline",
    middleName: "M",
    lastName: "Harris",
    dob: "8/5/1974",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jacqueline",
    middleName: "M",
    lastName: "Harris",
    dob: "8/5/1974",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jacqueline",
    middleName: "M",
    lastName: "Harris",
    dob: "8/5/1974",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jacqueline",
    middleName: "M",
    lastName: "Harris",
    dob: "8/5/1974",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "English",
    status: "Active"
  },
  {
    firstName: "Jacqueline",
    middleName: "M",
    lastName: "Harris",
    dob: "8/5/1974",
    gender: "F",
    phone: "(914) 800-5453",
    email: "",
    address: "18 S Bleeker St, Apt 4",
    city: "Mount Vernon",
    state: "NY",
    zip: "10550-2471",
    language: "English",
    status: "Active"
  }
];

// Function to determine location based on city
function getLocationFromCity(city) {
  const cityLower = city.toLowerCase();
  
  // Mount Vernon area (including nearby areas that should be Mount Vernon)
  if (cityLower.includes('mount vernon') || cityLower.includes('mt vernon')) {
    return 'mount_vernon';
  }
  
  // New Rochelle area
  if (cityLower.includes('new rochelle') || cityLower.includes('new roc')) {
    return 'new_rochelle';
  }
  
  // Default to Mount Vernon for other areas (Bronx, Yonkers, etc.)
  return 'mount_vernon';
}

// Function to format phone number
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's a 10-digit US number, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it's an 11-digit number starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it already has a country code, return as is (but ensure + prefix)
  if (digits.length > 11) {
    return phone.startsWith('+') ? phone : `+${digits}`;
  }
  
  // Default: return with + if not present
  return phone.startsWith('+') ? phone : `+${phone}`;
}

// Function to combine name parts
function combineName(firstName, middleName, lastName) {
  const parts = [firstName, middleName, lastName].filter(part => part && part.trim());
  return parts.join(' ').trim();
}

// Function to import contacts
async function importContacts() {
  console.log('Starting contact import...');
  
  let successCount = 0;
  let errorCount = 0;
  let mountVernonCount = 0;
  let newRochelleCount = 0;
  
  for (const contact of contacts) {
    try {
      // Combine name
      const fullName = combineName(contact.firstName, contact.middleName, contact.lastName);
      
      // Format phone
      const formattedPhone = formatPhoneNumber(contact.phone);
      
      // Determine location
      const location = getLocationFromCity(contact.city);
      
      // Count by location
      if (location === 'mount_vernon') {
        mountVernonCount++;
      } else if (location === 'new_rochelle') {
        newRochelleCount++;
      }
      
      // Prepare address
      const fullAddress = [contact.address, contact.city, contact.state, contact.zip]
        .filter(part => part && part.trim())
        .join(', ');
      
      // Insert contact
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: fullName,
          phone: formattedPhone,
          email: contact.email || null,
          preferred_channel: 'sms',
          status: contact.status.toLowerCase(),
          date_of_birth: contact.dob || null,
          address: fullAddress,
          location: location,
          notes: `Imported from Google Sheets. Language: ${contact.language}, Gender: ${contact.gender}`
        }])
        .select()
        .single();

      if (error) {
        console.error(`Error importing ${fullName}:`, error);
        errorCount++;
      } else {
        console.log(`✅ Imported: ${fullName} (${location})`);
        successCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error processing contact:`, error);
      errorCount++;
    }
  }
  
  console.log('\n=== IMPORT SUMMARY ===');
  console.log(`✅ Successfully imported: ${successCount} contacts`);
  console.log(`❌ Errors: ${errorCount} contacts`);
  console.log(`📍 Mount Vernon: ${mountVernonCount} contacts`);
  console.log(`📍 New Rochelle: ${newRochelleCount} contacts`);
  console.log(`📊 Total processed: ${contacts.length} contacts`);
}

// Run the import
importContacts().catch(console.error); 