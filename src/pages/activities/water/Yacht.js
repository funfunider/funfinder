import React from "react";
import SailingIcon from "@mui/icons-material/Sailing";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const Yacht = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["yacht", "boat", "ship", "იახტა", "გემი"]}
      titleKa="იახტით გასეირნება"
      titleEn="Yacht & Boat Cruises"
      subtitleKa="რომანტიკული და VIP გასეირნებები შავ ზღვაზე"
      subtitleEn="Romantic and VIP yacht cruises along the Black Sea coastline"
      icon={<SailingIcon />}
      guideTarget="yacht"
    />
  );
};

export default Yacht;
