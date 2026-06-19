import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'truncate',
  standalone: true 
})
export class TruncatePipe implements PipeTransform {
  
  transform(value: number, decimals: number = 2): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00';
    }
    
    // Multiplicar por 10^decimales, truncar y dividir de nuevo
    const factor = Math.pow(10, decimals);
    const truncated = Math.trunc(value * factor) / factor;
    
    return truncated.toFixed(decimals);
  }
}
