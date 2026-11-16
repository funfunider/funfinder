import React from "react";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import CategoryActivityTemplate from "../../../components/CategoryActivityTemplate";

const SeaOther = () => {
  return (
    <CategoryActivityTemplate
      categoryKeys={["sea other", "beach", "cutter", "diving", "წყლის"]}
      titleKa="სხვა საზღვაო აქტივობები"
      titleEn="Other Sea Adventures"
      subtitleKa="წყლის ატრაქციონები, დაივინგი და ზღვის გასართობები"
      subtitleEn="Water attractions, scuba diving, and Black Sea entertainment"
      icon={<BeachAccessIcon />}
      guideTarget="sea-other"
    />
  );
};

export default SeaOther;