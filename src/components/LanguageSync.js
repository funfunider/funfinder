import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage, supportedLanguages } from "../contexts/LanguageContext";

export function LanguageSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguageState } = useLanguage();

  const prevLangRef = useRef(language);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const pathname = location.pathname;
    const parts = pathname.split("/").filter(Boolean);
    const hasLangPrefix = parts.length > 0 && supportedLanguages.includes(parts[0]);
    const urlLang = hasLangPrefix ? parts[0] : null;

    // Case 1: User explicitly changed language in UI (FAB, switcher, profile)
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      let newPath;
      if (hasLangPrefix) {
        parts[0] = language;
        newPath = "/" + parts.join("/");
      } else {
        newPath = `/${language}${pathname === "/" ? "" : pathname}`;
      }
      const fullTarget = newPath + location.search + location.hash;
      const fullCurrent = pathname + location.search + location.hash;

      if (fullTarget !== fullCurrent) {
        prevPathRef.current = newPath;
        navigate(fullTarget, { replace: true });
      }
      return;
    }

    // Case 2: URL pathname changed (user navigated, clicked a link, browser back/forward)
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      if (hasLangPrefix) {
        if (urlLang && urlLang !== language) {
          prevLangRef.current = urlLang;
          setLanguageState(urlLang);
        }
      } else {
        // Path lacks language mark, normalize with active language
        const newPath = `/${language}${pathname === "/" ? "" : pathname}`;
        const fullTarget = newPath + location.search + location.hash;
        prevPathRef.current = newPath;
        navigate(fullTarget, { replace: true });
      }
      return;
    }

    // Case 3: Initial load / direct URL access
    if (hasLangPrefix) {
      if (urlLang && urlLang !== language) {
        prevLangRef.current = urlLang;
        setLanguageState(urlLang);
      }
    } else {
      const newPath = `/${language}${pathname === "/" ? "" : pathname}`;
      const fullTarget = newPath + location.search + location.hash;
      prevPathRef.current = newPath;
      navigate(fullTarget, { replace: true });
    }
  }, [
    location.pathname,
    location.search,
    location.hash,
    language,
    setLanguageState,
    navigate,
  ]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = (language === 'ar' || language === 'he') ? 'rtl' : 'ltr';
    }
  }, [language]);

  return null;
}

export default LanguageSync;
