import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
  IonLabel, IonItem, IonInput, IonSelect, IonSelectOption, IonButton,
  IonCard, IonCardContent, IonList, IonButtons,
  IonBadge, IonModal, ToastController
} from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../../services/auth.service';
import { ElectoralService } from '../../services/electoral.service';
import { cedulaValidator } from '../../validators/electoral.validators';
import { Acta } from '../../models/electoral.model';

@Component({
  selector: 'app-recinto',
  templateUrl: './recinto.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
    IonLabel, IonItem, IonInput, IonSelect, IonSelectOption, IonButton,
    IonCard, IonCardContent, IonList, IonButtons,
    IonBadge, IonModal
  ]
})
export class RecintoPage implements OnInit {
  vista = signal<'mesas' | 'veedores' | 'actas'>('mesas');
  veedorForm: FormGroup;

  modalCorreccionAbierto = false;
  actaSeleccionada: Acta | null = null;
  infoVeedorActa = '';
  infoCoordinadorActa = '';
  nombresCandidatosActa: string[] = [];
  formCorreccion = {
    v1: 0, v2: 0, v3: 0, v4: 0, v5: 0,
    blancos: 0, nulos: 0, sufragantes: 0
  };

  mesasDelRecinto = computed(() => {
    const recId = this.auth.perfil()?.recinto_id;
    return this.electoral.jrvs().filter(j => j.recinto_id === recId);
  });

  actasDelRecinto = computed(() => {
    const ids = new Set(this.mesasDelRecinto().map(j => j.id));
    return this.electoral.actas().filter(a => ids.has(a.jrv_id));
  });

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    public electoral: ElectoralService,
    private router: Router,
    private toast: ToastController
  ) {
    this.veedorForm = this.fb.group({
      cedula: ['', [Validators.required, cedulaValidator()]],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      telefono: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  async ngOnInit() {
    const recId = this.auth.perfil()?.recinto_id;
    await this.electoral.cargarDatosIniciales();
    if (recId) {
      await this.electoral.cargarPersonalPorRol('veedor', recId);
    }
  }

  async crearVeedor() {
    if (this.veedorForm.invalid) return;
    try {
      await this.auth.crearUsuarioJerarquico({
        ...this.veedorForm.value,
        rol: 'veedor',
        recinto_id: this.auth.perfil()?.recinto_id
      });
      const recId = this.auth.perfil()?.recinto_id;
      if (recId) await this.electoral.cargarPersonalPorRol('veedor', recId);
      this.veedorForm.reset();
      const t = await this.toast.create({ message: 'Veedor creado (clave: Ecuador2026).', duration: 2500, color: 'success' });
      t.present();
    } catch (e: any) {
      const t = await this.toast.create({ message: e.message, duration: 2500, color: 'danger' });
      t.present();
    }
  }

  async asignarVeedor(jrvId: number, veedorId: string) {
    try {
      await this.electoral.asignarVeedorAJrv(jrvId, veedorId);
      const t = await this.toast.create({ message: 'Veedor asignado a la JRV.', duration: 2000, color: 'success' });
      t.present();
    } catch (e: any) {
      const t = await this.toast.create({ message: e.message, duration: 2500, color: 'danger' });
      t.present();
    }
  }

  corregirActa(acta: Acta) {
    const jrv = this.electoral.jrvs().find(j => j.id === acta.jrv_id);
    const veedor = this.electoral.veedores().find(v => v.id === jrv?.veedor_id);

    this.infoVeedorActa = veedor
      ? `${veedor.nombres} ${veedor.apellidos} (CI: ${veedor.cedula})`
      : 'Veedor asignado a la mesa';

    const coord = this.auth.perfil();
    this.infoCoordinadorActa = coord
      ? `${coord.nombres} ${coord.apellidos} (CI: ${coord.cedula})`
      : 'Coordinador de Recinto';

    const cands = this.electoral.candidatos().filter(c => c.dignidad === acta.dignidad);
    this.nombresCandidatosActa = [0, 1, 2, 3, 4].map(i => {
      const c: any = cands[i];
      if (!c) return `Candidato ${i + 1}`;
      const nombreCand = c.nombres || c.nombre || `Candidato ${i + 1}`;
      return c.lista ? `${nombreCand} (${c.lista})` : nombreCand;
    });

    this.actaSeleccionada = acta;
    this.formCorreccion = {
      v1: acta.votos_org1,
      v2: acta.votos_org2,
      v3: acta.votos_org3,
      v4: acta.votos_org4,
      v5: acta.votos_org5,
      blancos: acta.votos_blancos,
      nulos: acta.votos_nulos,
      sufragantes: acta.total_sufragantes
    };
    this.modalCorreccionAbierto = true;
  }

  cerrarModalCorreccion() {
    this.modalCorreccionAbierto = false;
    this.actaSeleccionada = null;
  }

  async guardarCorreccionModal() {
    if (!this.actaSeleccionada?.id) return;

    const { v1, v2, v3, v4, v5, blancos, nulos, sufragantes } = this.formCorreccion;
    const suma = Number(v1) + Number(v2) + Number(v3) + Number(v4) + Number(v5) + Number(blancos) + Number(nulos);

    if (suma !== Number(sufragantes)) {
      const t = await this.toast.create({
        message: `Descuadre: la suma (${suma}) debe igualar a Sufragantes (${sufragantes}).`,
        duration: 3000,
        color: 'danger'
      });
      t.present();
      return;
    }

    try {
      await this.electoral.actualizarActaCorregida(this.actaSeleccionada.id, {
        votos_org1: Number(v1),
        votos_org2: Number(v2),
        votos_org3: Number(v3),
        votos_org4: Number(v4),
        votos_org5: Number(v5),
        votos_blancos: Number(blancos),
        votos_nulos: Number(nulos),
        total_sufragantes: Number(sufragantes),
        actualizado_por_rol: 'coordinador_recinto',
        updated_at: new Date().toISOString()
      });

      const t = await this.toast.create({
        message: `Acta corregida por ${this.infoCoordinadorActa}.`,
        duration: 2500,
        color: 'success'
      });
      t.present();
      this.cerrarModalCorreccion();
    } catch (e: any) {
      const t = await this.toast.create({ message: e.message, duration: 2500, color: 'danger' });
      t.present();
    }
  }

  async cambiarFotoActa(acta: Acta) {
    try {
      const foto = await Camera.getPhoto({
        quality: 75,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (foto.dataUrl) {
        await this.electoral.guardarActa({ ...acta }, foto.dataUrl, 'coordinador_recinto');
        const t = await this.toast.create({
          message: 'Foto del acta actualizada correctamente.',
          duration: 2200,
          color: 'success'
        });
        t.present();
      }
    } catch (e: any) {
      if (!String(e?.message || '').includes('User cancelled')) {
        const t = await this.toast.create({
          message: e.message || 'No se pudo capturar la foto.',
          duration: 2500,
          color: 'danger'
        });
        t.present();
      }
    }
  }

  async salir() {
    await this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}