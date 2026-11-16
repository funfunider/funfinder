import React from "react";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const JeepTours = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["jeep", "jeep tours", "ჯიპ ტური", "ჯიპ ტურები"]}
      titleKa="ჯიპ ტურები"
      titleEn="Jeep Tours"
      subtitleKa="ექსტრემალური და პანორამული 4x4 თავგადასავლები საქართველოში"
      subtitleEn="Extreme 4x4 off-road adventures and scenic tours in Georgia"
      icon={<DirectionsCarIcon />}
      guideTarget="jeep-tours"
    />
  );
};

export default JeepTours;
