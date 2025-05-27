
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    
    const { to, message, patientId } = requestBody
    
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
    
    // Get Twilio credentials from secrets
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
    
    console.log('Twilio credentials check:', {
      accountSid: !!twilioAccountSid,
      authToken: !!twilioAuthToken,
      phoneNumber: !!twilioPhoneNumber
    })
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio credentials')
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare the request body for Twilio
    const twilioBody = new URLSearchParams({
      To: to,
      From: twilioPhoneNumber,
      Body: message,
    })

    console.log('Sending SMS to Twilio:', { to, from: twilioPhoneNumber, bodyLength: message.length })

    // Send SMS via Twilio
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: twilioResponse.sid,
        status: twilioResponse.status 
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
