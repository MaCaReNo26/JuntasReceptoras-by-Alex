import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { OfflineSyncService } from './offline-sync.service';
import { Acta, Candidato, Jrv, Perfil, Recinto } from '../models/electoral.model';

@Injectable({ providedIn: 'root' })
export class ElectoralService {
  private _recintos = signal<Recinto[]>([]);
  private _jrvs = signal<Jrv[]>([]);
  private _candidatos = signal<Candidato[]>([]);
  private _actas = signal<Acta[]>([]);
  private _veedores = signal<Perfil[]>([]);
  private _coordinadores = signal<Perfil[]>([]);
  private _cargando = signal<boolean>(false);
  private _error = signal<string | null>(null);

  public readonly recintos = this._recintos.asReadonly();
  public readonly jrvs = this._jrvs.asReadonly();
  public readonly candidatos = this._candidatos.asReadonly();
  public readonly actas = this._actas.asReadonly();
  public readonly veedores = this._veedores.asReadonly();
  public readonly coordinadores = this._coordinadores.asReadonly();
  public readonly cargando = this._cargando.asReadonly();
  public readonly error = this._error.asReadonly();

  constructor(private sb: SupabaseService, private offlineSync: OfflineSyncService) {}

  async cargarDatosIniciales() {
    this._cargando.set(true);
    this._error.set(null);
    try {
      const [recRes, candRes, jrvRes, actasRes] = await Promise.all([
        this.sb.client.from('recintos').select('*').order('id'),
        this.sb.client.from('candidatos').select('*').order('id'),
        this.sb.client.from('jrv').select('*').order('numero_mesa'),
        this.sb.client.from('actas').select('*')
      ]);

      if (recRes.data) this._recintos.set(recRes.data);
      if (candRes.data) this._candidatos.set(candRes.data);
      if (jrvRes.data) this._jrvs.set(jrvRes.data);
      if (actasRes.data) this._actas.set(actasRes.data);
    } catch (e: any) {
      this._error.set(e.message);
    } finally {
      this._cargando.set(false);
    }
  }

  async cargarPersonalPorRol(rol: 'coordinador_recinto' | 'veedor', recintoId?: number) {
    let query = this.sb.client.from('perfiles').select('*').eq('rol', rol);
    if (recintoId) query = query.eq('recinto_id', recintoId);
    const { data } = await query;
    if (rol === 'veedor') this._veedores.set(data || []);
    if (rol === 'coordinador_recinto') this._coordinadores.set(data || []);
  }

  async crearRecinto(recinto: Recinto) {
    this._cargando.set(true);
    try {
      const { data: nuevoRecinto, error } = await this.sb.client
        .from('recintos')
        .insert(recinto)
        .select()
        .single();
      if (error) throw error;

      const mesas = Array.from({ length: recinto.cantidad_jrv }, (_, idx) => ({
        recinto_id: nuevoRecinto.id,
        numero_mesa: idx + 1,
        estado: 'pendiente'
      }));
      await this.sb.client.from('jrv').insert(mesas);
      await this.cargarDatosIniciales();
    } finally {
      this._cargando.set(false);
    }
  }

  async asignarVeedorAJrv(jrvId: number, veedorId: string) {
    const { error } = await this.sb.client
      .from('jrv')
      .update({ veedor_id: veedorId })
      .eq('id', jrvId);
    if (error) throw error;
    await this.cargarDatosIniciales();
  }

  async actualizarActaCorregida(actaId: number, cambios: Partial<Acta>): Promise<void> {
    const { error } = await this.sb.client
      .from('actas')
      .update(cambios)
      .eq('id', actaId);

    if (error) throw error;
    await this.cargarDatosIniciales();
  }

  async guardarActa(acta: Acta, fotoBase64?: string, rolEditor: string = 'veedor'): Promise<'online' | 'offline'> {
    this._cargando.set(true);
    try {
      if (!this.offlineSync.isOnline() && fotoBase64) {
        await this.offlineSync.encolarActaOffline(acta, fotoBase64);
        return 'offline';
      }

      if (fotoBase64 && fotoBase64.startsWith('data:image')) {
        const blob = await (await fetch(fotoBase64)).blob();
        const fileName = `jrv_${acta.jrv_id}_${acta.dignidad}_${Date.now()}.jpg`;
        const { error: errStorage } = await this.sb.client.storage.from('actas').upload(fileName, blob);
        if (errStorage) throw errStorage;
        const { data: pubUrl } = this.sb.client.storage.from('actas').getPublicUrl(fileName);
        acta.foto_url = pubUrl.publicUrl;
      }

      acta.actualizado_por_rol = rolEditor;
      acta.updated_at = new Date().toISOString();

      const { error } = await this.sb.client
        .from('actas')
        .upsert(acta, { onConflict: 'jrv_id,dignidad' });
      if (error) throw error;

      const nuevoEstado = rolEditor === 'coordinador_recinto' ? 'corregida' : 'registrada';
      await this.sb.client.from('jrv').update({ estado: nuevoEstado }).eq('id', acta.jrv_id);
      await this.cargarDatosIniciales();
      return 'online';
    } finally {
      this._cargando.set(false);
    }
  }
}