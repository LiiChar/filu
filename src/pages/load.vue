<script setup>
import { onMounted } from 'vue';
import YTDlpWrap from 'yt-dlp-wrap';

onMounted(async () => {
const ytDlpWrap = new YTDlpWrap('../assets/utils/yt-dlp.exe');

let ytDlpEventEmitter = ytDlpWrap
    .exec([
        'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        '-f',
        'best',
        '-o',
        'output.mp4',
    ])
    .on('progress', (progress) =>
        console.log(
            progress.percent,
            progress.totalSize,
            progress.currentSpeed,
            progress.eta
        )
    )
    .on('ytDlpEvent', (eventType, eventData) =>
        console.log(eventType, eventData)
    )
    .on('error', (error) => console.error(error))
    .on('close', () => console.log('all done'));

console.log(ytDlpEventEmitter.ytDlpProcess.pid);
})


</script>
<template>
  <div>
    
  </div>
</template>

<style scoped></style>