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

          -- Create improved budget table with month/year fields
          CREATE TABLE IF NOT EXISTS budget (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            budget_month INTEGER NOT NULL, -- 1-12 for Jan-Dec
            budget_year INTEGER NOT NULL,  -- e.g., 2025
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            isSynced INTEGER DEFAULT 0,
            UNIQUE(category, budget_month, budget_year) -- One budget per category per month/year
          );

          -- Create expense_changes table
          -- This table will track changes to expenses for syncing purposes
          CREATE TABLE IF NOT EXISTS expense_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL CHECK(action IN ('edited', 'deleted')),
            expense_id INTEGER,              -- ID from the main expenses table (SQLite)
            isSynced INTEGER DEFAULT 0       -- 0 = not synced, 1 = synced
          );

          -- Create budget_changes table to track deleted budgets
          CREATE TABLE IF NOT EXISTS budget_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            budget_id INTEGER NOT NULL,           -- Original budget ID from budget table
            isSynced INTEGER DEFAULT 0           -- 0 = not synced, 1 = synced
          );


          CREATE INDEX IF NOT EXISTS idx_created_at ON expenses (created_at);
          CREATE INDEX IF NOT EXISTS idx_category ON expenses (category);
          CREATE INDEX IF NOT EXISTS idx_budget_date ON budget (budget_month, budget_year);
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
        // await db.runAsync(
        //   'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
        //   'Food', 250.75, 'expense', 'Lunch at restaurant', 0
        // );
        //              await db.runAsync(
        //   'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
        //   'Food', 250.75, 'expense', 'Lunch at restaurant', 0
        // );
        // await db.runAsync(
        //   'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
        //   'Transport', 50.00, 'expense', 'Bus fare', 0
        // );
        // await db.runAsync(
        //   'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
        //   'Shopping', 120.00, 'expense', 'Clothes shopping', 0
        // );
        // await db.runAsync(
        //   'INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)',
        //   'Salary', 2000.00, 'income', 'Monthly salary', 0
        // );
      }
 

      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    } catch (error) {
      console.error('❌ Database migration failed:', error);
    }
  }




  return (
    <ClerkProvider publishableKey='pk_test_YnJhdmUtYmlzb24tNTEuY2xlcmsuYWNjb3VudHMuZGV2JA' tokenCache={tokenCache}>
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
