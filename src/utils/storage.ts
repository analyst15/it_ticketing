import { Ticket, KBArticle, ITAsset, UserAccount } from '../types';
import { INITIAL_TICKETS, INITIAL_KB_ARTICLES, INITIAL_ASSETS, INITIAL_USERS } from '../data/mockData';

const TICKETS_KEY = 'it_desk_tickets_v1';
const KB_KEY = 'it_desk_kb_articles_v1';
const ASSETS_KEY = 'it_desk_assets_v1';
const USERS_KEY = 'it_desk_users_v1';

export function loadUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed: UserAccount[] = JSON.parse(raw);
      return parsed.map(u => ({
        ...u,
        password: u.password || (u.role === 'Admin' ? 'admin123' : u.role === 'IT Staff' ? 'staff123' : 'employee123'),
      }));
    }
  } catch (e) {
    console.error('Failed to load users from localStorage:', e);
  }
  return INITIAL_USERS;
}

export function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users to localStorage:', e);
  }
}

export function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load tickets from localStorage:', e);
  }
  return INITIAL_TICKETS;
}

export function saveTickets(tickets: Ticket[]): void {
  try {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed to save tickets to localStorage:', e);
  }
}

export function loadKBArticles(): KBArticle[] {
  try {
    const raw = localStorage.getItem(KB_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load KB articles from localStorage:', e);
  }
  return INITIAL_KB_ARTICLES;
}

export function saveKBArticles(articles: KBArticle[]): void {
  try {
    localStorage.setItem(KB_KEY, JSON.stringify(articles));
  } catch (e) {
    console.error('Failed to save KB articles to localStorage:', e);
  }
}

export function loadAssets(): ITAsset[] {
  try {
    const raw = localStorage.getItem(ASSETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].laptopModel) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load assets from localStorage:', e);
  }
  return INITIAL_ASSETS;
}

export function saveAssets(assets: ITAsset[]): void {
  try {
    localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
  } catch (e) {
    console.error('Failed to save assets to localStorage:', e);
  }
}

export function resetToDefaults() {
  localStorage.removeItem(TICKETS_KEY);
  localStorage.removeItem(KB_KEY);
  localStorage.removeItem(ASSETS_KEY);
  localStorage.removeItem(USERS_KEY);
  return {
    tickets: INITIAL_TICKETS,
    kbArticles: INITIAL_KB_ARTICLES,
    assets: INITIAL_ASSETS,
    users: INITIAL_USERS,
  };
}

export function exportAllDataAsJSON(tickets: Ticket[], kbArticles: KBArticle[], assets: ITAsset[]) {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    tickets,
    kbArticles,
    assets,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `it_support_desk_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportTicketsToCSV(tickets: Ticket[]) {
  const headers = ['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'Tier', 'Assignee', 'Reporter', 'Department', 'Asset Tag', 'Created At'];
  const rows = tickets.map(t => [
    `"${t.ticketNumber}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    `"${t.priority}"`,
    `"${t.status}"`,
    `"${t.tier}"`,
    `"${t.assignedAgent}"`,
    `"${t.reporterName}"`,
    `"${t.reporterDepartment}"`,
    `"${t.assetId || ''}"`,
    `"${t.createdAt}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodeURI(csvContent));
  downloadAnchor.setAttribute('download', `it_tickets_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
