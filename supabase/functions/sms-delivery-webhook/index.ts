import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allow public access for Twilio webhooks
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

serve(async (req) => {
  console.log('SMS Delivery Webhook called with method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders
    })
  }

  try {
    const formData = await req.formData()
    const messageStatus = formData.get('MessageStatus')?.toString()
    const messageSid = formData.get('MessageSid')?.toString()
    const errorCode = formData.get('ErrorCode')?.toString()
    const to = formData.get('To')?.toString()
    const from = formData.get('From')?.toString()
    const errorMessage = formData.get('ErrorMessage')?.toString()

    console.log('Delivery status update:', {
      messageStatus,
      messageSid,
      errorCode,
      errorMessage,
      to,
      from
    })

    if (!messageStatus || !messageSid) {
      console.error('Missing required fields:', { messageStatus: !!messageStatus, messageSid: !!messageSid })
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

    // Get phone number configuration if available
    let phoneNumberConfig = null
    if (from) {
      const { data } = await supabase
        .from('twilio_phone_numbers')
        .select('*')
        .eq('phone_number', from)
        .eq('is_active', true)
        .single()
      
      phoneNumberConfig = data
    }

    // Map Twilio status to our internal status
    let internalStatus = messageStatus.toLowerCase()
    
    // Map specific Twilio statuses to our schema
    switch (messageStatus.toLowerCase()) {
      case 'queued':
      case 'accepted':
      case 'sending':
        internalStatus = 'sending'
        break
      case 'sent':
        internalStatus = 'sent'
        break
      case 'delivered':
        internalStatus = 'delivered'
        break
      case 'undelivered':
      case 'failed':
        internalStatus = 'failed'
        break
      default:
        internalStatus = messageStatus.toLowerCase()
    }

    console.log(`Updating message ${messageSid} status from ${messageStatus} to ${internalStatus}`)

    // Update message status in database
    const updateData: any = {
      status: internalStatus,
      delivered_at: internalStatus === 'delivered' ? new Date().toISOString() : null,
      error_code: errorCode || null,
      metadata: {
        twilio_status: messageStatus,
        updated_at: new Date().toISOString(),
        error_code: errorCode,
        error_message: errorMessage || null,
        phone_number_used: phoneNumberConfig?.display_name || from
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('external_id', messageSid)
      .select()

    if (error) {
      console.error('Error updating message status:', error)
      return new Response('Database error', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    if (!data || data.length === 0) {
      console.warn(`No message found with external_id: ${messageSid}`)
      // This is not necessarily an error - the message might not be in our system yet
      return new Response('Message not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    console.log(`Successfully updated message status:`, {
      sid: messageSid,
      status: `${messageStatus} -> ${internalStatus}`,
      phoneNumber: phoneNumberConfig?.display_name || from,
      hasError: !!errorCode
    })

    // Return TwiML response for Twilio
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml'
      }
    })

  } catch (error) {
    console.error('Delivery webhook error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
}) 