import React, { useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import CategoryActivityTemplate from "../../components/CategoryActivityTemplate";
import { useEventFeed } from "../../hooks/useApi";
import { updateSeoMeta } from "../../utils/seoUtils";

const CategoryPage = () => {
  const { categoryId, category } = useParams();
  const activeCategoryId = categoryId || category;
  const { data: allEvents } = useEventFeed();

  // Find category title from data if available
  const detectedCategory = useMemo(() => {
    if (!allEvents || !Array.isArray(allEvents) || !activeCategoryId) return null;
    const target = String(activeCategoryId).toLowerCase();
    const found = allEvents.find((e) => {
      const eId = String(e.category?.id || "");
      const eName = String(e.category?.name || "").toLowerCase();
      return eId === target || eName.includes(target);
    });
    return found?.category || null;
  }, [allEvents, activeCategoryId]);

  const title = detectedCategory?.name || (activeCategoryId ? `კატეგორია: ${activeCategoryId}` : "აქტივობები");

  useEffect(() => {
    updateSeoMeta({
      title: title,
      description: `აღმოაჩინე საუკეთესო ${title} საქართველოში. დაჯავშნე ბილეთები ონლაინ Funfinder-ზე.`,
      url: window.location.href,
      type: 'website',
    });
  }, [title]);

  return (
    <CategoryActivityTemplate
      categoryKeys={[activeCategoryId, detectedCategory?.name].filter(Boolean)}
      titleKa={title}
      titleEn={detectedCategory?.name_en || title}
      subtitleKa="აღმოაჩინე საუკეთესო თავგადასავლები და დაჯავშნე ბილეთები ონლაინ"
      subtitleEn="Discover top adventures in this category and book tickets online"
      guideTarget="category-page"
    />
  );
};

export default CategoryPage;
