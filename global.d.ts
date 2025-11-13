// global.d.ts
declare global {
  interface Window {
    marqeta?: {
      bootstrap(params: MarqetaShowPanParams | MarqetaPinRevealParams): void;
    };
  }
}

// marqeta.d.ts
interface MarqetaBaseParams {
  clientAccessToken: string;
  options?: {
    // Must be included if using PIN reveal
    cardholderVerificationMethod: 'OTHER';
  };
  integrationType: 'custom';
  callbackEvents?: {
    onSuccess?: () => void;
    onFailure: () => void;
  };
}
type Copy = {
  domId: string;
  mode: 'transparent';
  onCopySuccess: () => void;
  onCopyFailure: (error: Error) => void;
};
export interface MarqetaShowPanParams extends MarqetaBaseParams {
  component: {
    showPan: {
      cardPan?: MarqetaShowItem;
      cardExp?: MarqetaShowItem;
      cardCvv?: Omit<MarqetaShowItem, 'format'>;
      copyCardPan?: Copy;
      copyCardExp?: Copy;
      copyCardCvv?: Copy;
    };
    pinReveal?: undefined;
  };
}

export interface MarqetaPinRevealParams extends MarqetaBaseParams {
  component: {
    showPan?: undefined;
    pinReveal: {
      cardPin: Omit<MarqetaShowItem, 'format'>;
      toggleCardPin?: {
        domId: string;
        mode: 'transparent';
        onRevealSuccess?: () => void;
        onHideSuccess?: () => void;
      };
      hidePinTimeout?: {
        domId: string;
        hideTimeout: 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
        styles: CSSProperties;
        onSuccess?: () => void;
        onFailure?: () => void;
      };
    };
  };
}

export interface MarqetaShowItem {
  domId: string;
  format?: boolean;
  styles?: {
    span?: CSSProperties;
    'span:hover'?: CSSProperties;
  };
  mode?: 'transparent';
  onCopySuccess?: () => void;
  onCopyFailure?: () => void;
}
