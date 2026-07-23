export function generateMockSparklineData(count: number) {
  const items: { date: string; value: number }[] = [];
  const startDate = new Date();

  for (let i = 0; i < count; i++) {
    // Increment by 1 hour for each item
    const date = new Date(startDate.getTime() + i * 60 * 60 * 1000); 
    // Random value between 0 and 99
    const value = Math.floor(Math.random() * 100); 
    items.push({ date: date.toISOString(), value });
  }

  return items;
}