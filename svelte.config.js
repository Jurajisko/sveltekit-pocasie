import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: vercel(),
    alias: {
      $app: 'node_modules/@sveltejs/kit/src/app'
    }
  }
};

export default config;
