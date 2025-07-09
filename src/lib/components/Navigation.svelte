<!-- src/lib/components/Navigation.svelte - Updated with multilang -->
<script>
	import { currentLanguage, switchLanguage } from '$lib/stores/language.js';

	export let showMenu = false;

	function closeMenu() {
		showMenu = false;
	}

	function navigateTo(section) {
		console.log('Navigate to:', section);
		closeMenu();
		// TODO: Add navigation logic here
	}

	function handleLanguageSwitch(lang) {
		switchLanguage(lang);
		// Update active language button
		activeLanguage = lang;
	}

	let activeLanguage = $currentLanguage;
</script>

{#if showMenu}
	<div class="nav-menu">
		<div class="nav-header">
			<div class="nav-logo">
				<div class="globe-icon">🌍</div>
				<T key="meteomy" />
			</div>
			<button class="close-btn" on:click={closeMenu}>✕</button>
		</div>

		<div class="nav-content">
			<!-- Main Navigation -->
			<div class="nav-section">
				<div class="nav-section-title"><T key="weather" /></div>
				<button class="nav-item active" on:click={() => navigateTo('home')}>
					<div class="nav-icon">🏠</div>
					<div class="nav-text"><T key="home" /></div>
				</button>
				<button class="nav-item" on:click={() => navigateTo('forecast')}>
					<div class="nav-icon">📊</div>
					<div class="nav-text"><T key="forecast" /></div>
				</button>
				<button class="nav-item" on:click={() => navigateTo('radar')}>
					<div class="nav-icon">🌦️</div>
					<div class="nav-text"><T key="radar_maps" /></div>
				</button>
				<button class="nav-item" on:click={() => navigateTo('alerts')}>
					<div class="nav-icon">⚠️</div>
					<div class="nav-text"><T key="alerts" /></div>
					<div class="nav-badge">2</div>
				</button>
				<button class="nav-item" on:click={() => navigateTo('places')}>
					<div class="nav-icon">📍</div>
					<div class="nav-text"><T key="my_places" /></div>
				</button>
			</div>

			<div class="nav-divider"></div>

			<!-- Premium Features -->
			<div class="nav-section">
				<div class="nav-section-title"><T key="premium" /></div>
				<button class="nav-item" on:click={() => navigateTo('ai-insights')}>
					<div class="nav-icon">🤖</div>
					<div class="nav-text"><T key="ai_insights" /></div>
					<div class="nav-premium"><T key="pro" /></div>
				</button>
				<button class="nav-item" on:click={() => navigateTo('extended-forecast')}>
					<div class="nav-icon">📈</div>
					<div class="nav-text"><T key="extended_forecast" /></div>
					<div class="nav-premium"><T key="pro" /></div>
				</button>
			</div>

			<!-- Language Switcher -->
			<div class="language-switcher">
				<button 
					class="lang-option" 
					class:active={activeLanguage === 'sk'}
					on:click={() => handleLanguageSwitch('sk')}
				>
					🇸🇰 SK
				</button>
				<button 
					class="lang-option" 
					class:active={activeLanguage === 'en'}
					on:click={() => handleLanguageSwitch('en')}
				>
					🇬🇧 EN
				</button>
				<button 
					class="lang-option" 
					class:active={activeLanguage === 'de'}
					on:click={() => handleLanguageSwitch('de')}
				>
					🇩🇪 DE
				</button>
			</div>
		</div>

		<div class="nav-footer">
			<div class="user-info">
				<div class="user-avatar">JU</div>
				<div class="user-details">
					<div class="user-name">Juraj Usko</div>
					<div class="user-plan"><T key="free_plan" /></div>
				</div>
			</div>
			<button class="upgrade-btn" on:click={() => navigateTo('upgrade')}>
				⭐ <T key="upgrade_to_pro" />
			</button>
		</div>
	</div>
{/if}

<style>
	/* Same styles as before... */
	.nav-menu {
		position: fixed;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 400px;
		height: 100vh;
		background: white;
		z-index: 2000;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 20px rgba(0,0,0,0.15);
	}

	.nav-header {
		padding: 20px;
		border-bottom: 1px solid #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 24px;
		font-weight: 600;
		color: #2563eb;
	}

	.globe-icon {
		width: 32px;
		height: 32px;
		background: #2563eb;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 16px;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border: none;
		background: none;
		cursor: pointer;
		color: #6b7280;
		font-size: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-content {
		flex: 1;
		padding: 20px 0;
		overflow-y: auto;
	}

	.nav-section {
		margin-bottom: 30px;
	}

	.nav-section-title {
		font-size: 14px;
		font-weight: 600;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 15px;
		padding: 0 20px;
	}

	.nav-item {
		display: flex;
		align-items: center;
		padding: 12px 20px;
		color: #374151;
		text-decoration: none;
		transition: all 0.3s ease;
		font-size: 16px;
		border: none;
		background: none;
		width: 100%;
		cursor: pointer;
		text-align: left;
	}

	.nav-item:hover {
		background: #f9fafb;
		color: #2563eb;
	}

	.nav-item.active {
		background: #eff6ff;
		color: #2563eb;
		border-right: 3px solid #2563eb;
	}

	.nav-icon {
		width: 24px;
		height: 24px;
		margin-right: 15px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
	}

	.nav-text {
		flex: 1;
		text-align: left;
	}

	.nav-badge {
		background: #ef4444;
		color: white;
		font-size: 12px;
		padding: 2px 6px;
		border-radius: 10px;
		font-weight: 500;
	}

	.nav-premium {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 8px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.nav-divider {
		height: 1px;
		background: #f3f4f6;
		margin: 15px 20px;
	}

	.nav-footer {
		padding: 20px;
		border-top: 1px solid #f3f4f6;
		background: #f9fafb;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 15px;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 16px;
	}

	.user-details {
		flex: 1;
	}

	.user-name {
		font-size: 14px;
		font-weight: 600;
		color: #1f2937;
	}

	.user-plan {
		font-size: 12px;
		color: #6b7280;
	}

	.upgrade-btn {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		width: 100%;
	}

	.upgrade-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
	}

	.language-switcher {
		display: flex;
		background: #f3f4f6;
		border-radius: 8px;
		padding: 4px;
		margin: 15px 20px;
	}

	.lang-option {
		flex: 1;
		padding: 8px 12px;
		text-align: center;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		background: none;
	}

	.lang-option.active {
		background: white;
		color: #2563eb;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	.lang-option:not(.active) {
		color: #6b7280;
	}

	.lang-option:not(.active):hover {
		color: #374151;
	}
</style>