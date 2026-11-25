import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Perfil } from '../models/electoral.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _perfil = signal<Perfil | null>(null);
  private _cargando = signal<boolean>(false);
  private _error = signal<string | null>(null);

  public readonly perfil = this._perfil.asReadonly();
  public readonly cargando = this._cargando.asReadonly();
  public readonly error = this._error.asReadonly();

  constructor(private sb: SupabaseService) { }

  async loginConCedula(cedula: string, password: string): Promise<Perfil> {
    this._cargando.set(true);
    this._error.set(null);
    try {
      const { data: correo, error: errRpc } = await this.sb.client
        .rpc('obtener_correo_por_cedula', { p_cedula: cedula.trim() });

      if (errRpc || !correo) {
        throw new Error('Cédula no registrada en el sistema.');
      }

      const { data: authData, error: errAuth } = await this.sb.client.auth.signInWithPassword({
        email: correo,
        password
      });

      if (errAuth || !authData.user) {
        throw new Error('Credenciales incorrectas.');
      }

      const { data: perfilEncontrado, error: errPerfil } = await this.sb.client
        .from('perfiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (errPerfil || !perfilEncontrado) {
        throw new Error('No se pudo cargar el perfil del usuario.');
      }

      this._perfil.set(perfilEncontrado as Perfil);
      return perfilEncontrado as Perfil;
    } catch (e: any) {
      this._error.set(e.message);
      throw e;
    } finally {
      this._cargando.set(false);
    }
  }

  async cambiarClaveObligatoria(nuevaClave: string): Promise<void> {
    this._cargando.set(true);
    try {
      const actual = this._perfil();
      if (!actual) throw new Error('Sesión no válida.');

      const { error: errPass } = await this.sb.client.auth.updateUser({ password: nuevaClave });
      if (errPass) throw errPass;

      const { error: errPerfil } = await this.sb.client
        .from('perfiles')
        .update({ debe_cambiar_clave: false })
        .eq('id', actual.id);

      if (errPerfil) throw errPerfil;

      this._perfil.set({ ...actual, debe_cambiar_clave: false });
    } finally {
      this._cargando.set(false);
    }
  }

  async recuperarClave(correo: string): Promise<void> {
    const { error } = await this.sb.client.auth.resetPasswordForEmail(correo.trim());
    if (error) throw error;
  }

  async crearUsuarioJerarquico(datos: {
    cedula: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    correo: string;
    rol: 'coordinador_recinto' | 'veedor';
    recinto_id?: number | null;
  }): Promise<void> {
    const { data, error } = await this.sb.client.functions.invoke('crear-usuario', {
      body: datos
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  }

  async logout(): Promise<void> {
    await this.sb.client.auth.signOut();
    this._perfil.set(null);
  }
}