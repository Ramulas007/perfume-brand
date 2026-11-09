import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders as supabaseCorsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  ...supabaseCorsHeaders,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) => {
  console.log('Function response:', JSON.stringify({ status, body }))
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  const { method } = req
  const requestId = crypto.randomUUID()
  console.log(`[${requestId}] Request received: ${method} ${req.url}`)

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    const requestedHeaders = req.headers.get('Access-Control-Request-Headers')
    console.log(`[${requestId}] OPTIONS request for headers: ${requestedHeaders}`)
    return new Response('ok', { headers: corsHeaders })
  }

  // Log headers for debugging (excluding secrets)
  const headers = Object.fromEntries(req.headers.entries())
  console.log(`[${requestId}] Request headers:`, JSON.stringify({
    ...headers,
    authorization: headers.authorization ? 'present' : 'missing',
    apikey: headers.apikey ? 'present' : 'missing'
  }))

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let requestData;
    try {
      requestData = await req.json()
    } catch (e) {
      console.error('Error parsing request JSON:', e)
      return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
    }

    console.log(`[${requestId}] Request data:`, JSON.stringify(requestData))
    
    const { action, orderId } = requestData

    const apiKey = Deno.env.get('STEADFAST_API_KEY')?.trim()
    const secretKey = Deno.env.get('STEADFAST_SECRET_KEY')?.trim()

    console.log(`[${requestId}] API Key present: ${!!apiKey}, Secret Key present: ${!!secretKey}`)

    if (!apiKey || !secretKey) {
      return jsonResponse({ success: false, error: 'Steadfast API credentials are not configured in environment variables' }, 500)
    }

    if (action === 'test') {
      return jsonResponse({ success: true, status: 200, message: 'Function is alive' })
    }

    if (action === 'create-order') {
      if (!orderId) return jsonResponse({ success: false, error: 'orderId is required' }, 400)

      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        console.error(`[${requestId}] Order lookup error:`, JSON.stringify(orderError))
        return jsonResponse({ success: false, error: `Order not found: ${orderId}`, details: orderError }, 404)
      }

      // Ensure address is at least 10 chars for Steadfast
      const address = (order.address || '').length < 10 
        ? `${order.address}, ${order.city}` 
        : order.address;

      const cleanPhone = order.phone.replace(/\D/g, '').slice(-11)
      
      const payload = {
        invoice: order.id, // Use full ID for uniqueness
        recipient_name: order.full_name,
        recipient_phone: cleanPhone,
        recipient_address: address.slice(0, 250), // Cap at 250 as per docs
        cod_amount: Math.round(order.total_amount),
        note: (order.notes || 'No notes').slice(0, 250),
      }

      console.log(`[${requestId}] Sending to Steadfast payload:`, JSON.stringify(payload))

      const response = await fetch('https://portal.packzy.com/api/v1/create_order', {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()
      console.log(`[${requestId}] Steadfast response:`, JSON.stringify({
        httpStatus: response.status,
        ok: response.ok,
        body: responseText,
      }))
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        return jsonResponse({
          success: false,
          status: response.status,
          error: responseText || 'Steadfast API returned a non-JSON response',
          rawBody: responseText,
        }, 200)
      }

      if (result.status === 200) {
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            tracking_code: result.consignment.tracking_code,
            courier_status: result.consignment.status,
            courier_name: 'Steadfast'
          })
          .eq('id', orderId)

        if (updateError) {
          console.error(`[${requestId}] Error updating order table:`, JSON.stringify(updateError))
          return jsonResponse({
            success: false,
            status: 500,
            error: 'Order sent to Steadfast, but local order update failed',
            details: updateError,
            steadfast: result,
          }, 200)
        }
      }

      return jsonResponse({
        success: result.status === 200,
        httpStatus: response.status,
        ...result,
      })
    }

    return jsonResponse({ success: false, error: 'Invalid action' }, 400)

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[${requestId}] Global error in function:`, message)
    return jsonResponse({ success: false, error: message }, 500)
  }
})