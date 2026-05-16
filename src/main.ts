import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import { initApp } from './app';
import Home from './pages/home.vue';
import Load from './pages/load.vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import Setting from './pages/setting.vue';
import { useDownloadStore } from './store/donwload';

const pinia = createPinia();
const app = createApp(App);

const routes = [
	{ path: '/', component: Home },
	{ path: '/load', component: Load },
	{ path: '/setting', component: Setting },
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

app.use(pinia);
app.use(router);
app.mount('#app');

// const downloadStore = useDownloadStore(pinia);
// downloadStore.loadFromStorage();
// downloadStore.loadSettingsFromStorage();
// downloadStore.setupDownloads();

initApp();
