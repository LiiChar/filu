export interface VideoMetadata {
	id: string;
	title: string;
	formats: Format[];
	thumbnails: Thumbnail[];
	thumbnail: string;
	description: string;
	channel_id: string;
	channel_url: string;
	duration: number;
	view_count: number;
	age_limit: number;
	webpage_url: string;
	categories?: string[];
	tags: string[];
	playable_in_embed: boolean;
	live_status: string;
	media_type: string;
	_format_sort_fields: string[];
	automatic_captions: { [key: string]: AutomaticCaption[] };
	subtitles: Subtitles;
	comment_count: number;
	like_count: number;
	channel: string;
	channel_follower_count: number;
	channel_is_verified: boolean;
	uploader: string;
	uploader_id: string;
	uploader_url: string;
	upload_date: string;
	timestamp: number;
	availability: string;
	webpage_url_basename: string;
	webpage_url_domain: string;
	extractor: string;
	extractor_key: string;
	display_id: string;
	fulltitle: string;
	duration_string: string;
	is_live: boolean;
	was_live: boolean;
	epoch: number;
	format: string;
	format_id: string;
	ext: AudioEXTEnum;
	protocol: string;
	language: Language;
	format_note: string;
	filesize_approx: number;
	tbr: number;
	width: number;
	height: number;
	resolution: string;
	fps: number;
	dynamic_range: DynamicRange;
	vcodec: string;
	vbr: number;
	aspect_ratio: number;
	acodec: Acodec;
	abr: number;
	asr: number;
	audio_channels: number;
	_type: string;
	_version: Version;
}

export interface Version {
	version: string;
	release_git_head: string;
	repository: string;
}

export enum Acodec {
	Mp4A402 = 'mp4a.40.2',
	Mp4A405 = 'mp4a.40.5',
	None = 'none',
	Opus = 'opus',
}

export interface AutomaticCaption {
	ext: AutomaticCaptionEXT;
	url: string;
	name: string;
	impersonate: boolean;
}

export enum AutomaticCaptionEXT {
	Json3 = 'json3',
	Srt = 'srt',
	Srv1 = 'srv1',
	Srv2 = 'srv2',
	Srv3 = 'srv3',
	Ttml = 'ttml',
	Vtt = 'vtt',
}

export enum DynamicRange {
	SDR = 'SDR',
}

export enum AudioEXTEnum {
	M4A = 'm4a',
	None = 'none',
	Webm = 'webm',
}

export interface Format {
	format_id: string;
	format_note?: string;
	ext: PurpleEXT;
	protocol: Protocol;
	acodec: Acodec;
	vcodec: string;
	url: string;
	width?: number;
	height?: number;
	fps?: number;
	rows?: number;
	columns?: number;
	fragments?: Fragment[];
	audio_ext: AudioEXTEnum;
	video_ext: VideoEXT;
	vbr?: number;
	abr?: number;
	resolution: string;
	aspect_ratio?: number;
	http_headers: HTTPHeaders;
	format: string;
	asr?: number;
	filesize?: number;
	source_preference?: number;
	audio_channels?: number;
	quality?: number;
	has_drm?: boolean;
	tbr?: number;
	filesize_approx?: number;
	language?: Language;
	language_preference?: number;
	container?: Container;
	available_at?: number;
	downloader_options?: DownloaderOptions;
	manifest_url?: string;
	dynamic_range?: DynamicRange;
}

export enum Container {
	M4ADash = 'm4a_dash',
	Mp4Dash = 'mp4_dash',
	WebmDash = 'webm_dash',
}

export interface DownloaderOptions {
	http_chunk_size: number;
}

export enum PurpleEXT {
	M4A = 'm4a',
	Mhtml = 'mhtml',
	Mp4 = 'mp4',
	Webm = 'webm',
}

export interface Fragment {
	url: string;
	duration: number;
}

export interface HTTPHeaders {
	'User-Agent': string;
	Accept: Accept;
	'Accept-Language': AcceptLanguage;
	'Sec-Fetch-Mode': SECFetchMode;
}

export enum Accept {
	TextHTMLApplicationXHTMLXMLApplicationXMLQ09Q08 = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

export enum AcceptLanguage {
	EnUsEnQ05 = 'en-us,en;q=0.5',
}

export enum SECFetchMode {
	Navigate = 'navigate',
}

export enum Language {
	EnUS = 'en-US',
	Ru = 'ru',
}

export enum Protocol {
	HTTPS = 'https',
	M3U8Native = 'm3u8_native',
	Mhtml = 'mhtml',
}

export enum VideoEXT {
	Mp4 = 'mp4',
	None = 'none',
	Webm = 'webm',
}

export interface Subtitles {}

export interface Thumbnail {
	url: string;
	preference: number;
	id: string;
	height?: number;
	width?: number;
	resolution?: string;
}
