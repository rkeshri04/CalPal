import { Database, Model } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';
import { appSchema, tableSchema } from '@nozbe/watermelondb';

// ----- SCHEMA -----
const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'logs',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'image', type: 'string', isOptional: true },
        { name: 'barcode', type: 'string' },
        { name: 'cost', type: 'number' },
        { name: 'weight', type: 'number' },
        { name: 'calories', type: 'number', isOptional: true },
        { name: 'fat', type: 'number', isOptional: true },
        { name: 'carbs', type: 'number', isOptional: true },
        { name: 'protein', type: 'number', isOptional: true },
        { name: 'date', type: 'string' },
        { name: 'local_date', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'user_profiles',
      columns: [
        { name: 'age', type: 'number' },
        { name: 'height', type: 'number' },
        { name: 'weight', type: 'number' },
        { name: 'unit_system', type: 'string' },
        { name: 'bmi_history', type: 'string' },
        { name: 'last_prompt', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

// ----- MODELS -----
class Log extends Model {
  static table = 'logs';

  @field('name') name!: string;
  @field('image') image?: string;
  @field('barcode') barcode!: string;
  @field('cost') cost!: number;
  @field('weight') weight!: number;
  @field('calories') calories?: number;
  @field('fat') fat?: number;
  @field('carbs') carbs?: number;
  @field('protein') protein?: number;
  @field('date') date!: string;
  @field('local_date') localDate?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

class UserProfile extends Model {
  static table = 'user_profiles';

  @field('age') age!: number;
  @field('height') height!: number;
  @field('weight') weight!: number;
  @field('unit_system') unitSystem!: 'us' | 'metric';
  @json('bmi_history', (rawValue) => rawValue || []) bmiHistory!: { date: string; bmi: number; weight: number; height: number }[];
  @field('last_prompt') lastPrompt!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

// ----- ADAPTER & DATABASE -----
const adapter = new SQLiteAdapter({
  schema,
  dbName: 'snackzap',
  jsi: true,
  onSetUpError: (error) => console.error('WatermelonDB setup error:', error),
});

const database = new Database({
  adapter,
  modelClasses: [Log, UserProfile],
});

export { database, Log, UserProfile };
