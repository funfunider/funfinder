import React from "react";
import SpeedIcon from "@mui/icons-material/Speed";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const SeaMoto = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["sea moto", "seamoto", "jet ski", "jetcar", "ჰიდროციკლი", "მოტოციკლი"]}
      titleKa="ზღვის მოტოციკლი & Jet Ski"
      titleEn="Sea Moto & Jet Ski"
      subtitleKa="ჩქაროსნული გასეირნება და ადრენალინი ზღვის ტალღებზე"
      subtitleEn="High-speed thrills and freedom across the waves of the Black Sea"
      icon={<SpeedIcon />}
      guideTarget="sea-moto"
    />
  );
};

export default SeaMoto;
