import React from "react";
import RowingIcon from "@mui/icons-material/Rowing";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const Rafting = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["rafting", "kayak", "რაფტინგი"]}
      titleKa="ექსტრემალური რაფტინგი"
      titleEn="Extreme Rafting"
      subtitleKa="დაუვიწყარი ადრენალინი საქართველოს მთის სწრაფ მდინარეებზე"
      subtitleEn="Adrenaline-pumping whitewater rafting on rapid mountain rivers"
      icon={<RowingIcon />}
      guideTarget="rafting"
    />
  );
};

export default Rafting;
