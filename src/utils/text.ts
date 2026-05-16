export const timeRead = (text: string): number =>
	Math.ceil(text.split(' ').length / 200);

export const isUrl = (text: string): boolean => {
	const urlRegex = /^(https?:\/\/)?([\w\-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;
	return urlRegex.test(text);
};
