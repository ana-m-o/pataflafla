import { db } from './index';

export async function getSetting(key: string): Promise<string | undefined> {
	const row = await db.settings.get(key);
	return row?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
	await db.settings.put({ key, value });
	// Mantener localStorage sincronizado para el script anti-FOUC
	localStorage.setItem(key, value);
}
