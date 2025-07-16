import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allow public access for Twilio webhooks
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

serve(async (req) => {
  console.log('SMS Webhook called with method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders
    })
  }

  // Skip authorization for webhook endpoints - Twilio doesn't send auth headers
  try {
    const formData = await req.formData()
    const from = formData.get('From')?.toString()
    const to = formData.get('To')?.toString() // This is our Twilio number that received the message
    const body = formData.get('Body')?.toString()
    const messageId = formData.get('MessageSid')?.toString()

    console.log('Received SMS:', { from, to, body, messageId })

    if (!from || !body || !to) {
      console.error('Missing required fields:', { from: !!from, body: !!body, to: !!to })
      return new Response('Missing required fields', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Initialize Supabase client with service role key for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      return new Response('Server configuration error', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find the phone number configuration for the receiving number
    const { data: phoneNumberConfig, error: phoneError } = await supabase
      .from('twilio_phone_numbers')
      .select('*')
      .eq('phone_number', to)
      .eq('is_active', true)
      .single()

    if (phoneError || !phoneNumberConfig) {
      console.error('Phone number configuration not found for:', to, phoneError)
      // Still process the message but without phone number config
      console.log('Processing message without phone number config')
    } else {
      console.log('Found phone number config:', phoneNumberConfig.display_name)
    }

    // Check for auto-response
    if (phoneNumberConfig?.auto_response_enabled && phoneNumberConfig.auto_response_message) {
      console.log('Auto-response enabled for:', phoneNumberConfig.display_name)
      // Note: Auto-response logic would go here if needed
    }

    // Normalize phone number for matching (remove +1, dashes, spaces, parentheses)
    const normalizePhone = (phone: string) => {
      return phone.replace(/[\+\-\s\(\)]/g, '').replace(/^1/, '')
    }

    // Look for existing patient by phone number
    console.log('Looking for patient with phone:', from)
    const normalizedFrom = normalizePhone(from)
    
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, name, phone')
      .not('phone', 'is', null)

    if (patientError) {
      console.error('Error fetching patients:', patientError)
      return new Response('Database error', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Find matching patient by normalized phone number
    let patientId: string | null = null
    let patientName: string | null = null

    for (const patient of patients || []) {
      if (patient.phone && normalizePhone(patient.phone) === normalizedFrom) {
        patientId = patient.id
        patientName = patient.name
        console.log('Found matching patient:', patientName, 'ID:', patientId)
        break
      }
    }

    // If no patient found, create a new patient record
    if (!patientId) {
      console.log('No matching patient found, creating new patient for:', from)
      
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          name: `SMS Contact ${from}`,
          phone: from,
          preferred_channel: 'sms',
          status: 'active',
          assigned_phone_number_id: phoneNumberConfig?.id || null
        })
        .select('id, name')
        .single()

      if (createError) {
        console.error('Error creating new patient:', createError)
        // Use a fallback approach - create a UUID
        patientId = crypto.randomUUID()
        patientName = `SMS Contact ${from}`
      } else {
        patientId = newPatient.id
        patientName = newPatient.name
        console.log('Created new patient:', patientId, patientName)
      }
    }

    // Insert the message
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        patient_id: patientId,
        channel: 'sms',
        direction: 'inbound',
        content: body,
        sender_name: from,
        external_id: messageId,
        status: 'received',
        phone_number_id: phoneNumberConfig?.id || null,
        twilio_number_from: from,
        twilio_number_to: to
      })

    if (insertError) {
      console.error('Database error inserting message:', insertError)
      return new Response('Database error', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log('Successfully processed SMS message:', {
      patient: patientName,
      phoneNumberUsed: phoneNumberConfig?.display_name || 'Unknown',
      messageId: messageId
    })

    // Return TwiML response for Twilio (optional)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml'
      }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
