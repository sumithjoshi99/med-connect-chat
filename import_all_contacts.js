import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wfhslrzkjgyrxwxlyjyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaHNscnpramd5cnh3eGx5anl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzODMwNzUsImV4cCI6MjA2Mzk1OTA3NX0.Z_WdGbmE_K7hmiokgiMq9wbFbT3TA8rSYBaAdShbmBM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to determine location based on city
function getLocationFromCity(city) {
  const cityLower = city.toLowerCase();
  
  if (cityLower.includes('mount vernon') || cityLower.includes('mt vernon')) {
    return 'mount_vernon';
  }
  
  if (cityLower.includes('new rochelle') || cityLower.includes('new roc')) {
    return 'new_rochelle';
  }
  
  return 'mount_vernon';
}

// Function to format phone number
function formatPhoneNumber(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  if (digits.length > 11) {
    return phone.startsWith('+') ? phone : `+${digits}`;
  }
  
  return phone.startsWith('+') ? phone : `+${phone}`;
}

// Function to combine name parts
function combineName(firstName, middleName, lastName) {
  const parts = [firstName, middleName, lastName].filter(part => part && part.trim());
  return parts.join(' ').trim();
}

// Function to import contacts in batches
async function importContactsBatch(contacts) {
  console.log(`Starting import of ${contacts.length} contacts...`);
  
  let successCount = 0;
  let errorCount = 0;
  let mountVernonCount = 0;
  let newRochelleCount = 0;
  let duplicateCount = 0;
  
  for (const contact of contacts) {
    try {
      const fullName = combineName(contact.firstName, contact.middleName, contact.lastName);
      const formattedPhone = formatPhoneNumber(contact.phone);
      const location = getLocationFromCity(contact.city);
      
      // Check for duplicates
      if (formattedPhone) {
        const { data: existing } = await supabase
          .from('patients')
          .select('id')
          .eq('phone', formattedPhone)
          .single();
        
        if (existing) {
          console.log(`⏭️ Skipping duplicate: ${fullName} (phone: ${formattedPhone})`);
          duplicateCount++;
          continue;
        }
      }
      
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
        console.error(`❌ Error importing ${fullName}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Imported: ${fullName} (${location})`);
        successCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error processing contact:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n=== BATCH IMPORT SUMMARY ===');
  console.log(`✅ Successfully imported: ${successCount} contacts`);
  console.log(`⏭️ Skipped duplicates: ${duplicateCount} contacts`);
  console.log(`❌ Errors: ${errorCount} contacts`);
  console.log(`📍 Mount Vernon: ${mountVernonCount} contacts`);
  console.log(`📍 New Rochelle: ${newRochelleCount} contacts`);
  console.log(`📊 Total processed: ${contacts.length} contacts`);
  
  return { successCount, errorCount, duplicateCount, mountVernonCount, newRochelleCount };
}

// Main import function
async function importAllContacts() {
  console.log('🚀 Starting comprehensive contact import...\n');
  
  // This would be where you'd add all your contacts from the Google Sheets
  // For now, I'll add a sample batch to demonstrate the functionality
  
  const sampleContacts = [
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
    }
    // Add more contacts here...
  ];
  
  const results = await importContactsBatch(sampleContacts);
  
  console.log('\n🎉 Import process completed!');
  console.log(`📈 Total new contacts added: ${results.successCount}`);
  console.log(`🔄 Total duplicates skipped: ${results.duplicateCount}`);
}

// Run the import
importAllContacts().catch(console.error); 