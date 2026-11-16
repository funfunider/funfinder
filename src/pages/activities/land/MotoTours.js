import React from "react";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const MotoTours = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["moto", "moto tour", "moto tours", "enduro", "მოტო"]}
      titleKa="მოტო ტურები"
      titleEn="Moto & Enduro Tours"
      subtitleKa="ენდურო და მოტო თავგადასავლები ულამაზეს ბილიკებზე"
      subtitleEn="Enduro and motorcycle adventures across scenic Georgian landscapes"
      icon={<TwoWheelerIcon />}
      guideTarget="moto-tours"
    />
  );
};

export default MotoTours;