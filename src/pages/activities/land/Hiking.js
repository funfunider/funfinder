import React from "react";
import TerrainIcon from "@mui/icons-material/Terrain";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const Hiking = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["hiking", "hike", "trekking", "ლაშქრობა"]}
      titleKa="ლაშქრობა და ტრეკინგი"
      titleEn="Hiking & Trekking"
      subtitleKa="აღმოაჩინე საქართველოს მწვერვალები, ჩანჩქერები და საიდუმლო ბილიკები"
      subtitleEn="Explore Georgia's mountains, waterfalls, and scenic hiking trails"
      icon={<TerrainIcon />}
      guideTarget="hiking"
    />
  );
};

export default Hiking;
