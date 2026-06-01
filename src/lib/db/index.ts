import { Dexie, type EntityTable } from 'dexie';

export interface PlaceholderEntity {
	id: number;
	createdAt: string;
}

export interface UserSetting {
	key: string;
	value: string;
}

export const db = new Dexie('PataflaflaDB') as Dexie & {
	placeholders: EntityTable<PlaceholderEntity, 'id'>;
	settings: EntityTable<UserSetting, 'key'>;
};

db.version(1).stores({
	placeholders: '++id, createdAt'
});

db.version(2).stores({
	placeholders: '++id, createdAt',
	settings: 'key'
});
