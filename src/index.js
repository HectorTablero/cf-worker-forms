export const retryPage = (redirect) => `
<!DOCTYPE html>
<html>
<head>
  <title>Access Denied</title>
</head>
<body>
  <h1>Invalid Email Domain</h1>
  <p>Please use an email ending with @esnuam.org</p>
  <a href="https://workers.tablerus.es/auth/logout?login=1&redirect=${encodeURIComponent(redirect)}">
    Try different account
  </a>
</body>
</html>`;

export const loginPage = (redirect) => `
<!DOCTYPE html>
<html>
<head>
  <title>Login</title>
</head>
<body>
  <h1>Login Required</h1>
  <a href="https://workers.tablerus.es/auth/login?redirect=${encodeURIComponent(redirect)}">
    Login with Email
  </a>
</body>
</html>`;

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.pathname === '/') {
			return new Response(null, { status: 200 });
		} else if (url.pathname === '/login') {
			return new Response(loginPage(url.searchParams.get('redirect') || 'https://forms.tablerus.es'), {
				headers: { 'Content-Type': 'text/html' },
			});
		} else if (url.pathname === '/retry') {
			return new Response(retryPage(url.searchParams.get('redirect') || 'https://forms.tablerus.es'), {
				headers: { 'Content-Type': 'text/html' },
			});
		}

		const cookies = request.headers.get('Cookie') || '';
		const oauthId = cookies.match(/oauthId=([^;]*)/)?.[1];
		if (!oauthId) {
			return Response.redirect(`https://forms.tablerus.es/login?redirect=${encodeURIComponent(request.url)}`, 302);
		}
		let email = await env.FORMS.get(`auth:${oauthId}`, 'json');
		if (!email) {
			email = (await env.AUTH.verifyAuth(oauthId)).data.email;
		}
		if (!email.endsWith('@esnuam.org')) {
			return Response.redirect(`https://forms.tablerus.es/retry?redirect=${encodeURIComponent(request.url)}`, 302);
		}
		return new Response('OK', { status: 200 });
	},
};
