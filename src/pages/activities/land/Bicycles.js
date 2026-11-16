import React from "react";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const Bicycles = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["bicycle", "bicycles", "bike", "ველოსიპედი", "ველოსიპედები"]}
      titleKa="ველოტურები"
      titleEn="Bicycle Tours"
      subtitleKa="ეკოლოგიური და ჯანსაღი გასეირნებები ქალაქსა და ბუნებაში"
      subtitleEn="Eco-friendly and refreshing cycling tours in cities and nature"
      icon={<DirectionsBikeIcon />}
      guideTarget="bicycles"
    />
  );
};

export default Bicycles;
