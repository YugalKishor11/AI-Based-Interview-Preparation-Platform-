// PrepSphere Offline Queue Manager
// Persists non-critical candidate mutations (drafts, bookmarks, completion tags) when offline
// and automatically drains the queue when network connectivity resumes.

export interface QueuedAction {
  id: string;
  type: 'toggle_save_question' | 'toggle_complete_question' | 'save_draft_setup' | 'update_settings';
  payload: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
}

const STORAGE_KEY = 'prepsphere_offline_queue';

class OfflineQueueManager {
  private queue: QueuedAction[] = [];
  private isProcessing = false;

  constructor() {
    this.load();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.drain();
      });
    }
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      this.queue = data ? JSON.parse(data) : [];
    } catch {
      this.queue = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch {}
  }

  public enqueue(type: QueuedAction['type'], payload: Record<string, unknown>): void {
    const item: QueuedAction = {
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    this.queue.push(item);
    this.save();

    // If online, attempt immediate drain
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.drain();
    }
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  public getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  public async drain(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const remaining: QueuedAction[] = [];

    for (const action of this.queue) {
      try {
        await this.processAction(action);
      } catch (err) {
        action.retryCount++;
        if (action.retryCount < 5) {
          remaining.push(action);
        }
      }
    }

    this.queue = remaining;
    this.save();
    this.isProcessing = false;
  }

  private async processAction(action: QueuedAction): Promise<void> {
    // Dynamically import repo to avoid cyclic dependencies
    const { questionsRepo, profileRepo } = await import('../data');

    switch (action.type) {
      case 'toggle_save_question': {
        const questionId = action.payload.questionId as string;
        if (questionId) await questionsRepo.toggleSave(questionId);
        break;
      }
      case 'toggle_complete_question': {
        const questionId = action.payload.questionId as string;
        if (questionId) await questionsRepo.toggleComplete(questionId);
        break;
      }
      case 'save_draft_setup': {
        localStorage.setItem('prepsphere_draft_setup', JSON.stringify(action.payload));
        break;
      }
      case 'update_settings': {
        await profileRepo.update(action.payload);
        break;
      }
    }
  }
}

export const offlineQueue = new OfflineQueueManager();
