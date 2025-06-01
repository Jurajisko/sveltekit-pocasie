import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			runtime: 'nodejs18.x',
			regions: ['fra1']
		}),
		methodOverride: {
			allowed: ['PATCH', 'DELETE']
		}
	}
};

export default config;