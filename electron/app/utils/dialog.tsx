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
  const [dialogs, setDialogs] = useContext(DialogContext);
  if (!dialogs.length) {
    return null;
  }
  return dialogs.map(({ node, context }, i) => (
    <CurrentDialogContext.Provider value={context} key={i}>
      <ModalWrapper>
        <Overlay
          onClick={() =>
            setDialogs((dialogs) => {
              const top = dialogs.slice(-1)[0];
              if (top && top.context.close) {
                top.context.close();
              }
              return dialogs.slice(0, -1);
            })
          }
        />
        {node}
      </ModalWrapper>
    </CurrentDialogContext.Provider>
  ));
};

export const useShowDialog = () => {
  const [_, setDialogs] = useContext(DialogContext);
  return async (newDialog) => {
    const dialog = { node: newDialog, context: {} };
    dialog.context.close = () => dialog.resolve(null);
    dialog.context.submit = (value) => dialog.resolve(value);

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
