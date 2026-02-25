// Generate a week key like "2026-W09"
export function getWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// Format current week's Monday as "YY年M月D日週" (e.g. "26年2月23日週")
export function getWeekDisplayLabel(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - ((day === 0 ? 7 : day) - 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const yy = monday.getFullYear() % 100;
  const m = monday.getMonth() + 1;
  const dd = monday.getDate();
  return `${yy}年${m}月${dd}日週`;
}

// Convert ISO week key (e.g. "2026-W09") to display label (e.g. "26年2月23日週")
export function formatWeekKey(weekKey) {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekKey;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  // ISO 8601: Week 1 contains Jan 4th. Find Monday of the given week.
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // Mon=1..Sun=7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (jan4Day - 1) + (week - 1) * 7);
  const yy = monday.getFullYear() % 100;
  const m = monday.getMonth() + 1;
  const dd = monday.getDate();
  return `${yy}年${m}月${dd}日週`;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function createEmptyTask(memberId, category) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    memberId,
    category,
    title: '',
    taskType: 'project',
    priority: 3,
    dueDate: '',
    progress: 0,
    weeklyHistory: {},
    done: '',
    notDone: '',
    notDoneReason: '',
    issues: '',
    consultation: '',
    completionNotes: '',
    remarks: '',
    relatedUrls: [],
    attachments: [],
    createdAt: now,
    updatedAt: now,
  };
}
