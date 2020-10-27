import React, { useContext } from "react";

import BaseDialog from "./Base";

const AddObjectAttributeDialog = ({ numObjects = "" }) => {
  return (
    <BaseDialog
      title={`Add attribute to ${numObjects} object${
        numObjects == 1 ? "" : "s"
      }`}
      value={numObjects}
    >
      some text
    </BaseDialog>
  );
};

export default AddObjectAttributeDialog;
