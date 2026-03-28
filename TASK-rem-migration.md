# Úloha: Migrácia px → rem jednotiek (Accessibility)

## Prečo

Keď používateľ má v OS alebo browseri nastavené väčšie písmo (napr. 20px namiesto 16px),
všetky `font-size: Xpx` hodnoty to **ignorujú** — text ostáva malý.
Hodnoty v `rem` sa automaticky prispôsobia nastaveniu používateľa.

---

## Stratégia: 62.5% trik

Pridať na začiatok `app.css` (pred prvý `:root` blok):

```css
html {
  font-size: 62.5%; /* 1rem = 10px pri default nastavení browsera */
}
```

Potom pridať do existujúceho `body` bloku (riadok ~237 v app.css):

```css
body {
  font-size: 1.6rem; /* = 16px */
  /* ... ostatné vlastnosti zostávajú ... */
}
```

**Výsledok:** prepočet je triviálny — číslo v px ÷ 10 = hodnota v rem:
- `10px → 1rem`
- `13px → 1.3rem`
- `16px → 1.6rem`
- `24px → 2.4rem`
- `32px → 3.2rem`

---

## Rozsah — čo meniť

### ✅ VŽDY konvertovať na rem:
- `font-size`
- `line-height` (ak je v px)
- `letter-spacing` (ak je v px)

### ✅ ODPORÚČANÉ konvertovať na rem:
- `padding`, `margin`, `gap` — priestor okolo textu má škálovať spolu s ním

### ❌ NECHAŤ v px:
- `border-width` (napr. `border: 1px solid`) — 1px border má ostať 1px
- `border-radius` — dekorácia
- `box-shadow` — vizuálny efekt
- `width` / `height` fixné rozmerové kontajnery — neškalujú sa s textom
- `top`, `left`, `bottom`, `right` absolútne pozície — súradnicové, nie textové
- `transform: translateX/Y` v px — súradnicové

---

## Súbory a počet výskytov `font-size: Xpx`

| Súbor | Počet `font-size` v px | Priorita |
|---|---|---|
| `src/app.css` | **76** | 🔴 Vysoká — globálny základ |
| `src/lib/components/Fix.svelte` | **28** | 🔴 Vysoká — hlavný komponent |
| `src/lib/components/MarkerPopup.svelte` | **22** | 🟡 Stredná — inline HTML string |
| `src/lib/components/Navigation.svelte` | **13** | 🟡 Stredná |
| `src/lib/components/SavedPlaces.svelte` | **12** | 🟡 Stredná |
| `src/lib/components/MobileSidePanel.svelte` | **10** | 🟡 Stredná |
| `src/lib/components/TimeSlider.svelte` | **9** | 🟢 Nízka |
| `src/lib/components/ThemeSwitcher.svelte` | **6** | 🟢 Nízka |
| `src/lib/components/SearchModal.svelte` | **4** | 🟢 Nízka |
| `src/lib/components/SearchBar.svelte` | **2** | 🟢 Nízka |
| `src/lib/components/WeatherLegend.svelte` | **1** | 🟢 Nízka |
| `src/lib/components/WeatherCharts.svelte` | **0** | ✅ Hotové |

**Celkovo: ~185 výskytov `font-size` v px**
**+ ~99 výskytov `padding/margin/gap` v px v samotnom app.css**

---

## Špeciálne úskalia

### 1. MarkerPopup.svelte — inline HTML string
Tento komponent generuje HTML ako JavaScript string (funkcia `generatePopupHTML()`).
Font-size hodnoty sú vnorené v JS template literals:
```js
return `<div style="font-size: 25px; ...">`;
```
Rem **funguje** aj v inline štýloch — vzťahuje sa na root html element.
→ Konvertovať rovnako, len pozor na syntax v JS stringu.

### 2. app.css má dva `:root` bloky a dva `body` bloky
- Prvý `:root` (riadok 3) — SvelteKit default premenné, nechať
- Druhý `:root` (riadok 114) — weather app CSS premenné, nechať
- Prvý `body` (riadok 19) — SvelteKit default, nechať
- Druhý `body` (riadok 237) — weather app body, **sem pridať `font-size: 1.6rem`**
- `html { font-size: 62.5% }` pridať **pred riadok 114** (začiatok weather app sekcie)

### 3. MapLibre / MapTiler SDK
Mapa sama o sebe nepoužíva rem — jej interné CSS je scoped a nezávisí od root font-size.
Atribúcia, zoom controls a podobné prvky mapy môžu byť ovplyvnené.
→ Po migrácii vizuálne skontrolovať zoom buttons, attribution text a popups mapy.

### 4. Existujúce rem hodnoty v app.css
Niektoré hodnoty sú **už v rem** (napr. riadky 74, 79, 105) — tie nechať bez zmeny.

### 5. vw jednotky
Jeden výskyt `font-size: 4.7vw` (riadok 778) — nechať, je to responzívna hodnota zámerná.

---

## Odporúčané poradie práce

1. **Pridať `html { font-size: 62.5% }`** do app.css
2. **Pridať `font-size: 1.6rem`** na body (riadok ~237)
3. **Testovať** či sa nič nerozbilo (mapa, popup, panels)
4. **app.css** — konvertovať `font-size` px → rem sekciu po sekcii
5. **Fix.svelte** — konvertovať `font-size` a padding/gap v `<style>` bloku
6. **MarkerPopup.svelte** — konvertovať inline štýly v JS stringu
7. **Ostatné komponenty** — postupne podľa priority

---

## Testovanie po migrácii

- [ ] V Chrome DevTools → Settings → **Font size: Large** — skontrolovať škálovanie
- [ ] Mapa sa renderuje správne (zoom controls, attribution)
- [ ] Popup sa zobrazuje správne
- [ ] MobileSidePanel — všetky sekcie čitateľné
- [ ] 5-dňová predpoveď — extra info sekcia
- [ ] 7-dňová predpoveď (WeatherCharts)
- [ ] Hourly chart
- [ ] Vyhľadávacie pole (SearchBar/SearchModal)
- [ ] Testovať na mobile (Android Capacitor build)

---

## Poznámka k `em` vs `rem`

| | `rem` | `em` |
|---|---|---|
| Závisí od | root `html` font-size | parent element font-size |
| Výhodné pre | font-size, globálne spacing | komponent-interné spacing |
| Riziko | žiadne | nested elements — kaskádové násobenie |

Pre tento projekt odporúčam **iba `rem`** — jednoduchšie, predvídateľnejšie.

---

*Pripravené: 2026-03-28 | Projekt: sveltekit-pocasie (Meteo Zoomy)*
