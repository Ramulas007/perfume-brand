// AI Mockup Generator - uses Lovable AI Gateway (Gemini image editing)
// Supports a `diagnostic: true` mode for health-checks from the admin panel.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const errorJson = (status: number, message: string, details = '') =>
  json(status, { success: false, message, error: message, details });

const readResponseText = async (response: Response, limit = 1200) => {
  if (!(response instanceof Response)) return '';
  try {
    const text = await response.text();
    return text.slice(0, limit);
  } catch (error) {
    console.error('[generate-mockup] response body read failed', {
      error,
      type: typeof error,
      constructor: (error as Error)?.constructor?.name,
    });
    return 'Unable to read response body';
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const reqId = crypto.randomUUID().slice(0, 8);
  const log = (...args: unknown[]) => console.log(`[${reqId}]`, ...args);
  const errLog = (...args: unknown[]) => console.error(`[${reqId}]`, ...args);

  try {
    const payload = await req.json().catch(() => ({}));
    log('Incoming request keys:', Object.keys(payload));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // ----- Diagnostic mode -----
    if (payload.diagnostic) {
      log('Diagnostic mode');
      const diag = {
        lovableApiKey: !!LOVABLE_API_KEY,
        supabaseUrl: !!Deno.env.get('SUPABASE_URL'),
        supabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
        gatewayReachable: false,
        gatewayStatus: 0,
        gatewayError: '',
        functionStatus: 'ok',
        timestamp: new Date().toISOString(),
      };
      try {
        if (LOVABLE_API_KEY) {
          // Lightweight chat completion to verify gateway connectivity + key validity
          const ping = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Lovable-API-Key': LOVABLE_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 1,
            }),
          });
          diag.gatewayStatus = ping.status;
          diag.gatewayReachable = ping.ok;
          if (!ping.ok) diag.gatewayError = await readResponseText(ping, 200);
        } else {
          diag.gatewayError = 'LOVABLE_API_KEY not set';
        }
      } catch (e) {
        diag.gatewayError = (e as Error).message;
      }
      return json(200, diag);
    }

    // ----- Generation mode -----
    const { mockupImage, designImage, settings } = payload;
    if (!mockupImage || !designImage) {
      return errorJson(400, 'mockupImage and designImage are required');
    }
    if (!LOVABLE_API_KEY) {
      return errorJson(500, 'AI is not configured on the server.', 'LOVABLE_API_KEY not configured');
    }

    log('Settings:', settings);
    log('Mockup size:', String(mockupImage).length, 'Design size:', String(designImage).length);

    const s = settings ?? {};
    const promptText = `You are a professional product mockup compositor.
Take the FIRST image (the blank product mockup) and place the SECOND image (the design / artwork) onto the product realistically.

Placement instructions:
- Horizontal position: ${s.position?.x ?? 50}% from left
- Vertical position: ${s.position?.y ?? 50}% from top
- Design width: ${s.printSize ?? 40}% of the product
- Rotation: ${s.rotation ?? 0} degrees
- Fabric curvature intensity: ${s.curvature ?? 0}%
- Design opacity: ${s.opacity ?? 100}%
- View: ${s.viewType ?? 'front'}

The design MUST follow the fabric's wrinkles, folds and shadows, match perspective and lighting, and look like a high-quality screen print / DTG print. Preserve the original product, background and colors. Output ONLY the final composited mockup image.`;

    const body = {
      model: 'google/gemini-2.5-flash-image',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'image_url', image_url: { url: mockupImage } },
            { type: 'image_url', image_url: { url: designImage } },
          ],
        },
      ],
      modalities: ['image', 'text'],
    };

    log('Calling Lovable AI Gateway...');
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Lovable-API-Key': LOVABLE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    log('Gateway status:', aiRes.status);

    if (!aiRes.ok) {
      const text = await readResponseText(aiRes);
      errLog('Gateway error body:', text.slice(0, 500));
      if (aiRes.status === 429) {
        return errorJson(429, 'AI rate limit reached. Please wait and retry.', text);
      }
      if (aiRes.status === 402) {
        return errorJson(402, 'AI credits exhausted. Add credits in Workspace settings.', text);
      }
      return errorJson(aiRes.status, `AI Gateway ${aiRes.status}`, text);
    }

    const data = await aiRes.json();
    const message = data?.choices?.[0]?.message;
    // Image edit responses put the image in message.images[0].image_url.url (data URL)
    const imageUrl: string | undefined =
      message?.images?.[0]?.image_url?.url ??
      (typeof message?.content === 'string' && message.content.startsWith('data:image')
        ? message.content
        : undefined);

    if (!imageUrl) {
      errLog('No image in response:', JSON.stringify(data).slice(0, 500));
      return errorJson(502, 'AI did not return an image. The model may have refused the request.', JSON.stringify(data).slice(0, 300));
    }

    log('Success — returning image data URL of length:', imageUrl.length);
    return json(200, { success: true, imageUrl });
  } catch (error) {
    const msg = (error as Error)?.message ?? String(error);
    const stack = (error as Error)?.stack ?? '';
    errLog('Unhandled error:', {
      error,
      type: typeof error,
      constructor: (error as Error)?.constructor?.name,
      stack,
    });
    return errorJson(500, msg, stack.slice(0, 500));
  }
});
