
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function validarCedulaEcuatoriana(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;
  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito >= 6) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }
  const digitoVerificador = parseInt(cedula.charAt(9), 10);
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  const resultado = (decenaSuperior - suma) % 10;
  return resultado === digitoVerificador;
}

export function cedulaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = (control.value || '').trim();
    if (!val) return null;
    return validarCedulaEcuatoriana(val) ? null : { cedulaInvalida: true };
  };
}

export function cuadraturaActaValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const o1 = Number(group.get('votos_org1')?.value || 0);
    const o2 = Number(group.get('votos_org2')?.value || 0);
    const o3 = Number(group.get('votos_org3')?.value || 0);
    const o4 = Number(group.get('votos_org4')?.value || 0);
    const o5 = Number(group.get('votos_org5')?.value || 0);
    const blancos = Number(group.get('votos_blancos')?.value || 0);
    const nulos = Number(group.get('votos_nulos')?.value || 0);
    const total = Number(group.get('total_sufragantes')?.value || 0);

    const suma = o1 + o2 + o3 + o4 + o5 + blancos + nulos;
    if (total <= 0) return { totalCero: true };
    return suma === total ? null : { descuadreVotos: { suma, total } };
  };
}