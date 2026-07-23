import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import landingEn from '../locales/mwasalat/en.json';
import landingAr from '../locales/mwasalat/ar.json';
import appEn from '../locales/mwasalat/app/en.json';
import appAr from '../locales/mwasalat/app/ar.json';
import adminEn from '../locales/mwasalat/app/admin/en.json';
import adminAr from '../locales/mwasalat/app/admin/ar.json';
import instructorEn from '../locales/mwasalat/app/instructor/en.json';
import instructorAr from '../locales/mwasalat/app/instructor/ar.json';
import learnerRestEn from '../locales/mwasalat/app/learnerRest/en.json';
import learnerRestAr from '../locales/mwasalat/app/learnerRest/ar.json';

export const MWASALAT_LANG_STORAGE_KEY = 'eonix_mwasalat_lang';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        mwasalatLanding: landingEn,
        mwasalatApp: { ...appEn, ...adminEn, ...instructorEn, ...learnerRestEn },
      },
      ar: {
        mwasalatLanding: landingAr,
        mwasalatApp: { ...appAr, ...adminAr, ...instructorAr, ...learnerRestAr },
      },
    },
    lng: localStorage.getItem(MWASALAT_LANG_STORAGE_KEY) || 'en',
    fallbackLng: 'en',
    ns: ['mwasalatLanding', 'mwasalatApp'],
    defaultNS: 'mwasalatApp',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
