"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

export type ActionHubUiAction =
  | {
      type: "open_send_modal";
      payload: { amount?: number; recipient?: string };
    }
  | {
      type: "open_bill_modal";
      payload: { amount?: number; billerName?: string };
    };

type ActionHubHandlers = {
  openSend?: (payload: Extract<ActionHubUiAction, { type: "open_send_modal" }>["payload"]) => void;
  openBill?: (payload: Extract<ActionHubUiAction, { type: "open_bill_modal" }>["payload"]) => void;
};

interface ActionHubControllerValue {
  executeAction: (action: ActionHubUiAction) => void;
  registerHandlers: (handlers: ActionHubHandlers) => () => void;
}

const ActionHubControllerContext = createContext<ActionHubControllerValue | null>(null);

export function ActionHubControllerProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<ActionHubHandlers>({});
  const pendingActionRef = useRef<ActionHubUiAction | null>(null);

  const executeAction = useCallback((action: ActionHubUiAction) => {
    const handlers = handlersRef.current;
    if (action.type === "open_send_modal" && handlers.openSend) {
      handlers.openSend(action.payload);
      pendingActionRef.current = null;
      return;
    }
    if (action.type === "open_bill_modal" && handlers.openBill) {
      handlers.openBill(action.payload);
      pendingActionRef.current = null;
      return;
    }
    pendingActionRef.current = action;
  }, []);

  const registerHandlers = useCallback(
    (handlers: ActionHubHandlers) => {
      handlersRef.current = handlers;
      if (pendingActionRef.current) {
        executeAction(pendingActionRef.current);
      }
      return () => {
        handlersRef.current = {};
      };
    },
    [executeAction]
  );

  const value = useMemo(
    () => ({ executeAction, registerHandlers }),
    [executeAction, registerHandlers]
  );

  return (
    <ActionHubControllerContext.Provider value={value}>
      {children}
    </ActionHubControllerContext.Provider>
  );
}

export function useActionHubController() {
  const context = useContext(ActionHubControllerContext);
  if (!context) {
    throw new Error("useActionHubController must be used within ActionHubControllerProvider");
  }
  return context;
}
