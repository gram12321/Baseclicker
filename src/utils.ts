export function formatNumber(value: number, options?: {
  decimals?: number;
  forceDecimals?: boolean;
  smartDecimals?: boolean;
  smartMaxDecimals?: boolean;
  adaptiveNearOne?: boolean;
  currency?: boolean;
  compact?: boolean;
  percent?: boolean;
  percentIsDecimal?: boolean;
}): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return options?.currency ? '€0' : '0';
  }
  
  const { 
    decimals, 
    forceDecimals = false, 
    smartDecimals = false, 
    smartMaxDecimals = false,
    adaptiveNearOne = true,
    currency = false,
    compact = false,
    percent = false,
    percentIsDecimal = true
  } = options || {};

  // Handle percentage formatting first (ignores compact/currency)
  if (percent) {
    const finalDecimals = decimals !== undefined ? decimals : 1;
    const percentage = percentIsDecimal ? value * 100 : value;
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: finalDecimals,
      maximumFractionDigits: finalDecimals
    }).format(percentage / 100);
  }

  // Handle compact notation (with or without currency)
  if (compact) {
    const absValue = Math.abs(value);
    const compactDecimals = decimals !== undefined ? decimals : 1;
    
    let compactValue: string;
    if (absValue >= 1e12) {
      compactValue = (value / 1e12).toFixed(compactDecimals) + 'T';
    } else if (absValue >= 1e9) {
      compactValue = (value / 1e9).toFixed(compactDecimals) + 'B';
    } else if (absValue >= 1e6) {
      compactValue = (value / 1e6).toFixed(compactDecimals) + 'M';
    } else if (absValue >= 1e3) {
      compactValue = (value / 1e3).toFixed(compactDecimals) + 'K';
    } else {
      compactValue = value.toFixed(compactDecimals);
    }
    
    return currency ? '€' + compactValue : compactValue;
  }
  
  // Handle currency formatting (non-compact)
  if (currency) {
    const finalDecimals = decimals !== undefined ? decimals : 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: finalDecimals,
      maximumFractionDigits: finalDecimals
    }).format(value);
  }
  
  // Regular number formatting (original logic)
  const effectiveDecimals = decimals ?? 2;

  // Smart max decimals: reduce decimals for larger numbers
  let calculatedDecimals = effectiveDecimals;
  if (smartMaxDecimals) {
    const absValue = Math.abs(value);
    if (absValue >= 10) {
      calculatedDecimals = 0;
    } else if (absValue >= 1) {
      calculatedDecimals = 1;
    } else {
      calculatedDecimals = 2;
    }
  }
  
  // Dynamically increase precision when approaching 1.0
  if (adaptiveNearOne && value < 1 && value >= 0.95) {
    calculatedDecimals = Math.max(calculatedDecimals, 4);
    if (value >= 0.98) {
      calculatedDecimals = Math.max(calculatedDecimals, 5);
    }
  }
  
  // For large numbers (>1000), don't show decimals unless forced
  if (Math.abs(value) >= 1000 && !forceDecimals && !smartDecimals) {
    return value.toLocaleString('de-DE', {
      maximumFractionDigits: 0
    });
  }
  
  // For small whole numbers, don't show decimals unless forced
  if (Number.isInteger(value) && !forceDecimals && !smartDecimals) {
    return value.toLocaleString('de-DE', {
      maximumFractionDigits: 0
    });
  }
  
  // Smart decimals mode: intelligent decimal display based on value magnitude
  if (smartDecimals) {
    if (value === 0) {
      return '0';
    }
    
    if (decimals !== undefined) {
      const maxDecimals = Math.min(calculatedDecimals, 6);
      const formatted = value.toLocaleString('de-DE', {
        minimumFractionDigits: forceDecimals ? maxDecimals : 0,
        maximumFractionDigits: maxDecimals
      });
      return formatted;
    }
    
    if (Math.abs(value) >= 1) {
      const maxDecimals = Math.min(calculatedDecimals, 6);
      return value.toLocaleString('de-DE', {
        minimumFractionDigits: forceDecimals ? maxDecimals : 0,
        maximumFractionDigits: maxDecimals
      });
    }
    
    if (adaptiveNearOne && value >= 0.95) {
      let adaptiveDecimals = 4;
      if (value >= 0.98) {
        adaptiveDecimals = 5;
      }
      return value.toLocaleString('de-DE', {
        minimumFractionDigits: forceDecimals ? adaptiveDecimals : 0,
        maximumFractionDigits: adaptiveDecimals
      });
    }
    
    const absValue = Math.abs(value);
    const log10 = Math.log10(absValue);
    const firstNonZeroPosition = Math.ceil(-log10);
    const totalDecimals = Math.min(firstNonZeroPosition + 1, 6);
    const finalDecimals = Math.max(totalDecimals, 2);
    
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: forceDecimals ? finalDecimals : 0,
      maximumFractionDigits: finalDecimals
    });
  }
  
  // For decimals or when forced, show specified decimal places
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: calculatedDecimals,
    maximumFractionDigits: calculatedDecimals
  });
}

export function formatCurrency(
  value: number,
  options: { maxDecimals?: number; minDecimals?: number; showSign?: boolean } = {}
): string {
  const sign = value < 0 ? '-' : options.showSign ? '+' : '';
  const absValue = Math.abs(value);
  const maxDecimals = Math.max(0, options.maxDecimals ?? 2);
  const minDecimals = Math.max(0, Math.min(options.minDecimals ?? 0, maxDecimals));
  const forceDecimals = minDecimals === maxDecimals && maxDecimals > 0;

  return `${sign}$${formatNumber(absValue, {
    decimals: maxDecimals,
    forceDecimals,
    smartDecimals: !forceDecimals && minDecimals === 0,
  })}`;
}
