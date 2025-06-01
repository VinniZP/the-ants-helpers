// Locale detection and internationalization utilities
export interface LocaleSettings {
  locale: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayNames: string[];
  timeFormat: "12h" | "24h";
}

// Translation object for basic interface strings
const translations: Record<string, Record<string, string>> = {
  en: {
    tapEvents: "Tap events to enable notifications",
    enabled: "enabled",
    activeEvents: "Active Events",
    onceOnly: "Once only",
    everyWeek: "Every week",
    turnOff: "Turn off",
    toggleAll: "Toggle All",
    active: "Active",
    inactive: "Inactive",
    details: "Details",
    actions: "Actions",
    status: "Status",
    loadingSchedule: "Loading schedule...",
    antsEventsSchedule: "The Ants Events Schedule",
  },
  ru: {
    tapEvents: "Нажмите на события для включения уведомлений",
    enabled: "включено",
    activeEvents: "Активные события",
    onceOnly: "Только один раз",
    everyWeek: "Каждую неделю",
    turnOff: "Выключить",
    toggleAll: "Переключить всё",
    active: "Активно",
    inactive: "Неактивно",
    details: "Детали",
    actions: "Действия",
    status: "Статус",
    loadingSchedule: "Загрузка расписания...",
    antsEventsSchedule: "Расписание событий Муравьи",
  },
  es: {
    tapEvents: "Toca eventos para habilitar notificaciones",
    enabled: "habilitado",
    activeEvents: "Eventos Activos",
    onceOnly: "Solo una vez",
    everyWeek: "Cada semana",
    turnOff: "Apagar",
    toggleAll: "Alternar Todo",
    active: "Activo",
    inactive: "Inactivo",
    details: "Detalles",
    actions: "Acciones",
    status: "Estado",
    loadingSchedule: "Cargando horario...",
    antsEventsSchedule: "Horario de Eventos de Hormigas",
  },
  fr: {
    tapEvents: "Appuyez sur les événements pour activer les notifications",
    enabled: "activé",
    activeEvents: "Événements Actifs",
    onceOnly: "Une seule fois",
    everyWeek: "Chaque semaine",
    turnOff: "Éteindre",
    toggleAll: "Basculer Tout",
    active: "Actif",
    inactive: "Inactif",
    details: "Détails",
    actions: "Actions",
    status: "Statut",
    loadingSchedule: "Chargement du planning...",
    antsEventsSchedule: "Planning des Événements Fourmis",
  },
  de: {
    tapEvents: "Tippen Sie auf Ereignisse, um Benachrichtigungen zu aktivieren",
    enabled: "aktiviert",
    activeEvents: "Aktive Ereignisse",
    onceOnly: "Nur einmal",
    everyWeek: "Jede Woche",
    turnOff: "Ausschalten",
    toggleAll: "Alle umschalten",
    active: "Aktiv",
    inactive: "Inaktiv",
    details: "Details",
    actions: "Aktionen",
    status: "Status",
    loadingSchedule: "Zeitplan wird geladen...",
    antsEventsSchedule: "Ameisen-Ereignisplan",
  },
};

/**
 * Get locale settings from browser
 */
export const getLocaleSettings = (): LocaleSettings => {
  const locale = navigator.language || "en-US";
  const languageCode = locale.split("-")[0];

  // Get first day of week using Intl.Locale
  let firstDayOfWeek = 0; // Default to Sunday
  try {
    // Try modern browser API first
    const intlLocale = new Intl.Locale(locale);
    // @ts-ignore - weekInfo might not be available in all TypeScript versions
    const weekInfo = intlLocale.weekInfo || intlLocale.getWeekInfo?.();
    if (weekInfo && typeof weekInfo.firstDay === "number") {
      firstDayOfWeek = weekInfo.firstDay === 7 ? 0 : weekInfo.firstDay; // Convert 7 (Sunday) to 0
    }
  } catch {
    // Fallback: Most European locales start with Monday
    const mondayFirstLocales = [
      "de",
      "fr",
      "es",
      "it",
      "pt",
      "nl",
      "sv",
      "no",
      "da",
      "fi",
      "pl",
      "ru",
      "uk",
    ];
    if (mondayFirstLocales.includes(languageCode)) {
      firstDayOfWeek = 1; // Monday
    }
  }

  // Get localized day names
  const dayNames: string[] = [];
  try {
    const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // Create dates for a week starting Sunday (Jan 7-13, 2024)
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, 7 + i); // Sunday = Jan 7, 2024
      dayNames.push(dayFormatter.format(date));
    }
  } catch {
    // Fallback to English day names
    dayNames.push("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
  }

  // Detect time format preference
  let timeFormat: "12h" | "24h" = "24h";
  try {
    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "numeric",
      hour12: undefined, // Let browser decide
    });
    const testTime = timeFormatter.format(new Date(2024, 0, 1, 13, 0)); // 1:00 PM
    timeFormat =
      testTime.includes("PM") || testTime.includes("AM") ? "12h" : "24h";
  } catch {
    // Default to 24h for most locales except en-US
    timeFormat = locale.startsWith("en-US") ? "12h" : "24h";
  }

  return {
    locale,
    firstDayOfWeek,
    dayNames,
    timeFormat,
  };
};

/**
 * Reorder array based on first day of week
 */
export const reorderDaysForLocale = <T>(
  days: T[],
  firstDayOfWeek: number
): T[] => {
  if (firstDayOfWeek === 0) {
    return days; // Sunday first (no reordering needed)
  }
  return [...days.slice(firstDayOfWeek), ...days.slice(0, firstDayOfWeek)];
};

/**
 * Get translated text for current locale
 */
export const getTranslation = (key: string, locale: string = "en"): string => {
  const languageCode = locale.split("-")[0];
  return translations[languageCode]?.[key] || translations["en"][key] || key;
};

/**
 * Get localized day names in the correct order for the locale
 */
export const getLocalizedDayNames = (
  localeSettings: LocaleSettings
): string[] => {
  return reorderDaysForLocale(
    localeSettings.dayNames,
    localeSettings.firstDayOfWeek
  );
};

/**
 * Convert day index from standard (0=Sunday) to locale-specific ordering
 */
export const convertDayIndexToLocale = (
  dayIndex: number,
  firstDayOfWeek: number
): number => {
  if (firstDayOfWeek === 0) {
    return dayIndex; // No conversion needed for Sunday-first
  }
  // Convert Sunday-first (0-6) to Monday-first (0-6)
  return (dayIndex + 7 - firstDayOfWeek) % 7;
};

/**
 * Convert day index from locale-specific ordering to standard (0=Sunday)
 */
export const convertDayIndexFromLocale = (
  localeIndex: number,
  firstDayOfWeek: number
): number => {
  if (firstDayOfWeek === 0) {
    return localeIndex; // No conversion needed for Sunday-first
  }
  // Convert Monday-first (0-6) back to Sunday-first (0-6)
  return (localeIndex + firstDayOfWeek) % 7;
};
