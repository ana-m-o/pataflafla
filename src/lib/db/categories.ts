import { db, type Category } from './index';

export async function getCategories(): Promise<Category[]> {
	return db.categories.orderBy('name').toArray();
}

export async function addCategory(data: Omit<Category, 'id'>): Promise<number> {
	return db.categories.add(data) as Promise<number>;
}

export async function seedCategories(): Promise<void> {
	const count = await db.categories.count();
	if (count > 0) return;
	const today = new Date().toISOString().split('T')[0];
	const initial: Omit<Category, 'id'>[] = [
		{ name: 'Scales',     icon: 'Music',         color: '#ffd400', createdAt: today },
		{ name: 'Etudes',     icon: 'BookOpen',       color: '#818cf8', createdAt: today },
		{ name: 'Repertoire', icon: 'Disc3',          color: '#34d399', createdAt: today },
		{ name: 'Other',      icon: 'MoreHorizontal', color: '#94a3b8', createdAt: today }
	];
	for (const cat of initial) {
		await db.categories.add(cat);
	}
}
