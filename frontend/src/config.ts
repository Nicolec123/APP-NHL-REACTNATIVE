/**
 * URL do backend IceHub (API). No dispositivo físico use o IP da máquina, ex: http://192.168.1.10:4000
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:4000';
