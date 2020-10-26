import React, { useContext, useState } from "react";

import { ModalWrapper, Overlay } from "../components/utils";

export const DialogContext = React.createContext();
DialogContext.displayName = "DialogContext";

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
  return dialogs.map(({ node }, i) => (
    <ModalWrapper key={i}>
      <Overlay
        onClick={() =>
          setDialogs((dialogs) => {
            const top = dialogs.slice(-1)[0];
            if (top && top.resolve) {
              top.resolve(null);
            }
            return dialogs.slice(0, -1);
          })
        }
      />
      {node}
    </ModalWrapper>
  ));
};

export const useShowDialog = () => {
  const [_, setDialogs] = useContext(DialogContext);
  return async (newDialog) => {
    const newObj = { node: newDialog };
    setDialogs((dialogs) => [...dialogs, newObj]);
    return new Promise((resolve, reject) => {
      try {
        newObj.resolve = resolve;
      } catch (err) {
        reject(err);
      }
    });
  };
};
