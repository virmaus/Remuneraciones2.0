
/**
 * Utilidades para validación y normalización de RUT chileno
 */

export const validateRut = (rut: string): boolean => {
  if (!rut || typeof rut !== 'string') return false;
  
  // Limpiar puntos y guiones
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  if (cleanRut.length < 2) return false;
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
  if (!body.match(/^[0-9]+$/)) return false;
  
  return calculateDv(body) === dv;
};

export const calculateDv = (body: string): string => {
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const res = 11 - (sum % 11);
  if (res === 11) return '0';
  if (res === 10) return 'K';
  return res.toString();
};

export const normalizeRut = (rut: string): string => {
  if (!rut) return '';
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;
  
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  // Formatear con puntos y guion: 12.345.678-9
  let formatted = '';
  for (let i = body.length - 1, j = 1; i >= 0; i--, j++) {
    formatted = body[i] + formatted;
    if (j % 3 === 0 && i !== 0) {
      formatted = '.' + formatted;
    }
  }
  
  return `${formatted}-${dv}`;
};

export const cleanRut = (rut: string): string => {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};
