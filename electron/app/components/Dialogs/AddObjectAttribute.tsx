import React, { useContext } from "react";

import BaseDialog from "./Base";
import { CurrentDialogContext } from "../../utils/dialog";

const AddObjectAttributeDialog = () => {
  const { close } = useContext(CurrentDialogContext);
  return <BaseDialog title="Add attribute">add</BaseDialog>;
};

export default AddObjectAttributeDialog;
