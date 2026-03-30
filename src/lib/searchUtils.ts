/**
 * توحيد الحروف العربية لتسهيل البحث (مثلاً: أ، إ، آ -> ا)
 */
export function normalizeArabic(text: string): string {
    if (!text) return "";
    return text
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/[ى]/g, "ي")
        .replace(/ئ/g, "ي")
        .replace(/ؤ/g, "و")
        .replace(/[^\w\s\u0621-\u064A]/g, "") // إزالة الرموز الخاصة
        .trim()
        .toLowerCase();
}

/**
 * دالة البحث الذكي: تتأكد من أن جميع كلمات البحث موجودة في النص المستهدف
 * يدعم البحث غير المرتب (مثلاً: "خيط جراحة" يطابق "جراحة خيط")
 */
export function smartSearch(target: string, query: string): boolean {
    if (!query) return true;
    if (!target) return false;

    const normalizedTarget = normalizeArabic(target);
    const normalizedQuery = normalizeArabic(query);

    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

    // يجب أن توجد كل كلمة من كلمات البحث في النص المستهدف
    return queryWords.every(word => normalizedTarget.includes(word));
}

/**
 * دالة متقدمة للبحث في الأغراض (الأصناف) تدعم الاسم والباركود
 */
export function matchItem(item: { name: string; id: string }, query: string): boolean {
    if (!query) return true;

    const normalizedQuery = normalizeArabic(query);
    const normalizedName = normalizeArabic(item.name);
    const normalizedId = item.id.toLowerCase();

    // إذا كان البحث يطابق الباركود مباشرة
    if (normalizedId.includes(normalizedQuery)) return true;

    // البحث الذكي في الاسم
    return smartSearch(item.name, query);
}
