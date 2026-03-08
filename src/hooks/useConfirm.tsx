import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface DialogState extends ConfirmOptions {
  open: boolean;
  resolve: (val: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ ...opts, open: true, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <AlertDialog open={dialog.open} onOpenChange={(open) => { if (!open) handleCancel(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
              {dialog.description && (
                <AlertDialogDescription>{dialog.description}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>
                {dialog.cancelLabel ?? 'Zrušiť'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={dialog.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              >
                {dialog.confirmLabel ?? 'Potvrdiť'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
