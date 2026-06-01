import { describe, it, expect } from 'vitest';
import { es } from '$lib/i18n/locales/es';
import { en } from '$lib/i18n/locales/en';

describe('smoke', () => {
	it('i18n locales have the same top-level keys', () => {
		expect(Object.keys(es)).toEqual(Object.keys(en));
	});

	it('es locale has all required app keys', () => {
		expect(es.app.title).toBeTruthy();
		expect(es.app.description).toBeTruthy();
		expect(es.app.language).toBeTruthy();
		expect(es.app.spanish).toBeTruthy();
		expect(es.app.english).toBeTruthy();
	});

	it('en locale has all required app keys', () => {
		expect(en.app.title).toBeTruthy();
		expect(en.app.description).toBeTruthy();
		expect(en.app.language).toBeTruthy();
		expect(en.app.spanish).toBeTruthy();
		expect(en.app.english).toBeTruthy();
	});

	it('both locales share the same app keys', () => {
		expect(Object.keys(es.app)).toEqual(Object.keys(en.app));
	});

	it('es locale has all required theme keys', () => {
		expect(es.theme.label).toBeTruthy();
		expect(es.theme.light).toBeTruthy();
		expect(es.theme.dark).toBeTruthy();
		expect(es.theme.yellow).toBeTruthy();
		expect(es.theme.cyan).toBeTruthy();
	});

	it('both locales share the same theme keys', () => {
		expect(Object.keys(es.theme)).toEqual(Object.keys(en.theme));
	});

	it('db module exports a Dexie instance', async () => {
		const { db } = await import('$lib/db/index');
		expect(db).toBeDefined();
		expect(typeof db.open).toBe('function');
		expect(typeof db.version).toBe('function');
	});
});
