export type RolUsuario = 'coordinador_provincial' | 'coordinador_recinto' | 'veedor';

export interface Perfil {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rol: RolUsuario;
  recinto_id?: number | null;
  debe_cambiar_clave: boolean;
}

export interface Recinto {
  id?: number;
  provincia: string;
  canton: string;
  parroquia: string;
  nombre: string;
  cantidad_jrv: number;
  coordinador_id?: string | null;
}

export interface Jrv {
  id: number;
  recinto_id: number;
  numero_mesa: number;
  genero: string;
  veedor_id?: string | null;
  estado: 'pendiente' | 'registrada' | 'corregida';
}

export interface Candidato {
  id: number;
  dignidad: 'alcalde' | 'prefecto';
  organizacion: string;
  lista: string;
  nombre_candidato: string;
}

export interface Acta {
  id?: number;
  jrv_id: number;
  dignidad: 'alcalde' | 'prefecto';
  votos_org1: number;
  votos_org2: number;
  votos_org3: number;
  votos_org4: number;
  votos_org5: number;
  votos_blancos: number;
  votos_nulos: number;
  total_sufragantes: number;
  foto_url: string;
  latitud: number;
  longitud: number;
  registrado_por?: string;
  actualizado_por_rol?: string;
  updated_at?: string;
}