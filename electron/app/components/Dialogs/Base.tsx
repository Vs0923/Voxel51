import React, { useContext } from "react";
import styled from "styled-components";
import { Close } from "@material-ui/icons";

import {
  Button,
  ModalBody,
  ModalTopButtonContainer,
  ModalFooter,
} from "../utils";
import { CurrentDialogContext } from "../../utils/dialog";

const Body = styled.div`
  padding: 1em;
  padding-top: 0;
`;

const Footer = styled(ModalFooter)`
  justify-content: flex-end;
`;

const CloseButtonContainer = styled(ModalTopButtonContainer)`
  position: absolute;
  top: 0;
  right: 0;
`;

const BaseDialog = ({ title, value, children }) => {
  const { close, submit } = useContext(CurrentDialogContext);

  return (
    <ModalBody>
      <CloseButtonContainer onClick={close}>
        <Close />
      </CloseButtonContainer>
      <Body>
        <h2>{title}</h2>
        {children}
      </Body>
      <Footer>
        <Button onClick={() => submit(value)}>OK</Button>
      </Footer>
    </ModalBody>
  );
};

export default BaseDialog;
