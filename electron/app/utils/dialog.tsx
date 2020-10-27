import React, { useContext, useState } from "react";

import { ModalWrapper, Overlay } from "../components/utils";

export const DialogContext = React.createContext();
DialogContext.displayName = "DialogContext";

export const CurrentDialogContext = React.createContext();
CurrentDialogContext.displayName = "CurrentDialogContext";

export const DialogContextProvider = ({ children }) => {
  const stateObj = useState([]);
  const Provider = DialogContext;
  return (
    <DialogContext.Provider value={stateObj}>{children}</DialogContext.Provider>
  );
};

export const DialogPlaceholder = ({}) => {
  const [dialogs] = useContext(DialogContext);
  return dialogs.map(({ node, context }, i) => (
    <CurrentDialogContext.Provider value={context} key={i}>
      <ModalWrapper>
        <Overlay onClick={() => context.close()} />
        {node}
      </ModalWrapper>
    </CurrentDialogContext.Provider>
  ));
};

export const useShowDialog = () => {
  const [_, setDialogs] = useContext(DialogContext);
  return async (newDialog) => {
    const dialog = { node: newDialog, context: {} };

    const close = (value = null) => {
      setDialogs(([...dialogs]) => {
        // remove from copy of list, return copy
        if (dialogs.includes(dialog)) {
          dialogs.splice(dialogs.indexOf(dialog), 1);
        }
        return dialogs;
      });
      dialog.resolve(value);
    };

    dialog.context.close = () => close();
    dialog.context.submit = close;

    setDialogs((dialogs) => [...dialogs, dialog]);
    return new Promise((resolve, reject) => {
      try {
        dialog.resolve = resolve;
      } catch (err) {
        reject(err);
      }
    });
  };
};
