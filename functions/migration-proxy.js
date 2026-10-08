// Azion Function: proxy autenticado entre os formulários do portal e os webhooks do n8n.
// O front chama só /api/... no domínio do portal; o domínio do n8n e a chave
// ficam nas variáveis de ambiente da Azion e nunca chegam ao navegador.
//
// Variáveis de ambiente (Azion Console > Environment Variables):
//   N8N_CF_WEBHOOK_URL    webhook da automação Cloudflare -> Azion
//   N8N_BIND_WEBHOOK_URL  webhook da importação BIND
//   N8N_WEBHOOK_KEY       valor configurado na credencial Header Auth do n8n

const AUTH_HEADER = 'X-Migration-Key';

const ROUTES = {
  '/api/cf-migration': { env: 'N8N_CF_WEBHOOK_URL', maxBytes: 64 * 1024 },
  '/api/bind-import': { env: 'N8N_BIND_WEBHOOK_URL', maxBytes: 5 * 1024 * 1024 },
};

addEventListener('fetch', (event) => event.respondWith(handle(event.request)));

async function handle(request) {
  const url = new URL(request.url);
  const route = ROUTES[url.pathname.replace(/\/+$/, '')];
  if (!route) {
    return text(404, 'Rota não encontrada.');
  }

  if (request.method !== 'POST') {
    return text(405, 'Método não permitido.');
  }

  // Bloqueia chamadas de navegador vindas de outros sites. Não substitui autenticação de usuário.
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return text(403, 'Origem não permitida.');
  }

  const target = Azion.env.get(route.env);
  const key = Azion.env.get('N8N_WEBHOOK_KEY');
  if (!target || !key) {
    return text(500, `Proxy sem configuração (${route.env} / N8N_WEBHOOK_KEY).`);
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > route.maxBytes) {
    return text(413, 'Requisição muito grande.');
  }

  let upstream;
  try {
    upstream = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/octet-stream',
        [AUTH_HEADER]: key,
      },
      body,
    });
  } catch (e) {
    return text(502, 'Não foi possível contatar o n8n.');
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'text/plain; charset=utf-8' },
  });
}

function text(status, message) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
