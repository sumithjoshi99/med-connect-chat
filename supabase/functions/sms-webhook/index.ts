
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse Twilio webhook data
    const formData = await req.formData()
    const from = formData.get('From')?.toString()
    const body = formData.get('Body')?.toString()
    const messageId = formData.get('MessageSid')?.toString()

    if (!from || !body) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Find patient by phone number
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, name')
      .eq('phone', from)
      .limit(1)

    if (patientError) {
      console.error('Error finding patient:', patientError)
      return new Response('Database error', { status: 500 })
    }

    let patientId = patients?.[0]?.id
    let patientName = patients?.[0]?.name

    // If patient doesn't exist, create a new one
    if (!patientId) {
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          name: `Patient ${from.slice(-4)}`, // Use last 4 digits as temporary name
          phone: from,
          preferred_channel: 'sms'
        })
        .select('id, name')
        .single()

      if (createError) {
        console.error('Error creating patient:', createError)
        return new Response('Failed to create patient', { status: 500 })
      }

      patientId = newPatient.id
      patientName = newPatient.name
    }

    // Store the incoming message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        patient_id: patientId,
        channel: 'sms',
        direction: 'inbound',
        content: body,
        sender_name: patientName,
        external_id: messageId,
        status: 'received'
      })

    if (messageError) {
      console.error('Error storing message:', messageError)
      return new Response('Failed to store message', { status: 500 })
    }

    // Return TwiML response
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
