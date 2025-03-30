import { JournalEntryType } from '../models/JournalEntry';

export const journalService = {
  // Get all journal entries
  async getAllEntries(): Promise<JournalEntryType[]> {
    const response = await fetch('/api/journal');
    if (!response.ok) {
      throw new Error('Failed to fetch entries');
    }
    return response.json();
  },

  // Get single journal entry
  async getEntry(id: string): Promise<JournalEntryType> {
    const response = await fetch(`/api/journal/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch entry');
    }
    return response.json();
  },

  // Create new journal entry
  async createEntry(data: Omit<JournalEntryType, '_id' | 'createdAt' | 'updatedAt' | 'mentalHealthClass'>): Promise<JournalEntryType> {
    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create entry');
    }
    return response.json();
  },

  // Update journal entry
  async updateEntry(id: string, data: Partial<JournalEntryType>): Promise<JournalEntryType> {
    const response = await fetch(`/api/journal/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update entry');
    }
    return response.json();
  },

  // Delete journal entry
  async deleteEntry(id: string): Promise<void> {
    const response = await fetch(`/api/journal/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete entry');
    }
  },
}; 