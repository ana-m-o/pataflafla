import { Dexie, type EntityTable } from 'dexie';

export interface PlaceholderEntity {
	id: number;
	createdAt: string;
}

export const db = new Dexie('PataflaflaDB') as Dexie & {
	placeholders: EntityTable<PlaceholderEntity, 'id'>;
};

db.version(1).stores({
	placeholders: '++id, createdAt'
});
