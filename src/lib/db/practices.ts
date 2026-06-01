import { db, type Practice } from './index';

export async function getLastPractice(exerciseId: number): Promise<Practice | undefined> {
	const practices = await db.practices.where('exerciseId').equals(exerciseId).toArray();
	return practices.sort((a, b) => b.date.localeCompare(a.date))[0];
}

export async function getPracticesForExercise(exerciseId: number): Promise<Practice[]> {
	const practices = await db.practices.where('exerciseId').equals(exerciseId).toArray();
	return practices.sort((a, b) => b.date.localeCompare(a.date));
}

export async function addPractice(data: Omit<Practice, 'id'>): Promise<number> {
	return db.practices.add(data) as Promise<number>;
}
