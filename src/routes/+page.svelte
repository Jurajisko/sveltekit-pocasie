<!-- src/routes/+page.svelte -->
<h1>Hello Juraj! 🎉</h1>

<p>Tvoja SvelteKit aplikácia funguje perfektne!</p>

<div class="info">
  <h2>✅ Test úspešný!</h2>
  <p>Ak vidíš túto stránku, všetko je OK.</p>
  
  <div class="details">
    <p><strong>Projekt:</strong> Weather App Pro</p>
    <p><strong>Framework:</strong> SvelteKit</p>
    <p><strong>Hosting:</strong> Vercel</p>
    <p><strong>Status:</strong> 🟢 Funkčné</p>
  </div>
</div>

<style>
  h1 {
    color: #667eea;
    font-size: 3rem;
    text-align: center;
    margin: 2rem 0;
  }
  
  p {
    font-size: 1.2rem;
    text-align: center;
    color: #333;
  }
  
  .info {
    max-width: 600px;
    margin: 3rem auto;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 10px;
    border-left: 5px solid #667eea;
  }
  
  .details {
    margin-top: 2rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
  }
  
  .details p {
    text-align: left;
    margin: 0.5rem 0;
    font-size: 1rem;
  }
</style>