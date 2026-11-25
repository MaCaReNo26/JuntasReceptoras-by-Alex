import { describe, it, expect } from 'vitest';
import { FormControl, FormGroup } from '@angular/forms';
import { cedulaValidator, cuadraturaActaValidator, validarCedulaEcuatoriana } from './electoral.validators';

describe('Validadores Electorales', () => {
  it('debe aceptar una cédula ecuatoriana válida', () => {
    expect(validarCedulaEcuatoriana('1710034065')).toBe(true);
  });

  it('debe rechazar una cédula con dígito verificador incorrecto', () => {
    const control = new FormControl('1710034069', [cedulaValidator()]);
    expect(control.hasError('cedulaInvalida')).toBe(true);
  });

  it('debe validar que la suma de votos coincida con el total de sufragantes', () => {
    const form = new FormGroup({
      votos_org1: new FormControl(40),
      votos_org2: new FormControl(30),
      votos_org3: new FormControl(20),
      votos_org4: new FormControl(10),
      votos_org5: new FormControl(5),
      votos_blancos: new FormControl(3),
      votos_nulos: new FormControl(2),
      total_sufragantes: new FormControl(110)
    }, { validators: cuadraturaActaValidator() });

    expect(form.valid).toBe(true);
  });

  it('debe marcar descuadre cuando la suma de votos difiere de sufragantes', () => {
    const form = new FormGroup({
      votos_org1: new FormControl(40),
      votos_org2: new FormControl(30),
      votos_org3: new FormControl(20),
      votos_org4: new FormControl(10),
      votos_org5: new FormControl(5),
      votos_blancos: new FormControl(3),
      votos_nulos: new FormControl(2),
      total_sufragantes: new FormControl(100)
    }, { validators: cuadraturaActaValidator() });

    expect(form.hasError('descuadreVotos')).toBe(true);
  });
});