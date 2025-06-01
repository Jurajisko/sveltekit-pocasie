import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: vercel({
      // Vercel-specific optimizations
      runtime: 'nodejs18.x',
      regions: ['fra1'], // Frankfurt pre European users
    }),
    methodOverride: {
      allowed: ['PATCH', 'DELETE']
    },
    // Optimizations pre Weather App
    preload: {
      strategy: 'modulepreload'
    }
  }
};

export default config;