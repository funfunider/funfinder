import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

export function useLanguageNavigate() {
  const navigate = useNavigate();
  const { getLocalizedPath } = useLanguage();

  const languageNavigate = useCallback(
    (to, options) => {
      if (typeof to === "string") {
        return navigate(getLocalizedPath(to), options);
      }
      return navigate(to, options);
    },
    [navigate, getLocalizedPath]
  );

  return languageNavigate;
}

export default useLanguageNavigate;
