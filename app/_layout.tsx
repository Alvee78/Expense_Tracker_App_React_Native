import { ThemeProvider } from '@/context/ThemeContext';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import React from 'react';

export default function RootLayout() {
  async function migrateDbIfNeeded(db: SQLiteDatabase) {
    try {
      const DATABASE_VERSION = 1;

      const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      const currentDbVersion = result?.user_version ?? 0;

      if (currentDbVersion >= DATABASE_VERSION) return;

      if (currentDbVersion === 0) {
        await db.execAsync(`
          PRAGMA journal_mode = 'wal';

          -- Create category table
          CREATE TABLE IF NOT EXISTS category (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_name TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('income', 'expense'))
          );

          -- Create expenses table
          CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
            description TEXT,
            isUploaded INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          -- Create budget table
          CREATE TABLE IF NOT EXISTS budget (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            amount REAL NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_created_at ON expenses (created_at);
          CREATE INDEX IF NOT EXISTS idx_category ON expenses (category);
        `);

        // Add 15 initial categories
        const categories = [
          ['Food', 'expense'],
          ['Transport', 'expense'],
          ['Shopping', 'expense'],
          ['Entertainment', 'expense'],
          ['Bills', 'expense'],
          ['Education', 'expense'],
          ['Health', 'expense'],
          ['Gifts', 'expense'],
          ['Subscriptions', 'expense'],
          ['Travel', 'expense'],
          ['Salary', 'income'],
          ['Freelance', 'income'],
          ['Investment', 'income'],
          ['Refunds', 'income'],
          ['Others', 'expense']
        ];

        for (const [name, type] of categories) {
          await db.runAsync(
            'INSERT INTO category (category_name, type) VALUES (?, ?)',
            name, type
          );
        }

        // Insert a sample expense
        await db.runAsync(
          'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
          'Food', 250.75, 'expense', 'Lunch at restaurant', 0
        );
                     await db.runAsync(
          'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
          'Food', 250.75, 'expense', 'Lunch at restaurant', 0
        );
        await db.runAsync(
          'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
          'Transport', 50.00, 'expense', 'Bus fare', 0
        );
        await db.runAsync(
          'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
          'Shopping', 120.00, 'expense', 'Clothes shopping', 0
        );
        await db.runAsync(
          'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
          'Salary', 2000.00, 'income', 'Monthly salary', 0
        );
      }
 

      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    } catch (error) {
      console.error('❌ Database migration failed:', error);
    }
  }




  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SQLiteProvider databaseName="ExpenseTracker.db" onInit={migrateDbIfNeeded}>
        <ThemeProvider>
          <Stack screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}>
          </Stack>
        </ThemeProvider>
      </SQLiteProvider>
    </ClerkProvider>
  );
}
