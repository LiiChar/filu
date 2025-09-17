import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import { initApp } from './app';
import { createMemoryHistory, createRouter } from 'vue-router';
import Home from './pages/home.vue';
import Load from './pages/load.vue';

const pinia = createPinia();
const app = createApp(App);

const routes = [
	{ path: '/', component: Home },
	{ path: '/load', component: Load },
];

const router = createRouter({
	history: createMemoryHistory(),
	routes,
});

app.use(pinia);
app.use(router);
app.mount('#app');
initApp();
