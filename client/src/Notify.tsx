// This class serves to be a wrapper around whatever notification
// component/system we use. Right now, that is 'cogo-toast', but it could
// change. The idea though is that changes to the details of how the
// notifications are made should be insulated away from the main application
// logic, so we can swap these things out with less friction.

import React from 'react';
import cogoToast, { CTOptions } from 'cogo-toast';

import BackendError from './BackendError';

const position = 'bottom-center';
const hideAfter = 5;

enum NotifyKind {
  Success = 'SUCCESS',
  Info = 'INFO',
  Loading = 'LOADING',
  Error = 'ERROR',
}

function sendNotification(
  notifyKind: NotifyKind,
  notifyFunc: (fullMessage: React.ReactNode, options: CTOptions) => void,
  msg: string,
  details?: any,
) {
  let detailElems = <></>;
  if (details) {
    const detailText =
      details instanceof BackendError
        ? JSON.stringify(details.json(), null, 2)
        : JSON.stringify(details, null, 2);

    detailElems = (
      <pre className="italic">
        <code>{detailText}</code>
      </pre>
    );
  }

  const formattedMessage = `${
    notifyKind === NotifyKind.Error ? 'Error: ' : ''
  }${msg.charAt(0).toUpperCase() + msg.slice(1)}`;

  const notifyElem = (
    <div>
      <p className="font-bold">{formattedMessage}.</p>
      {notifyKind === NotifyKind.Error ? (
        <p className="underline">Details:</p>
      ) : (
        <></>
      )}
      {detailElems}
    </div>
  );

  notifyFunc(notifyElem, { position, hideAfter });
}

function notify(notifyKind: NotifyKind, msg: string, details?: any) {
  let notifyFunc = cogoToast.info;
  switch (notifyKind) {
    case NotifyKind.Success: {
      notifyFunc = cogoToast.success;
      break;
    }
    case NotifyKind.Info: {
      notifyFunc = cogoToast.info;
      break;
    }
    case NotifyKind.Loading: {
      notifyFunc = cogoToast.loading;
      break;
    }
    case NotifyKind.Error: {
      notifyFunc = cogoToast.error;
      break;
    }
    default:
      notifyFunc = cogoToast.info;
  }

  sendNotification(notifyKind, notifyFunc, msg, details);
}

export function success(msg: string, details?: any) {
  notify(NotifyKind.Success, msg, details);
}

export function info(msg: string, details?: any) {
  notify(NotifyKind.Info, msg, details);
}

export function loading(msg: string, details?: any) {
  notify(NotifyKind.Loading, msg, details);
}

export function error(msg: string, details?: any) {
  notify(NotifyKind.Error, msg, details);
}
