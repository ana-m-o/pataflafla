import { Dexie, type EntityTable } from 'dexie';

export interface PlaceholderEntity {
	id: number;
	createdAt: string;
}

export interface UserSetting {
	key: string;
	value: string;
}

export type ExerciseCategory = 'Scales' | 'Etudes' | 'Repertoire' | 'Other';

export interface Exercise {
	id?: number;
	name: string;
	targetBpm: number;
	category: ExerciseCategory;
	author?: string;
	book?: string;
	duration?: number; // total seconds
	description?: string;
	referencePhoto?: Blob;
	createdAt: string;
}

export type PracticeFeeling = 'poor' | 'okay' | 'good' | 'great';

export interface Practice {
	id?: number;
	exerciseId: number;
	bpm: number;
	date: string; // ISO date YYYY-MM-DD
	duration?: number; // minutes
	feeling?: PracticeFeeling;
	notes?: string;
}

export const db = new Dexie('PataflaflaDB') as Dexie & {
	placeholders: EntityTable<PlaceholderEntity, 'id'>;
	settings: EntityTable<UserSetting, 'key'>;
	exercises: EntityTable<Exercise, 'id'>;
	practices: EntityTable<Practice, 'id'>;
};

db.version(1).stores({
	placeholders: '++id, createdAt'
});

db.version(2).stores({
	placeholders: '++id, createdAt',
	settings: 'key'
});

db.version(3).stores({
	placeholders: '++id, createdAt',
	settings: 'key',
	exercises: '++id, category',
	practices: '++id, exerciseId, date'
});
