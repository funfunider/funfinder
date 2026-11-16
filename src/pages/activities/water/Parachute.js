import React from "react";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const Parachute = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["parachute", "paragliding", "skydiving", "parasailing", "პარაგლაიდინგი", "პარაშუტი"]}
      titleKa="პარაგლაიდინგი & პარაშუტი"
      titleEn="Paragliding & Parasailing"
      subtitleKa="ფრენა ღრუბლებში და დაუვიწყარი პანორამული ხედები სიმაღლიდან"
      subtitleEn="Soar through the clouds and enjoy breathtaking aerial views"
      icon={<FlightTakeoffIcon />}
      guideTarget="parachute"
    />
  );
};

export default Parachute;
