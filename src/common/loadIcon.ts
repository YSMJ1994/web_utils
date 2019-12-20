const linkId = '__load_icon';
export default function loadIcon(iconUrl: string) {
	let iconLink: HTMLLinkElement | null = document.querySelector(`#${linkId}`);
	if (iconLink) {
		document.head.removeChild(iconLink);
	}
	iconLink = document.createElement('link');
	iconLink.id = linkId;
	iconLink.rel = 'stylesheet';
	iconLink.href = iconUrl;
	document.head.appendChild(iconLink);
}
