import type { RequestHandler } from '@sveltejs/kit';

// Permite que Chrome DevTools auto-configure el workspace del proyecto.
// Más info: https://svelte.dev/docs/cli/devtools-json
export const GET: RequestHandler = () => {
	return new Response(JSON.stringify({}), {
		headers: { 'Content-Type': 'application/json' }
	});
};
