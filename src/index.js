import { volunteerFeedback } from '../views/esn/volunteerFeedback';
import { newbieFeedback } from '../views/esn/newbieFeedback';
import { newbieFeedbackFromVolunteers } from '../views/esn/newbieFeedbackFromVolunteers';
import { newbieFeedbackResponses } from '../views/esn/responses/newbieFeedbackResponses';
import { volunteerFeedbackResponses } from '../views/esn/responses/volunteerFeedbackResponses';

async function getAllKeyNames(kv, query) {
	let keys = [];
	let cursor = undefined;

	do {
		const response = await kv.list({ ...query, cursor });
		keys = keys.concat(response.keys.map(({ name }) => name));
		cursor = response.cursor;
	} while (cursor);

	return keys;
}

async function bulkDeleteKeys(env, keys) {
	// Maximum keys per batch request
	const BATCH_SIZE = 10000;

	for (let i = 0; i < keys.length; i += BATCH_SIZE) {
		const batch = keys.slice(i, i + BATCH_SIZE);

		const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${env.ESN_RECRUITMENT_ID}/bulk`;
		await fetch(url, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${env.KV_API_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(batch),
		});
	}
}

export const retryPage = (redirect, email) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Acceso Denegado</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="center">
    <h1>Acceso Denegado</h1>
    ${email ? '<p>Inicia sesión con ' + email + '</p>' : ''}
    <a class="button" href="https://workers.tablerus.es/auth/logout?login=1&redirect=${encodeURIComponent(redirect)}">
      Cambiar de Cuenta
    </a>
  </div>
</body>
</html>`;

export const loginPage = (redirect) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Inicio de Sesión</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="center">
    <h1>Inicio de Sesión Requerido</h1>
    <a class="button" href="https://workers.tablerus.es/auth/login?redirect=${encodeURIComponent(redirect)}">
      Iniciar Sesión con Google
    </a>
  </div>
</body>
</html>`;

export default {
	async fetch(request, env, ctx) {
		try {
			const url = new URL(request.url);

			// Handle root, login, and retry pages
			if (url.pathname === '/') {
				return new Response(null, { status: 200 });
			} else if (url.pathname === '/login') {
				return new Response(loginPage(url.searchParams.get('redirect') || 'https://forms.tablerus.es'), {
					headers: { 'Content-Type': 'text/html' },
				});
			} else if (url.pathname === '/retry') {
				return new Response(
					retryPage(url.searchParams.get('redirect') || 'https://forms.tablerus.es', url.searchParams.get('email') || ''),
					{ headers: { 'Content-Type': 'text/html' } }
				);
			}

			// Authentication and email validation
			const cookies = request.headers.get('Cookie') || '';
			const oauthId = cookies.match(/oauthId=([^;]*)/)?.[1];
			if (!oauthId) {
				return Response.redirect(`https://forms.tablerus.es/login?redirect=${encodeURIComponent(request.url)}`, 302);
			}

			let email = await env.FORMS.get(`auth:${oauthId}`);
			if (!email) {
				email = (await env.AUTH.verifyAuth(oauthId)).data.email;
				await env.FORMS.put(`auth:${oauthId}`, email, { expirationTtl: 3600 * 12 });
			}

			// Handle ESN-specific routes
			if (url.pathname.startsWith('/esn')) {
				let partialUrl = url.pathname.split('/esn')[1];
				if (partialUrl.endsWith('/')) partialUrl = partialUrl.slice(0, -1);

				// New responses endpoint for admin (vicepresident@esnuam.org)
				if (partialUrl === '/volunteerFeedback/responses' || partialUrl === '/newbieFeedback/responses') {
					if (!['vicepresident@esnuam.org', 'hector.tablero@esnuam.org'].includes(email)) {
						return Response.redirect(
							`https://forms.tablerus.es/retry?email=${encodeURIComponent('vicepresident@esnuam.org')}&redirect=${encodeURIComponent(
								request.url
							)}`,
							302
						);
					}

					const feedbackType = partialUrl.includes('volunteer') ? 'volunteerFeedback' : 'newbieFeedback';
					const listType = feedbackType === 'volunteerFeedback' ? 'volunteerList' : 'newbieList';

					if (request.method === 'POST') {
						const formData = await request.formData();
						const action = formData.get('action');

						if (action === 'deleteAll') {
							const prefix = `forms:esn:${feedbackType}:`;
							const allKeys = await getAllKeyNames(env.FORMS, { prefix });

							const keysToDelete = allKeys.filter((key) => !key.endsWith(listType));

							if (keysToDelete.length > 0) {
								await bulkDeleteKeys(env, keysToDelete);
							}

							return new Response('All answers deleted', { status: 200 });
						} else if (action === 'updateList') {
							const newList = formData.get('list');
							try {
								JSON.parse(newList);
							} catch (e) {
								return new Response('Invalid JSON', { status: 400 });
							}
							await env.FORMS.put(`forms:esn:${feedbackType}:${listType}`, newList);
							await env.FORMS.delete(`forms:esn:${feedbackType}:cache`);
							return new Response('List updated', { status: 200 });
						}

						return new Response('Invalid action', { status: 400 });
					}

					// GET responses with cache
					// Retrieve cache
					const cacheKey = `forms:esn:${feedbackType}:cache`;
					const cache = (await env.FORMS.get(cacheKey, 'json')) || {};
					const updatedCache = { ...cache };

					// Get the list of users (for names/emails)
					const userList = (await env.FORMS.get(`forms:esn:${feedbackType}:${listType}`, 'json')) || [];
					// Build a map for quick lookup (email => name)
					const userMap = {};
					for (const user of userList) {
						userMap[user.email] = user.name;
					}

					// List all keys with the prefix, then filter out the list key and non-response keys
					const prefix = `forms:esn:${feedbackType}:`;
					const { keys } = await env.FORMS.list({ prefix });
					const responseKeys = keys.filter((key) => key.name.endsWith(':savedAnswers'));

					const responses = [];

					for (const keyInfo of responseKeys) {
						// Expect key format: forms:esn:${feedbackType}:${email}:savedAnswers
						const parts = keyInfo.name.split(':');
						if (parts.length !== 5) continue;
						const email = parts[3];

						// Use metadata from the list result
						const lastUpdated = keyInfo.metadata?.updatedAt || 0;

						// Only update if the new metadata is more recent or not cached yet
						if (!cache[email] || lastUpdated > cache[email]) {
							updatedCache[email] = lastUpdated;
						}

						// Fetch the actual data (you could optimize further if you cache data as well)
						const value = await env.FORMS.get(keyInfo.name);
						if (!value) continue;

						responses.push(JSON.parse(value));
					}

					await env.FORMS.put(cacheKey, JSON.stringify(updatedCache));
					if (partialUrl.includes('newbie')) {
						return new Response(newbieFeedbackResponses(userList, responses), { headers: { 'Content-Type': 'text/html' } });
					} else if (partialUrl.includes('volunteer')) {
						return new Response(volunteerFeedbackResponses(userList, responses), { headers: { 'Content-Type': 'text/html' } });
					}
				}

				// Existing newbieFeedback endpoint
				if (partialUrl === '/newbieFeedback') {
					const newbieList = (await env.FORMS.get('forms:esn:newbieFeedback:newbieList', 'json')) || [];
					const newbieEmails = newbieList.map((newbie) => newbie.email);

					if (!(newbieEmails.includes(email) || email.endsWith('@esnuam.org'))) {
						return Response.redirect(`https://forms.tablerus.es/retry?redirect=${encodeURIComponent(request.url)}`, 302);
					}

					if (request.method === 'POST') {
						const data = await request.json();
						await env.FORMS.put(`forms:esn:newbieFeedback:${email}:savedAnswers`, JSON.stringify(data), {
							metadata: { updatedAt: Date.now() },
						});
						return new Response('OK', { status: 200 });
					}

					if (newbieEmails.includes(email)) {
						return new Response(
							newbieFeedback(newbieList, email, (await env.FORMS.get(`forms:esn:newbieFeedback:${email}:savedAnswers`)) || '{}'),
							{ headers: { 'Content-Type': 'text/html' } }
						);
					} else {
						return new Response(
							newbieFeedbackFromVolunteers(
								newbieList,
								email,
								(await env.FORMS.get(`forms:esn:newbieFeedback:${email}:savedAnswers`)) || '{}'
							),
							{ headers: { 'Content-Type': 'text/html' } }
						);
					}
				}

				// Existing volunteerFeedback endpoint
				if (partialUrl === '/volunteerFeedback') {
					if (!email.endsWith('@esnuam.org')) {
						return Response.redirect(
							`https://forms.tablerus.es/retry?email=${encodeURIComponent('@esnuam.org')}&redirect=${encodeURIComponent(request.url)}`,
							302
						);
					}

					if (request.method === 'POST') {
						const data = await request.json();
						await env.FORMS.put(`forms:esn:volunteerFeedback:${email}:savedAnswers`, JSON.stringify(data), {
							metadata: { updatedAt: Date.now() },
						});
						return new Response('OK', { status: 200 });
					}

					return new Response(
						volunteerFeedback(
							await env.FORMS.get('forms:esn:volunteerFeedback:volunteerList'),
							email,
							(await env.FORMS.get(`forms:esn:volunteerFeedback:${email}:savedAnswers`)) || '{}'
						),
						{ headers: { 'Content-Type': 'text/html' } }
					);
				}
			}

			return new Response('Not Found', { status: 404 });
		} catch (e) {
			return new Response(e.stack || e, { status: 500 });
		}
	},
};
