<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	export let open = false;
	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			close();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
		on:click={close}
		on:keydown={(e) => e.key === 'Escape' && close()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<button
			class="fixed inset-0 bg-transparent cursor-pointer"
			on:click={close}
			on:keydown={(e) => e.key === 'Enter' && close()}
			aria-label="Schließen"
		></button>
		<div class="bg-white rounded-lg shadow-xl w-[80vw] max-h-[90vh] overflow-y-auto relative">
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-slate-800 m-0">Hilfe</h2>
					<button
						on:click={close}
						class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
						aria-label="Schließen"
					>
						×
					</button>
				</div>

				<div class="space-y-6">
					<section>
						<h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
							<span
								class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold"
								>1</span
							>
							Polygon zeichnen
						</h3>
						<ul class="text-slate-600 text-sm leading-relaxed space-y-2 list-none pl-0">
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Klicke auf den roten Button <strong>"Löschen + Eckpunkte setzen"</strong> um in den
									Zeichenmodus zu wechseln</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Klicke auf die weiße Canvas-Fläche um Eckpunkte für deinen Balkon zu setzen</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									><strong>Mindestens 3 Punkte</strong> sind erforderlich für ein geschlossenes Polygon</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									><strong>Tastaturbedienung auf Canvas:</strong>
									<code class="bg-gray-100 px-1 rounded text-xs">Pfeiltasten</code>
									für Position, <code class="bg-gray-100 px-1 rounded text-xs">Umschalt</code>+<code
										class="bg-gray-100 px-1 rounded text-xs">Pfeiltasten</code
									>
									für 10mm Schritte,
									<code class="bg-gray-100 px-1 rounded text-xs">Strg</code>+<code
										class="bg-gray-100 px-1 rounded text-xs">Pfeiltasten</code
									>
									für 1m Schritte, <code class="bg-gray-100 px-1 rounded text-xs">Leertaste</code> zum
									Setzen eines Punktes</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Klicke auf den blauen Button <strong>"Fertig"</strong> um das Polygon abzuschließen</span
								>
							</li>
						</ul>
					</section>

					<section>
						<h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
							<span
								class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold"
								>2</span
							>
							<span>Eckpunkte editieren</span>
						</h3>
						<ul class="text-slate-600 text-sm leading-relaxed space-y-2 list-none pl-0">
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Nach dem Zeichnen kannst du die Eckpunkte in der Seitenleiste unter <strong
										>"Balkon-Ecken"</strong
									> numerisch bearbeiten</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Ändere die X- und Y-Koordinaten in den Eingabefeldern oder entferne einzelne
									Punkte mit dem roten ×-Button</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span>Punkte können auch per <strong>Drag & Drop</strong> umsortiert werden</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Die Anzeige zeigt zusätzlich die <strong>Abstände und Winkel</strong> zum vorherigen
									Punkt</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Neue Punkte können über den Button <strong>"Neuen Eckpunkt hinzufügen"</strong> hinzugefügt
									werden.</span
								>
							</li>
						</ul>
					</section>

					<section>
						<h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
							<span
								class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold"
								>3</span
							>
							<span>Dielen-Einstellungen</span>
						</h3>
						<ul class="text-slate-600 text-sm leading-relaxed space-y-2 list-none pl-0">
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Wähle die <strong>Plankenbreite</strong> (in mm) und die
									<strong>Standardlängen der Rohdielen</strong>
									(kommasepariert, z.B.
									<code class="bg-gray-100 px-1 rounded text-xs">2000, 3000, 4500</code>)</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Festlegen, ob die Dielen von <strong>links nach rechts</strong> oder
									<strong>rechts nach links</strong> beginnen sollen</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span>Bodenkrallen und das Fugenband optional aktivieren</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Klicke auf den grünen <strong>"Verlegen"</strong>-Button um die Dielen zu
									generieren</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Klicke auf den grauen <strong>"Leeren"</strong>-Button um die Dielen wieder
									auszublenden</span
								>
							</li>
						</ul>
					</section>

					<section>
						<h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
							<span
								class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold"
								>4</span
							>
							<span>Querbalken</span>
						</h3>
						<ul class="text-slate-600 text-sm leading-relaxed space-y-2 list-none pl-0">
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Füge horizontale Querbalken für die <strong>Unterkonstruktion</strong> hinzu</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Gib die <strong>Y-Position</strong> (vertikal von oben) und die
									<strong>Breite</strong> (in mm) ein</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span>Querbalken werden automatisch auf das Polygon geclippt und visualisiert</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Bearbeiten oder entfernen einzelner Querbalken wie bei den Eckpunkten jederzeit
									möglich</span
								>
							</li>
						</ul>
					</section>

					<section>
						<h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
							<span
								class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold"
								>5</span
							>
							<span>Bodenkrallen</span>
						</h3>
						<ul class="text-slate-600 text-sm leading-relaxed space-y-2 list-none pl-0">
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Aktiviere die Checkbox <strong>"mit Bodenkrallen"</strong> zur Visualisierung</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span><strong>Grüne Kreise</strong> = Randkrallen (am Balkon-Rand)</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span><strong>Hellblaue Kreise</strong> = Innenkrallen</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Innere Krallen zu nah am Rand werden <strong>automatisch entfernt</strong></span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span>Gesamtanzahl wird in der Bestellübersicht angezeigt</span>
							</li>
						</ul>
					</section>

					<section>
						<h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
							<span
								class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold"
								>6</span
							>
							<span>Zuschnitt-Optimierung</span>
						</h3>
						<ul class="text-slate-600 text-sm leading-relaxed space-y-2 list-none pl-0">
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Algorithmus berechnet <strong>optimale Zuschnitt-Liste</strong> mit minimalem Verschnitt</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Umschalten zwischen <strong>"kann zugeschnitten werden"</strong> (optimiert) und
									<strong>"nicht zuschneidbar"</strong></span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									><strong>Sägeschnitt-Breite (Kerf)</strong> wird berücksichtigt — gib die Breite deines
									Sägeblatts ein</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									><strong>Globale Optimierung</strong> (ILP-Algorithmus) liefert bessere Ergebnisse bei
									größeren Problemen</span
								>
							</li>
						</ul>
					</section>

					<section>
						<h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
							<span
								class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold"
								>7</span
							>
							<span>Bestellübersicht</span>
						</h3>
						<ul class="text-slate-600 text-sm leading-relaxed space-y-2 list-none pl-0">
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span>Anzahl <strong>Rohdielen pro Standardlänge</strong></span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									><strong>Gruppierte Zuschnittliste</strong> — mehrfach vorkommende Listen werden zusammengefasst</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									><strong>Gesamtverschnitt</strong> aufgeteilt in Sägeverschnitt und Abschnitt</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span><strong>Fugenband-Länge</strong> (falls aktiviert)</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span><strong>Bodenkrallen-Anzahl</strong> (falls aktiviert)</span>
							</li>
						</ul>
					</section>

					<section>
						<h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
							<span
								class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold"
								>8</span
							>
							<span>Import/Export</span>
						</h3>
						<ul class="text-slate-600 text-sm leading-relaxed space-y-2 list-none pl-0">
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Klicke auf <strong>"Exportieren"</strong> um deine Konfiguration als JSON-Datei herunterzuladen</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Klicke auf <strong>"Importieren"</strong> um eine gespeicherte JSON-Datei wiederherzustellen</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Die Datei speichert: <strong>Balkon-Ecken</strong> (Polygon-Punkte) und
									<strong>Querbalken</strong> (Position und Breite)</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-500 mt-0.5">→</span>
								<span
									>Nützlich zum <strong>Speichern, Teilen oder Übertragen</strong> von Konfigurationen</span
								>
							</li>
						</ul>
					</section>
				</div>
			</div>
		</div>
	</div>
{/if}
