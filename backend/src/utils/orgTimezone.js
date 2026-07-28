import { mwasalatSettingsService } from '../modules/mwasalatSettings/mwasalatSettings.service.js';

export const DEFAULT_ORG_TIMEZONE = 'Asia/Muscat';

// The IANA zone the org operates in (admin-configurable in Settings, see
// mwasalatSettings.model.js). Used everywhere "today"/"this month"/report
// buckets need to mean the org's calendar day rather than whatever OS zone
// the Node process happens to be running in.
export const getOrgTimezone = async () => {
  try {
    const settings = await mwasalatSettingsService.getCachedSettings();
    return settings?.timezone || DEFAULT_ORG_TIMEZONE;
  } catch {
    return DEFAULT_ORG_TIMEZONE;
  }
};

// 'YYYY-MM-DD' as the wall-clock date `date` falls on in `timeZone`.
export const formatDateKeyInTimezone = (date, timeZone) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

// Offset (minutes, positive = ahead of UTC) of `timeZone` at the instant `date`.
const getTimezoneOffsetMinutes = (timeZone, date) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return (asUtc - date.getTime()) / 60000;
};

// UTC instant of local midnight for the 'YYYY-MM-DD' `dateKey`, as measured in
// `timeZone`. Two-pass offset lookup so it stays correct across a DST transition.
export const localDayStartUtc = (dateKey, timeZone) => {
  const naiveUtc = new Date(`${dateKey}T00:00:00.000Z`);
  const pass1 = new Date(naiveUtc.getTime() - getTimezoneOffsetMinutes(timeZone, naiveUtc) * 60000);
  const offset = getTimezoneOffsetMinutes(timeZone, pass1);
  return new Date(naiveUtc.getTime() - offset * 60000);
};

// UTC instant of the last millisecond of the local day for 'YYYY-MM-DD' `dateKey`.
export const localDayEndUtc = (dateKey, timeZone) =>
  new Date(localDayStartUtc(dateKey, timeZone).getTime() + 24 * 60 * 60 * 1000 - 1);

// [start, end) UTC instants spanning "today" in `timeZone`.
export const getTodayBoundaryInTimezone = (timeZone, referenceDate = new Date()) => {
  const start = localDayStartUtc(formatDateKeyInTimezone(referenceDate, timeZone), timeZone);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
};
