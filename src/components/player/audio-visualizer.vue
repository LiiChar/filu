<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useVideoStore } from '../../store/video';
import { storeToRefs } from 'pinia';

const videoStore = useVideoStore();
const { playing, element } = storeToRefs(videoStore);

const svgRef = ref<SVGSVGElement | null>(null);
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let animationId = 0;
let bars = ref<
	Array<{ height: number; x: number; width: number; isDot: boolean }>
>([]);
let time = ref(0);

const barCount = 32;
const barWidth = 8;
const maxHeight = 120;

// Массив для хранения предыдущих значений для сглаживания
let previousHeights = new Array(barCount).fill(0);

// Функция сглаживания значений
const smoothValue = (
	newValue: number,
	index: number,
	smoothingFactor: number = 0.7
) => {
	const previousValue = previousHeights[index];
	const smoothedValue =
		previousValue * smoothingFactor + newValue * (1 - smoothingFactor);
	previousHeights[index] = smoothedValue;
	return smoothedValue;
};

const initializeAudioContext = () => {
	if (!element.value || !(element.value instanceof HTMLAudioElement))
		return false;

	try {
		audioContext = new (window.AudioContext ||
			(window as any).webkitAudioContext)();
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;
		analyser.smoothingTimeConstant = 0.8;

		// Проверяем CORS настройки
		if (element.value.crossOrigin !== 'anonymous') {
			console.warn('Аудио элемент не имеет crossorigin="anonymous"');
		}

		sourceNode = audioContext.createMediaElementSource(element.value);
		sourceNode.connect(analyser);
		analyser.connect(audioContext.destination);

		return true;
	} catch (error) {
		console.error('Ошибка инициализации AudioContext:', error);
		if (error instanceof Error) {
			if (error.message?.includes('CORS') || error.name === 'SecurityError') {
				console.warn('CORS ошибка, визуализация отключена');
				return false;
			}
		}
		return false;
	}
};

const updateBars = () => {
	if (!analyser) {
		// Fallback анимация
		time.value += 0.05;
		bars.value = Array.from({ length: barCount }, (_, i) => {
			const wave1 = Math.sin(time.value + i * 0.2) * 0.5 + 0.5;
			const wave2 = Math.sin(time.value * 1.5 + i * 0.3) * 0.3 + 0.3;
			const wave3 = Math.sin(time.value * 2 + i * 0.1) * 0.2 + 0.2;

			const normalizedValue = (wave1 + wave2 + wave3) / 3;
			const rawHeight = normalizedValue * maxHeight;
			const height = smoothValue(rawHeight, i);

			return {
				height,
				x: i * (barWidth + 2),
				width: barWidth,
				isDot: height <= barWidth, // Определяем, должна ли быть точка
			};
		});
		return;
	}

	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);
	analyser.getByteFrequencyData(dataArray);

	bars.value = Array.from({ length: barCount }, (_, i) => {
		const dataIndex = Math.floor((i / barCount) * bufferLength);
		const value = dataArray[dataIndex];
		const normalizedValue = value / 255;
		const rawHeight = normalizedValue * maxHeight;
		const height = smoothValue(rawHeight, i);

		return {
			height,
			x: i * (barWidth + 2),
			width: barWidth,
			isDot: height <= barWidth, // Определяем, должна ли быть точка
		};
	});
};

const animate = () => {
	if (!playing.value) {
		cancelAnimationFrame(animationId);
		return;
	}

	updateBars();
	animationId = requestAnimationFrame(animate);
};

const startVisualization = () => {
	// Пробуем инициализировать AudioContext, если он еще не создан или закрыт
	if (!audioContext || audioContext.state === 'closed') {
		initializeAudioContext();
	}
	// Запускаем анимацию
	animate();
};

const stopVisualization = () => {
	if (animationId) {
		cancelAnimationFrame(animationId);
		animationId = 0;
	}

	// НЕ закрываем AudioContext, чтобы можно было перезапустить
	// if (audioContext && audioContext.state !== 'closed') {
	// 	audioContext.close();
	// }

	// Не обнуляем audioContext, analyser, sourceNode
	// audioContext = null;
	// analyser = null;
	// sourceNode = null;

	// Сбрасываем столбики
	bars.value = Array.from({ length: barCount }, (_, i) => ({
		height: 0,
		x: i * (barWidth + 2),
		width: barWidth,
		isDot: true, // Изначально все точки
	}));

	// Сбрасываем массив сглаживания
	previousHeights = new Array(barCount).fill(0);
};

// Отслеживаем изменения воспроизведения
watch(playing, isPlaying => {
	if (isPlaying && element.value instanceof HTMLAudioElement) {
		startVisualization();
	} else {
		stopVisualization();
	}
});

// Отслеживаем изменения элемента
watch(element, newElement => {
	stopVisualization();
	if (newElement instanceof HTMLAudioElement && playing.value) {
		startVisualization();
	}
});

onMounted(() => {
	// Инициализируем пустые столбики
	bars.value = Array.from({ length: barCount }, (_, i) => ({
		height: 0,
		x: i * (barWidth + 2),
		width: barWidth,
		isDot: true, // Изначально все точки
	}));

	// Инициализируем массив сглаживания
	previousHeights = new Array(barCount).fill(0);

	if (element.value instanceof HTMLAudioElement && playing.value) {
		startVisualization();
	}
});

onUnmounted(() => {
	stopVisualization();

	// Только при размонтировании закрываем AudioContext
	if (audioContext && audioContext.state !== 'closed') {
		audioContext.close();
	}

	audioContext = null;
	analyser = null;
	sourceNode = null;
});
</script>

<template>
	<svg
		ref="svgRef"
		class="audio-visualizer"
		viewBox="0 0 320 240"
		preserveAspectRatio="xMidYMid meet"
	>
		<!-- Градиент для столбиков -->
		<!-- <defs>
			<linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" style="stop-color: #667eea; stop-opacity: 1" />
				<stop offset="50%" style="stop-color: #764ba2; stop-opacity: 1" />
				<stop offset="100%" style="stop-color: #f093fb; stop-opacity: 1" />
			</linearGradient>
		</defs> -->

		<!-- Столбики визуализации -->
		<g transform="translate(0, 120)">
			<!-- Каждый элемент может быть либо точкой, либо столбиком -->
			<g v-for="(bar, index) in bars" :key="index" style="min-height: 8px">
				<!-- Круглая точка -->
				<!-- Прямоугольный столбик -->
				<rect
					
					:x="bar.x"
					:y="-(bar.height > 8 ? bar.height : 8) / 2"
					:width="bar.width"
					:style="{
						height: `${bar.height > 8 ? bar.height : 8}px`,
						'min-height': `${bar.height}px`,
					}"
					fill="white"
					:rx="bar.width / 2"
					:ry="bar.width / 2"
					class="audio-bar"
				/>
			</g>
		</g>
	</svg>
</template>

<style scoped>
.audio-visualizer {
	width: 100%;
	height: 100%;
	position: absolute;
	top: 0;
	left: 0;
	z-index: 2;
}

.audio-bar {
	transition: height 0.15s ease-out, y 0.15s ease-out;
}

.audio-dot {
	transition: r 0.15s ease-out;
}
</style>
