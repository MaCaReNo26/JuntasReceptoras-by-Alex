import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonSelect,
  IonSelectOption, IonButton, IonList, IonButtons, IonBadge, IonText,
  IonSpinner, IonLabel, ToastController
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { ElectoralService } from '../../services/electoral.service';
import { CameraGpsService } from '../../services/camera-gps.service';
import { OfflineSyncService } from '../../services/offline-sync.service';
import { cuadraturaActaValidator } from '../../validators/electoral.validators';

@Component({
  selector: 'app-veedor',
  templateUrl: './veedor.page.html',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonInput, IonSelect, IonSelectOption, IonButton, IonList, IonButtons,
    IonBadge, IonText, IonLabel, IonSpinner
  ]
})
export class VeedorPage implements OnInit {
  mesaSeleccionadaId = signal<number | null>(null);
  dignidadSeleccionada = signal<'alcalde' | 'prefecto'>('alcalde');
  fotoCapturada = signal<string | null>(null);
  gpsCapturado = signal<{ latitud: number; longitud: number } | null>(null);

  actaForm: FormGroup;

  misMesas = computed(() => {
    const uid = this.auth.perfil()?.id;
    return this.electoral.jrvs().filter(j => j.veedor_id === uid);
  });

  candidatosActuales = computed(() => {
    return this.electoral.candidatos().filter(c => c.dignidad === this.dignidadSeleccionada());
  });

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    public electoral: ElectoralService,
    private camGps: CameraGpsService,
    public offlineSync: OfflineSyncService,
    private router: Router,
    private toast: ToastController
  ) {
    this.actaForm = this.fb.group({
      votos_org1: [0, [Validators.required, Validators.min(0)]],
      votos_org2: [0, [Validators.required, Validators.min(0)]],
      votos_org3: [0, [Validators.required, Validators.min(0)]],
      votos_org4: [0, [Validators.required, Validators.min(0)]],
      votos_org5: [0, [Validators.required, Validators.min(0)]],
      votos_blancos: [0, [Validators.required, Validators.min(0)]],
      votos_nulos: [0, [Validators.required, Validators.min(0)]],
      total_sufragantes: [0, [Validators.required, Validators.min(1)]]
    }, { validators: cuadraturaActaValidator() });
  }

  async ngOnInit() {
    await this.electoral.cargarDatosIniciales();
  }

  seleccionarMesa(jrvId: number) {
    this.mesaSeleccionadaId.set(jrvId);
    this.cargarActaExistente();
  }

  cambiarDignidad(dignidad: 'alcalde' | 'prefecto') {
    this.dignidadSeleccionada.set(dignidad);
    this.cargarActaExistente();
  }

  private cargarActaExistente() {
    const jrvId = this.mesaSeleccionadaId();
    const dig = this.dignidadSeleccionada();
    const existente = this.electoral.actas().find(a => a.jrv_id === jrvId && a.dignidad === dig);
    if (existente) {
      this.actaForm.patchValue(existente);
      this.fotoCapturada.set(existente.foto_url);
      this.gpsCapturado.set({ latitud: existente.latitud, longitud: existente.longitud });
    } else {
      this.actaForm.reset({
        votos_org1: 0, votos_org2: 0, votos_org3: 0, votos_org4: 0, votos_org5: 0,
        votos_blancos: 0, votos_nulos: 0, total_sufragantes: 0
      });
      this.fotoCapturada.set(null);
      this.gpsCapturado.set(null);
    }
  }

  async tomarFotoYUbicacion() {
    try {
      const foto = await this.camGps.capturarActaYVerificarNitidez();
      const gps = await this.camGps.obtenerUbicacionGps();
      this.fotoCapturada.set(foto);
      this.gpsCapturado.set(gps);
      const t = await this.toast.create({ message: 'Foto nítida y GPS capturados.', duration: 2000, color: 'success' });
      t.present();
    } catch (e: any) {
      const t = await this.toast.create({ message: e.message, duration: 3000, color: 'danger' });
      t.present();
    }
  }

  async enviarActa() {
    const jrvId = this.mesaSeleccionadaId();
    const foto = this.fotoCapturada();
    const gps = this.gpsCapturado();

    if (!jrvId || this.actaForm.invalid || !foto || !gps) {
      const t = await this.toast.create({ message: 'Complete los votos cuadrados, la foto nítida y el GPS.', duration: 2500, color: 'warning' });
      t.present();
      return;
    }

    try {
      const modo = await this.electoral.guardarActa(
        {
          jrv_id: jrvId,
          dignidad: this.dignidadSeleccionada(),
          ...this.actaForm.value,
          foto_url: foto,
          latitud: gps.latitud,
          longitud: gps.longitud,
          registrado_por: this.auth.perfil()?.id
        },
        foto,
        'veedor'
      );

      const msg = modo === 'online'
        ? 'Acta guardada en el servidor.'
        : 'Sin conexión: Acta guardada en cola offline.';
      const t = await this.toast.create({ message: msg, duration: 2500, color: 'success' });
      t.present();
    } catch (e: any) {
      const t = await this.toast.create({ message: e.message, duration: 2500, color: 'danger' });
      t.present();
    }
  }

  async salir() {
    await this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}