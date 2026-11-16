import React from "react";
import ElectricBikeIcon from "@mui/icons-material/ElectricBike";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const QuadTours = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["quad", "quadro", "quadro tours", "quad tours", "კვადრო", "კვადროციკლი"]}
      titleKa="კვადრო ტურები"
      titleEn="Quad & Buggy Tours"
      subtitleKa="სამთო და ტყის ექსტრემალური მარშრუტები გამოცდილ ინსტრუქტორებთან"
      subtitleEn="Extreme mountain and forest trails with professional instructors"
      icon={<ElectricBikeIcon />}
      guideTarget="quad-tours"
    />
  );
};

export default QuadTours;