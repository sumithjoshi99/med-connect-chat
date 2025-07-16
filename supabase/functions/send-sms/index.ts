import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('SMS function called with method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('Request body received:', requestBody)
    
    const { to, message, patientId, phoneNumberId } = requestBody
    
    if (!to || !message) {
      console.error('Missing required fields:', { to: !!to, message: !!message })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to and message' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get the appropriate phone number to use
    let phoneNumberConfig
    
    if (phoneNumberId) {
      // Use specific phone number requested
      const { data, error } = await supabase
        .from('twilio_phone_numbers')
        .select('*')
        .eq('id', phoneNumberId)
        .eq('is_active', true)
        .single()
      
      if (error || !data) {
        console.error('Phone number not found:', error)
        return new Response(
          JSON.stringify({ error: 'Specified phone number not found or inactive' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      phoneNumberConfig = data
    } else {
      // Use primary phone number or first active one
      const { data, error } = await supabase
        .from('twilio_phone_numbers')
        .select('*')
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (error || !data) {
        console.error('No active phone numbers found:', error)
        return new Response(
          JSON.stringify({ error: 'No active phone numbers configured' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      phoneNumberConfig = data
    }
    
    console.log('Using phone number:', phoneNumberConfig.phone_number, 'Display name:', phoneNumberConfig.display_name)
    
    // Prepare the request body for Twilio with delivery tracking
    const twilioBody = new URLSearchParams({
      To: to,
      From: phoneNumberConfig.phone_number,
      Body: message,
      // Request delivery status updates
      StatusCallback: phoneNumberConfig.status_callback_url || `${supabaseUrl}/functions/v1/sms-delivery-webhook`,
      // Track all status changes for immediate updates
      StatusCallbackEvent: 'initiated,sent,delivered,undelivered,failed,read'
    })

    console.log('Sending SMS to Twilio with delivery tracking:', { 
      to, 
      from: phoneNumberConfig.phone_number, 
      bodyLength: message.length,
      statusCallback: phoneNumberConfig.status_callback_url || `${supabaseUrl}/functions/v1/sms-delivery-webhook`
    })

    // Send SMS via Twilio using the specific phone number's credentials
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${phoneNumberConfig.twilio_account_sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${phoneNumberConfig.twilio_account_sid}:${phoneNumberConfig.twilio_auth_token}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: twilioBody,
      }
    )

    console.log('Twilio response status:', response.status)
    
    const twilioResponse = await response.json()
    console.log('Twilio response:', twilioResponse)
    
    if (!response.ok) {
      console.error('Twilio API error:', twilioResponse)
      return new Response(
        JSON.stringify({ 
          error: twilioResponse.message || 'Failed to send SMS',
          details: twilioResponse 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('SMS sent successfully, SID:', twilioResponse.sid)
    
    // Update the message in the database with the Twilio SID and phone number info
    if (patientId) {
      try {
        await supabase
          .from('messages')
          .update({ 
            external_id: twilioResponse.sid,
            status: 'sent',
            phone_number_id: phoneNumberConfig.id,
            twilio_number_from: phoneNumberConfig.phone_number,
            twilio_number_to: to
          })
          .eq('patient_id', patientId)
          .eq('direction', 'outbound')
          .order('created_at', { ascending: false })
          .limit(1)
          
        console.log('Updated message with Twilio SID and phone number info:', {
          sid: twilioResponse.sid,
          phoneNumberId: phoneNumberConfig.id,
          from: phoneNumberConfig.phone_number,
          to: to
        })
      } catch (dbError) {
        console.error('Error updating message with SID:', dbError)
        // Don't fail the request for this
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: twilioResponse.sid,
        status: twilioResponse.status,
        phoneNumberUsed: phoneNumberConfig.phone_number,
        phoneNumberDisplayName: phoneNumberConfig.display_name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
