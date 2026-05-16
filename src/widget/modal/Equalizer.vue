<script setup lang="ts">
import { ref, reactive, onUnmounted, onMounted, watch, computed } from 'vue';
import {
	DialogClose,
	DialogContent,
	DialogOverlay,
	DialogPortal,
	DialogRoot,
	DialogTitle,
	DialogTrigger,
} from 'reka-ui';

import {
	SelectContent,
	SelectItem,
	SelectRoot,
	SelectTrigger,
	SelectViewport,
} from 'reka-ui';
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui';
import { useVideoStore } from '../../store/video';
import { storeToRefs } from 'pinia';
import Button from '../../components/ui/button.vue';
import Text from './Text.vue';
import IconLocal from '../../components/ui/icon-local.vue';

type Band = { freq: number; q: number; gain: number; label: string };

const videoStore = useVideoStore();
const { element, volume, muted } = storeToRefs(videoStore);
const canvasEl = ref<HTMLCanvasElement | null>(null);

let audioCtx: AudioContext | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let analyser: AnalyserNode | null = null;
let animationId = 0;
const filters: BiquadFilterNode[] = [];
let softClipper: WaveShaperNode | null = null;
let finalGain: GainNode | null = null;
let isEQEnabled = ref(false);

const bands = reactive<Band[]>([
	{ freq: 60, q: 1.0, gain: 0, label: 'Sub' },
	{ freq: 170, q: 1.0, gain: 0, label: 'Bass' },
	{ freq: 350, q: 1.0, gain: 0, label: 'Low-Mid' },
	{ freq: 1000, q: 1.0, gain: 0, label: 'Mid' },
	{ freq: 3500, q: 1.0, gain: 0, label: 'High-Mid' },
	{ freq: 10000, q: 1.0, gain: 0, label: 'Treble' },
]);

const savedPresets = reactive<Record<string, number[]>>(
	loadPresetsFromStorage()
);
const selectedPreset = ref('');

function loadPresetsFromStorage(): Record<string, number[]> {
	try {
		const raw = localStorage.getItem('vue-video-eq-presets');
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function persistPresets() {
	try {
		localStorage.setItem('vue-video-eq-presets', JSON.stringify(savedPresets));
	} catch {}
}

function savePreset(dname?: string) {
	const name =
		dname ??
		`preset-${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
	savedPresets[name] = bands.map(b => b.gain);
	persistPresets();
	selectedPreset.value = name;
}

// function loadSelectedPreset() {
//   if (!selectedPreset.value) return
//   const gains = savedPresets[selectedPreset.value]
//   if (!gains) return
//   gains.forEach((g, i) => { if (bands[i]) bands[i].gain = g })
//   applyGainsToFilters()
// }

const defaultPresets: Record<string, number[]> = {
	flat: bands.map(() => 0),
	bass: [6, 4, 2, 0, -1, -2],
	vocal: [-2, -1, 2.5, 3, 1, -1],
	treble: [-2, -1, 0, 1, 3, 5],
};

function applyPreset(name: string) {
	const allPresets = Object.assign({}, defaultPresets, savedPresets);
	const p = allPresets[name] || allPresets.flat;
	p.forEach((v, i) => {
		if (bands[i]) bands[i].gain = v;
	});
	applyGainsToFilters();
	selectedPreset.value = name; // Keep this if you want to ensure selection consistency
}

watch(selectedPreset, newPreset => {
	if (newPreset) {
		applyPreset(newPreset);
	}
});

function findVideoElement(): HTMLVideoElement | null {
	const fromStore = element.value;
	if (fromStore instanceof HTMLVideoElement) return fromStore;
	const vid = document.querySelector('video');
	return vid instanceof HTMLVideoElement ? vid : null;
}

function createSoftClipperCurve(amount = 0.5) {
	const samples = 44100;
	const curve = new Float32Array(samples);
	const k = amount * 100;
	const deg = Math.PI / 180;
	for (let i = 0; i < samples; i++) {
		const x = (i * 2) / samples - 1;
		curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
	}
	return curve;
}

function initializeAudioContext() {
	const vid = findVideoElement();
	if (!vid) {
		console.warn('Видео не найдено на странице.');
		return false;
	}

	try {
		audioCtx = new (window.AudioContext ||
			(window as any).webkitAudioContext)();
		analyser = audioCtx.createAnalyser();
		analyser.fftSize = 2048;

		filters.length = 0;
		finalGain = audioCtx.createGain();
		syncVolumeAndMute(); // Синхронизируем громкость при инициализации
		softClipper = audioCtx.createWaveShaper();
		softClipper.curve = createSoftClipperCurve(0.25);
		softClipper.oversample = '4x';

		console.log('AudioContext инициализирован');
		return true;
	} catch (e) {
		console.error('Ошибка инициализации AudioContext:', e);
		alert('Ошибка инициализации аудио-контекста.');
		cleanupAudioContext();
		return false;
	}
}

function enableEQ() {
	if (!audioCtx || audioCtx.state === 'closed') {
		if (!initializeAudioContext()) return;
	}
	if (!audioCtx || audioCtx.state !== 'running') {
		console.warn('AudioContext не инициализирован или не запущен');
		return;
	}

	const vid = findVideoElement();
	if (!vid) {
		console.warn('Видео не найдено на странице.');
		return;
	}

	try {
		if (!finalGain) return;

		// Создаем фильтры если их нет
		if (filters.length === 0) {
			bands.forEach(band => {
				const filter = audioCtx!.createBiquadFilter();
				filter.type = 'peaking';
				filter.frequency.value = band.freq;
				filter.Q.value = band.q;
				filter.gain.value = band.gain;
				filters.push(filter);
			});
		}

		if (!sourceNode) {
			sourceNode = audioCtx.createMediaElementSource(vid);
		}
		sourceNode.disconnect();

		let prev: AudioNode = sourceNode;
		filters.forEach(f => {
			prev.connect(f);
			prev = f;
		});
		prev.connect(finalGain);
		finalGain.connect(analyser!);
		analyser!.connect(audioCtx.destination);

		syncVolumeAndMute(); // Синхронизируем громкость при включении EQ
		isEQEnabled.value = true;
		console.log('Эквалайзер включён');
		drawVisualizer();
	} catch (e) {
		console.error('Ошибка при включении эквалайзера:', e);
		alert('Не удалось включить эквалайзер.');
	}
}

function disableEQ() {
	cleanupAudioContext();
}

function cleanupAudioContext() {
	if (animationId) {
		cancelAnimationFrame(animationId);
		animationId = 0;
	}

	if (sourceNode) {
		try {
			sourceNode.disconnect();
		} catch (e) {
			console.warn('Ошибка при отключении sourceNode:', e);
		}
	}

	if (audioCtx && audioCtx.state !== 'closed') {
		try {
			audioCtx.close();
		} catch (e) {
			console.warn('Ошибка при закрытии AudioContext:', e);
		}
	}

	audioCtx = null;
	sourceNode = null;
	analyser = null;
	filters.length = 0;
	softClipper = null;
	finalGain = null;
	isEQEnabled.value = false;

	const vid = findVideoElement();
	if (vid) {
		if (videoStore.playing) {
			vid
				.play()
				.catch(e =>
					console.warn('Ошибка при восстановлении воспроизведения:', e)
				);
		}
	}
}

function updateBand(i: number) {
	if (!audioCtx || audioCtx.state !== 'running' || !filters[i]) return;
	filters[i].gain.value = bands[i].gain;
}

function applyGainsToFilters() {
	if (!audioCtx || audioCtx.state !== 'running') return;
	bands.forEach((b, i) => {
		if (filters[i]) filters[i].gain.value = b.gain;
	});
}

function syncVolumeAndMute() {
	if (finalGain) {
		finalGain.gain.value = muted.value ? 0 : volume.value / 100;
	}
}

function drawVisualizer() {
	if (
		!analyser ||
		!canvasEl.value ||
		!audioCtx ||
		audioCtx.state !== 'running'
	) {
		console.warn(
			'Визуализатор не может быть запущен: отсутствует analyser или canvas'
		);
		return;
	}

	const canvas = canvasEl.value;
	const ctx = canvas.getContext('2d')!;

	// Подгоняем canvas под devicePixelRatio
	const dpr = window.devicePixelRatio || 1;
	canvas.width = canvas.clientWidth * dpr;
	canvas.height = canvas.clientHeight * dpr;
	ctx.scale(dpr, dpr);

	const bufferLength = analyser.frequencyBinCount;
	const data = new Uint8Array(bufferLength);

	function draw() {
		if (
			!analyser ||
			!canvasEl.value ||
			!audioCtx ||
			audioCtx.state !== 'running'
		) {
			cancelAnimationFrame(animationId);
			animationId = 0;
			console.warn('Остановка визуализатора: контекст или узлы недоступны');
			return;
		}

		analyser.getByteFrequencyData(data);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const barWidth = (canvas.width / bufferLength) * 5;
		let x = 0;
		for (let i = 0; i < bufferLength; i++) {
			const v = data[i] / 255;
			const y = v * canvas.height;
			ctx.fillStyle = `rgba(255,255,255,1)`;
			ctx.fillRect(x, canvas.height - y, barWidth - 1, y);
			x += barWidth;
		}
		animationId = requestAnimationFrame(draw);
	}
	draw();
}
// Отслеживаем изменение видеоэлемента
watch(element, (newVideo, oldVideo) => {
	if (newVideo !== oldVideo) {
		console.log('Видеоэлемент изменился, переинициализируем AudioContext');
		cleanupAudioContext();
		if (initializeAudioContext() && isEQEnabled.value) {
			enableEQ();
		}
	}
});

// Отслеживаем открытие диалога и наличие canvas
watch([canvasEl], ([canvas]) => {
	if (canvas && !audioCtx) {
		if (initializeAudioContext() && isEQEnabled.value) {
			enableEQ();
		}
	}
	if (canvas && analyser && audioCtx?.state === 'running' && !animationId) {
		drawVisualizer();
	} else if (!animationId) {
		cancelAnimationFrame(animationId);
		animationId = 0;
	}
});

// Синхронизируем громкость и mute с finalGain
watch([volume, muted], () => {
	syncVolumeAndMute();
});

onMounted(() => {
	initializeAudioContext();
});

function renamePreset(oldName: string, newName: string) {
	if (!savedPresets[oldName]) {
		console.warn(`Preset "${oldName}" not found in saved presets`);
		return false;
	}
	if (!newName.trim()) {
		console.warn('New preset name cannot be empty');
		return false;
	}
	if (savedPresets[newName] || defaultPresets[newName]) {
		console.warn(`Preset name "${newName}" already exists`);
		return false;
	}
	savedPresets[newName] = savedPresets[oldName];
	delete savedPresets[oldName];
	persistPresets();
	if (selectedPreset.value === oldName) {
		selectedPreset.value = newName;
	}
	return true;
}

function deletePreset(name: string) {
	if (!savedPresets[name]) {
		console.warn(`Preset "${name}" not found in saved presets`);
		return false;
	}
	if (defaultPresets[name]) {
		console.warn(`Cannot delete default preset "${name}"`);
		return false;
	}
	delete savedPresets[name];
	persistPresets();
	if (selectedPreset.value === name) {
		selectedPreset.value = '';
		applyPreset('flat');
	}
	return true;
}

onUnmounted(() => {
	cleanupAudioContext();
});

function toggleEQ() {
	if (isEQEnabled.value) {
		disableEQ();
	} else {
		enableEQ();
	}
}

const presets = computed(() => [
	...Object.keys(defaultPresets),
	...Object.keys(savedPresets),
]);
</script>

<template>
	<DialogRoot>
		<DialogTrigger as-child>
			<slot />
		</DialogTrigger>

		<DialogPortal force-mount>
			<DialogOverlay class="DialogOverlay" />
			<DialogContent class="DialogContent">
				<div
					style="
						display: flex;
						align-items: center;
						justify-content: space-between;
						gap: 12px;
					"
				>
					<DialogTitle class="DialogTitle">Эквалайзер</DialogTitle>
					<div style="display: flex; gap: 2px; align-items: center">
						<Button @click="toggleEQ">
							<IconLocal v-if="isEQEnabled" icon="mdi:power" />
							<IconLocal v-else icon="mdi:power-off" />
						</Button>
						<DialogClose as-child>
							<Button aria-label="Close">
								<IconLocal icon="mdi:close" />
							</Button>
						</DialogClose>
					</div>
				</div>
				<div
					class="SelectWrapper"
					style="
						display: flex;
						gap: 4px;
						align-items: center;
						flex-wrap: wrap;
						z-index: 1;
					"
				>
					<SelectRoot class="SelectRoot" v-model="selectedPreset">
						<SelectTrigger class="SelectTrigger">
							<div>{{ selectedPreset == '' ? 'Обычный' : selectedPreset }}</div>
							<IconLocal icon="radix-icons:chevron-down" />
						</SelectTrigger>

						<SelectContent>
							<SelectViewport as-child>
								<div class="SelectViewport">
									<SelectItem
										@select="
											e => {
												e.preventDefault;
											}
										"
										v-for="k in presets"
										:key="k"
										:value="k"
										class="SelectItem"
									>
										<div class="SelectItemLabel" @click="applyPreset(k)">
											{{ k }}
										</div>
										<div
											@click="e => e.stopPropagation()"
											class="SelectItemAction"
										>
											<Text
												placeholder="Введите название пресета"
												@submit="t => renamePreset(k, t)"
												><Button @click="e => e.stopPropagation()"
													><IconLocal icon="material-symbols:edit-rounded" /></Button
											></Text>
											<Button
												@click="
													e => {
														e.stopPropagation();
														deletePreset(k);
													}
												"
												><IconLocal icon="material-symbols:delete-rounded"
											/></Button>
										</div>
									</SelectItem>
								</div>
							</SelectViewport>
						</SelectContent>
					</SelectRoot>

					<Text placeholder="Введите название пресета" @submit="savePreset"
						><Button><IconLocal icon="material-symbols-light:save" /></Button
					></Text>
				</div>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px">
					<div
						v-for="(b, i) in bands"
						:key="b.freq"
						style="
							display: flex;
							flex-direction: column;
							align-items: center;
							gap: 6px;
						"
					>
						<div style="text-align: center; font-weight: 600">
							<small>{{ b.freq }} Hz</small>
						</div>
						<SliderRoot
							:model-value="[b.gain]"
							@update:model-value="(val) => { b.gain = val![0]; updateBand(i) }"
							class="SliderRoot"
							:min="-12"
							:max="12"
							:step="0.1"
							orientation="vertical"
						>
							<SliderTrack class="SliderTrack">
								<SliderRange class="SliderRange" />
							</SliderTrack>
							<SliderThumb class="SliderThumb" aria-label="Value">
								<div class="SliderValue">{{ b.gain.toFixed(1) }} dB</div>
							</SliderThumb>
						</SliderRoot>
					</div>
				</div>

				<canvas
					ref="canvasEl"
					height="100"
					style="
						margin-top: 10px;
						border-radius: 6px;
						background: transparent;
						height: 100px;
					"
				></canvas>
			</DialogContent>
		</DialogPortal>
	</DialogRoot>
</template>

<style scoped>
.SelectItem:hover .SelectItemAction {
	opacity: 1;
}
.SelectItemLabel {
	white-space: nowrap;
}
.SelectItemAction {
	display: flex;
	gap: 2px;
	opacity: 0;
	align-items: center;
	right: 0px;
	top: 0px;
	height: 100%;
	transition: all 0.2s ease-in-out;
}

.SelectWrapper > div:empty {
	display: none;
}
.SelectRoot {
	z-index: 100;
}
.SelectTrigger {
	display: flex;
	z-index: 100;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	overflow: hidden;
	padding: 4px;
	gap: 5px;
	background-color: var(--secondary-glass);
	backdrop-filter: blur(10px);
	border: 1px solid var(--secondary);
}

.SelectViewport {
	z-index: 1000;
	position: absolute !important;
	top: 16px;
	padding: 5px;
	animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
	background-color: var(--background-glass);
	border: 1px solid var(--secondary);
	border-radius: 6px;
	opacity: 1;
	transition: all 0.2s ease-in-out;
	display: flex;
	gap: 2px;
	max-height: 200px;
	overflow-y: auto;
	flex-direction: column;
	backdrop-filter: blur(10px);
}

.SelectIcon {
	color: Var(--grass-11);
}

.SelectContent {
	overflow: hidden;
}

.SelectItem {
	position: relative;
	border-radius: 3px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 32px;
	position: relative;
	user-select: none;
	white-space: nowrap;
	padding: 4px 4px;
	align-items: center;
}
.SelectItem:hover {
	background-color: var(--background-glass);
	backdrop-filter: blur(10px);
	border-radius: 6px;
}

.SelectItem[data-disabled] {
	color: var(--mauve-8);
	pointer-events: none;
}
.SelectItem[data-highlighted] {
	outline: none;
	background-color: var(--grass-9);
	color: var(--grass-1);
}
button,
fieldset,
input {
	all: unset;
}

.DialogOverlay {
	position: fixed;
	inset: 0;
	animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.DialogContent {
	position: fixed;
	bottom: 20px;
	z-index: 100;
	right: 20px;
	padding: 12px;
	animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
	background-color: var(--background-glass);
	border: 1px solid var(--secondary);
	border-radius: 6px;
	opacity: 1;
	transition: all 0.2s ease-in-out;
	display: flex;
	gap: 4px;
	flex-direction: column;
	backdrop-filter: blur(10px);
}

.DialogTitle {
	margin: 0;
	font-weight: 500;
	color: var(--mauve-12);
	font-size: 20px;
}

.SliderRoot {
	position: relative;
	display: flex;
	align-items: center;
	user-select: none;
	touch-action: none;
	height: 140px;
	width: 20px;
}

.SliderTrack {
	background-color: var(--secondary);
	position: relative;
	flex-grow: 1;
	border-radius: 9999px;
	width: 3px;
	height: 100%;
}

.SliderRange {
	position: absolute;
	background-color: white;
	border-radius: 9999px;
	height: 100%;
}

.SliderThumb {
	display: block;
	width: 20px;
	height: 20px;
	background-color: var(--foreground);
	border-radius: 10px;
}

.SliderValue {
	position: absolute;
	white-space: nowrap;
	top: -50px;
	left: 50%;
	transform: translateX(-50%);
	background-color: var(--background-glass);
	border: 1px solid var(--secondary);
	border-radius: 6px;
	opacity: 0;
	transition: all 0.2s ease-in-out;
	display: flex;
	padding: 4px;
	gap: 4px;
	flex-direction: column;
	backdrop-filter: blur(10px);
	font-size: 12px;
	padding: 6px;
}

.SliderThumb:hover > .SliderValue,
.SliderThumb:focus > .SliderValue {
	opacity: 1;
}

@keyframes overlayShow {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes contentShow {
	from {
		opacity: 0;
		transform: translate(-50%, -48%) scale(0.96);
	}
	to {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1);
	}
}
</style>
