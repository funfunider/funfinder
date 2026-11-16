import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import enTranslations from "../locales/en.json";

const LanguageContext = createContext(null);

const SUPPORTED_LANGUAGES = ["en", "ka", "ru", "hi", "ar", "he", "tr", "hy", "kk", "uk", "zh"];

const localeMap = {
  en: enTranslations,
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts.length > 0 && SUPPORTED_LANGUAGES.includes(parts[0])) {
        return parts[0];
      }
      const stored = window.localStorage.getItem("ff_language");
      return SUPPORTED_LANGUAGES.includes(stored) ? stored : "en";
    }
    return "en";
  });

  const [activeTranslations, setActiveTranslations] = useState(() => localeMap[language] || enTranslations);

  useEffect(() => {
    if (localeMap[language]) {
      setActiveTranslations(localeMap[language]);
      return;
    }

    let isMounted = true;
    import(`../locales/${language}.json`)
      .then((mod) => {
        if (isMounted && mod.default) {
          localeMap[language] = mod.default;
          setActiveTranslations(mod.default);
        }
      })
      .catch((err) => {
        console.error(`Failed to load translations for ${language}:`, err);
      });

    return () => {
      isMounted = false;
    };
  }, [language]);

  const getLocalizedPath = useCallback(
    (path, targetLang = language) => {
      if (!path) return `/${targetLang}`;
      if (/^(https?:|mailto:|tel:|\/\/|#)/.test(path)) return path;

      const rawPath = path.startsWith("/") ? path : `/${path}`;
      const parts = rawPath.split("/").filter(Boolean);

      if (parts.length > 0 && SUPPORTED_LANGUAGES.includes(parts[0])) {
        parts[0] = targetLang;
        return "/" + parts.join("/");
      }

      return `/${targetLang}${rawPath === "/" ? "" : rawPath}`;
    },
    [language]
  );

  const changeLanguage = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
    setLanguageState(newLang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ff_language", newLang);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ff_language", language);
    }
    if (typeof document !== "undefined") {
      const isRtl = language === "he" || language === "ar";
      document.documentElement.lang = language;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: changeLanguage,
      setLanguageState,
      getLocalizedPath,
      t: (key, vars) => {
        const langTable = activeTranslations || enTranslations;
        let str = langTable[key] || enTranslations[key] || key;
        if (vars && typeof str === "string") {
          Object.entries(vars).forEach(([k, v]) => {
            str = str.replace(new RegExp(`{${k}}`, "g"), String(v));
          });
        }
        return str;
      },
    }),
    [language, activeTranslations, changeLanguage, getLocalizedPath]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

export const supportedLanguages = SUPPORTED_LANGUAGES;
