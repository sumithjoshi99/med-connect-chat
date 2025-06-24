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
    const body = formData.get('Body')?.toString()
    const messageId = formData.get('MessageSid')?.toString()

    console.log('Received SMS from:', from, 'Body:', body, 'MessageSid:', messageId)

    if (!from || !body) {
      console.error('Missing required fields:', { from: !!from, body: !!body })
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

    // Normalize phone number for matching (remove +1, dashes, spaces, parentheses)
    const normalizePhone = (phone: string) => {
      return phone.replace(/[\+\-\s\(\)]/g, '').replace(/^1/, '')
    }

    const normalizedFrom = normalizePhone(from || '')
    console.log('Normalized phone number:', normalizedFrom)

    // Find patient by phone number
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, phone, name')
      .order('created_at', { ascending: false })

    if (patientError) {
      console.error('Error fetching patients:', patientError)
      return new Response('Database error', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log('Found patients:', patients?.length || 0)

    // Find matching patient by normalized phone numbers
    let patientId: string | null = null
    let patientName = 'Unknown Patient'
    
    for (const patient of patients || []) {
      if (patient.phone) {
        const normalizedPatientPhone = normalizePhone(patient.phone)
        console.log('Comparing:', normalizedFrom, 'with', normalizedPatientPhone, 'for patient:', patient.name)
        if (normalizedFrom === normalizedPatientPhone) {
          patientId = patient.id
          patientName = patient.name
          console.log('Found matching patient:', patient.id, patient.name)
          break
        }
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
          status: 'active'
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
        status: 'received'
      })

    if (insertError) {
      console.error('Database error inserting message:', insertError)
      return new Response('Database error', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log('Successfully processed SMS message for patient:', patientName)

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
