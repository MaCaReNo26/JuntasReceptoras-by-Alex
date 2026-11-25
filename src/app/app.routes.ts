import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  {
    path: 'cambiar-clave',
    loadComponent: () => import('./pages/cambiar-clave/cambiar-clave.page').then((m) => m.CambiarClavePage),
  },
  {
    path: 'provincial',
    canActivate: [roleGuard('coordinador_provincial')],
    loadComponent: () => import('./pages/provincial/provincial.page').then((m) => m.ProvincialPage),
  },
  {
    path: 'recinto',
    canActivate: [roleGuard('coordinador_recinto')],
    loadComponent: () => import('./pages/recinto/recinto.page').then((m) => m.RecintoPage),
  },
  {
    path: 'veedor',
    canActivate: [roleGuard('veedor')],
    loadComponent: () => import('./pages/veedor/veedor.page').then((m) => m.VeedorPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'cambiar-clave',
    loadComponent: () => import('./pages/cambiar-clave/cambiar-clave.page').then((m) => m.CambiarClavePage),
  },
  {
    path: 'provincial',
    loadComponent: () => import('./pages/provincial/provincial.page').then((m) => m.ProvincialPage),
  },
  {
    path: 'recinto',
    loadComponent: () => import('./pages/recinto/recinto.page').then((m) => m.RecintoPage),
  },
  {
    path: 'veedor',
    loadComponent: () => import('./pages/veedor/veedor.page').then((m) => m.VeedorPage),
  },
];
