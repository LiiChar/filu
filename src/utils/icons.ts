import iconamoon from '@iconify-json/iconamoon/icons.json';
import mdi from '@iconify-json/mdi/icons.json';
import fluent from '@iconify-json/fluent/icons.json';
import gg from '@iconify-json/gg/icons.json';
import gridicons from '@iconify-json/gridicons/icons.json';
import ion from '@iconify-json/ion/icons.json';
import lineMd from '@iconify-json/line-md/icons.json';
import lucide from '@iconify-json/lucide/icons.json';
import majesticons from '@iconify-json/majesticons/icons.json';
import materialSymbols from '@iconify-json/material-symbols/icons.json';
import materialSymbolsLight from '@iconify-json/material-symbols-light/icons.json';
import mingcute from '@iconify-json/mingcute/icons.json';
import mynaui from '@iconify-json/mynaui/icons.json';
import radixIcons from '@iconify-json/radix-icons/icons.json';
import tabler from '@iconify-json/tabler/icons.json';
import uil from '@iconify-json/uil/icons.json';
import weui from '@iconify-json/weui/icons.json';

const icons = {
	iconamoon: iconamoon.icons,
	mdi: mdi.icons,
	fluent: (fluent as any).icons,
	gg: gg.icons,
	gridicons: gridicons.icons,
	ion: ion.icons,
	'line-md': lineMd.icons,
	lucide: lucide.icons,
	majesticons: majesticons.icons,
	'material-symbols': (materialSymbols as any).icons,
	'material-symbols-light': (materialSymbolsLight as any).icons,
	mingcute: mingcute.icons,
	mynaui: mynaui.icons,
	'radix-icons': radixIcons.icons,
	tabler: tabler.icons,
	uil: uil.icons,
	weui: weui.icons,
};

type Prefix = keyof typeof icons;

export type Icon = `${Prefix}:${string}`;

export const getIcon = (icon: Icon) => {
	const [prefix, name] = icon.split(':');
	return icons[prefix as keyof typeof icons][name];
};
