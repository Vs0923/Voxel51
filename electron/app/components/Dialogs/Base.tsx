import React, { useContext } from "react";
import styled from "styled-components";
import { Close } from "@material-ui/icons";

import { ModalBody, ModalTopButtonContainer } from "../utils";
import { CurrentDialogContext } from "../../utils/dialog";

const Body = styled(ModalBody)`
  padding: 1em;
  padding-top: 0;
`;

const CloseButtonContainer = styled(ModalTopButtonContainer)`
  position: absolute;
  top: 0;
  right: 0;
`;

const BaseDialog = ({ title, children }) => {
  const { close } = useContext(CurrentDialogContext);

  return (
    <Body>
      <CloseButtonContainer>
        <Close onClick={close} />
      </CloseButtonContainer>
      <h2>{title}</h2>
      {children}
    </Body>
  );
};

export default BaseDialog;
