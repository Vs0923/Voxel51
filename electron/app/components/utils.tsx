import styled from "styled-components";

export const Box = styled.div`
  padding: 1em;
  box-sizing: border-box;
  border: 2px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
`;

export const VerticalSpacer = styled.div`
  height: ${({ height }) =>
    typeof height == "number" ? height + "px" : height};
  background-color: ${({ opaque, theme }) =>
    opaque ? theme.background : undefined};
`;

export const Button = styled.button`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.button};
  color: ${({ theme }) => theme.font};
  border: 1px solid ${({ theme }) => theme.buttonBorder};
  border-radius: 1px;
  margin: 0 3px;
  padding: 3px 10px;
  font-weight: bold;
  cursor: pointer;

  svg.MuiSvgIcon-root {
    font-size: 1.25em;
    margin-left: -3px;
    margin-right: 3px;
  }
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: ${({ theme }) => theme.overlay};
  z-index: 10000;
`;

export const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;

  > *:not(${Overlay}) {
    z-index: 10001;
  }
`;

export const ModalBody = styled.div`
  position: relative;
  width: 50vw;
  height: auto;
  min-height: 5em;
  background-color: ${({ theme }) => theme.background};
`;

export const ModalTopButtonContainer = styled.div`
  display: block;
  background-color: ${({ theme }) => theme.overlayButton};
  cursor: pointer;
  font-size: 150%;
  font-weight: bold;
  user-select: none;
  width: 2em;
  margin-top: 0;
  height: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: ${({ theme }) => theme.overlayButtonHover};
  }
`;

export const ModalFooter = styled.footer`
  display: flex;
  flex-shrink: 0;
  border-top: 2px solid ${({ theme }) => theme.border};
  padding: 1em;
  background-color: ${({ theme }) => theme.backgroundLight};
`;

export const scrollbarStyles = ({ theme }) => `
  &::-webkit-scrollbar {
    width: 10px;
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    width: 10px;
    border-radius: 5px;
    background-color: transparent;
    transition: background-color linear 0.5s;
  }
  &:hover::-webkit-scrollbar-thumb {
    background-color: ${theme.fontDarkest};
  }
`;
