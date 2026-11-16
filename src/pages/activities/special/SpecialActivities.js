import React from "react";
import StarIcon from "@mui/icons-material/Star";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const SpecialActivities = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["special", "drift", "carting", "airsoft", "horse", "სპეციალური"]}
      titleKa="სპეციალური აქტივობები"
      titleEn="Special & Exclusive Activities"
      subtitleKa="უნიკალური ექსტრემალური და გასართობი გამოცდილებები საქართველოში"
      subtitleEn="Unique extreme and entertaining adventures across Georgia"
      icon={<StarIcon />}
      guideTarget="special-activities"
      customFilterFn={(event) => {
        const actType = event.category?.activity?.toLowerCase();
        const catName = event.category?.name?.toLowerCase() || "";
        return (
          actType === "special" ||
          catName.includes("drift") ||
          catName.includes("carting") ||
          catName.includes("airsoft") ||
          catName.includes("horse")
        );
      }}
    />
  );
};

export default SpecialActivities;
