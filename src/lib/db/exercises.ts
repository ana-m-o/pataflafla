import { db, type Exercise } from './index';

export async function getExercises(): Promise<Exercise[]> {
	const exercises = await db.exercises.toArray();
	return exercises.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addExercise(data: Omit<Exercise, 'id'>): Promise<number> {
	return db.exercises.add(data) as Promise<number>;
}

export async function deleteExercise(id: number): Promise<void> {
	await db.exercises.delete(id);
}

export async function seedExercises(): Promise<void> {
	const count = await db.exercises.count();
	if (count > 0) return;

	const today = new Date().toISOString().split('T')[0];
	const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
	const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

	const ex1 = (await db.exercises.add({
		name: 'C Major Parallel',
		targetBpm: 120,
		category: 'Scales',
		author: 'Hanon',
		book: 'The Virtuoso Pianist',
		createdAt: today
	})) as number;

	const ex2 = (await db.exercises.add({
		name: 'G Melodic Minor',
		targetBpm: 100,
		category: 'Scales',
		author: 'ABRSM',
		book: 'Piano Scales Grade 5',
		createdAt: today
	})) as number;

	const ex3 = (await db.exercises.add({
		name: 'The Pataflafla',
		targetBpm: 160,
		category: 'Other',
		author: 'PAS',
		book: '40 Rudiments',
		createdAt: today
	})) as number;

	await db.practices.bulkAdd([
		{ exerciseId: ex1, bpm: 95, date: yesterday },
		{ exerciseId: ex2, bpm: 82, date: twoDaysAgo },
		{ exerciseId: ex3, bpm: 145, date: today }
	]);
}
