import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/electoral.model';

export const roleGuard = (rolPermitido: RolUsuario): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const perfil = auth.perfil();

    if (!perfil) {
      router.navigateByUrl('/login');
      return false;
    }
    if (perfil.debe_cambiar_clave) {
      router.navigateByUrl('/cambiar-clave');
      return false;
    }
    if (perfil.rol !== rolPermitido) {
      router.navigateByUrl('/login');
      return false;
    }
    return true;
  };
};