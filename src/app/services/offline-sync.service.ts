import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { Network } from '@capacitor/network';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { SupabaseService } from './supabase.service';
import { Acta } from '../models/electoral.model';

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private onlineSubject = new BehaviorSubject<boolean>(true);
  private pendientesSubject = new BehaviorSubject<number>(0);

  public readonly online$ = this.onlineSubject.asObservable();
  public readonly isOnline = toSignal(this.onlineSubject, { initialValue: true });
  public readonly pendientesCount = toSignal(this.pendientesSubject, { initialValue: 0 });

  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;

  constructor(private sb: SupabaseService) {
    this.inicializarRed();
    this.inicializarSqlite();
  }

  private async inicializarRed() {
    const status = await Network.getStatus();
    this.onlineSubject.next(status.connected);

    Network.addListener('networkStatusChange', async (estado) => {
      this.onlineSubject.next(estado.connected);
      if (estado.connected) {
        await this.sincronizarPendientes();
      }
    });
  }

  private async inicializarSqlite() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      this.db = await this.sqlite.createConnection('electoral_offline', false, 'no-encryption', 1, false);
      await this.db.open();
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS cola_actas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          jrv_id INTEGER,
          dignidad TEXT,
          payload TEXT,
          foto_base64 TEXT,
          captured_at TEXT,
          estado TEXT DEFAULT 'PENDIENTE'
        );
      `);
      await this.actualizarContador();
    } catch {}
  }

  async encolarActaOffline(acta: Acta, fotoBase64: string): Promise<void> {
    const capturedAt = new Date().toISOString();
    if (this.db) {
      await this.db.run(
        `INSERT INTO cola_actas (jrv_id, dignidad, payload, foto_base64, captured_at, estado) VALUES (?, ?, ?, ?, ?, 'PENDIENTE')`,
        [acta.jrv_id, acta.dignidad, JSON.stringify(acta), fotoBase64, capturedAt]
      );
      await this.actualizarContador();
    } else {
      const lista = JSON.parse(localStorage.getItem('cola_actas_web') || '[]');
      lista.push({ id: Date.now(), jrv_id: acta.jrv_id, dignidad: acta.dignidad, payload: JSON.stringify(acta), foto_base64: fotoBase64, captured_at: capturedAt });
      localStorage.setItem('cola_actas_web', JSON.stringify(lista));
      this.pendientesSubject.next(lista.length);
    }
  }

  private async actualizarContador() {
    if (this.db) {
      const res = await this.db.query(`SELECT COUNT(*) as total FROM cola_actas WHERE estado = 'PENDIENTE'`);
      this.pendientesSubject.next(res.values?.[0]?.total || 0);
    } else {
      const lista = JSON.parse(localStorage.getItem('cola_actas_web') || '[]');
      this.pendientesSubject.next(lista.length);
    }
  }

  async sincronizarPendientes(): Promise<number> {
    let sincronizadas = 0;
    const pendientes: any[] = [];

    if (this.db) {
      const res = await this.db.query(`SELECT * FROM cola_actas WHERE estado = 'PENDIENTE'`);
      if (res.values) pendientes.push(...res.values);
    } else {
      pendientes.push(...JSON.parse(localStorage.getItem('cola_actas_web') || '[]'));
    }

    for (const item of pendientes) {
      try {
        const acta: Acta = JSON.parse(item.payload);

        const { data: existente } = await this.sb.client
          .from('actas')
          .select('actualizado_por_rol, updated_at')
          .eq('jrv_id', acta.jrv_id)
          .eq('dignidad', acta.dignidad)
          .maybeSingle();

        if (existente && existente.actualizado_por_rol === 'coordinador_recinto') {
          await this.marcarComoProcesado(item.id, 'CONFLICTO_RESUELTO');
          continue;
        }

        const blob = await (await fetch(item.foto_base64)).blob();
        const fileName = `jrv_${acta.jrv_id}_${acta.dignidad}_${Date.now()}.jpg`;
        const { error: errUpload } = await this.sb.client.storage.from('actas').upload(fileName, blob);
        if (errUpload) throw errUpload;

        const { data: urlData } = this.sb.client.storage.from('actas').getPublicUrl(fileName);
        acta.foto_url = urlData.publicUrl;
        acta.updated_at = new Date().toISOString();

        const { error: errUpsert } = await this.sb.client
          .from('actas')
          .upsert(acta, { onConflict: 'jrv_id,dignidad' });
        if (errUpsert) throw errUpsert;

        await this.sb.client.from('jrv').update({ estado: 'registrada' }).eq('id', acta.jrv_id);
        await this.marcarComoProcesado(item.id, 'SINCRONIZADO');
        sincronizadas++;
      } catch {}
    }

    await this.actualizarContador();
    return sincronizadas;
  }

  private async marcarComoProcesado(id: number, estado: string) {
    if (this.db) {
      await this.db.run(`UPDATE cola_actas SET estado = ? WHERE id = ?`, [estado, id]);
    } else {
      const lista = JSON.parse(localStorage.getItem('cola_actas_web') || '[]').filter((x: any) => x.id !== id);
      localStorage.setItem('cola_actas_web', JSON.stringify(lista));
    }
  }
}