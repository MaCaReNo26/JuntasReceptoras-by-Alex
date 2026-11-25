import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
  IonLabel, IonItem, IonInput, IonSelect, IonSelectOption, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonButtons,
  ToastController
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { ElectoralService } from '../../services/electoral.service';
import { cedulaValidator } from '../../validators/electoral.validators';

@Component({
  selector: 'app-provincial',
  templateUrl: './provincial.page.html',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonSegment, IonSegmentButton, IonLabel, IonItem, IonInput, IonSelect, IonSelectOption,
    IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonButtons
  ]
})
export class ProvincialPage implements OnInit {
  vista = signal<'dashboard' | 'recintos' | 'coordinadores'>('dashboard');
  filtroRecintoId = signal<number>(0);
  filtroDignidad = signal<'alcalde' | 'prefecto'>('alcalde');

  recintoForm: FormGroup;
  coordForm: FormGroup;

  resultadosConsolidados = computed(() => {
    const dignidad = this.filtroDignidad();
    const recintoId = this.filtroRecintoId();
    const cands = this.electoral.candidatos().filter(c => c.dignidad === dignidad);
    const jrvsFiltradas = recintoId === 0
      ? this.electoral.jrvs()
      : this.electoral.jrvs().filter(j => j.recinto_id === recintoId);
    const jrvIds = new Set(jrvsFiltradas.map(j => j.id));

    const actasFiltradas = this.electoral.actas().filter(
      a => a.dignidad === dignidad && jrvIds.has(a.jrv_id)
    );

    const totales = [0, 0, 0, 0, 0];
    let blancos = 0;
    let nulos = 0;

    for (const a of actasFiltradas) {
      totales[0] += a.votos_org1;
      totales[1] += a.votos_org2;
      totales[2] += a.votos_org3;
      totales[3] += a.votos_org4;
      totales[4] += a.votos_org5;
      blancos += a.votos_blancos;
      nulos += a.votos_nulos;
    }

    return {
      candidatos: cands.map((c, i) => ({ ...c, votos: totales[i] || 0 })),
      blancos,
      nulos,
      actasProcesadas: actasFiltradas.length,
      totalMesas: jrvsFiltradas.length
    };
  });

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    public electoral: ElectoralService,
    private router: Router,
    private toast: ToastController
  ) {
    this.recintoForm = this.fb.group({
      provincia: ['Pichincha', Validators.required],
      canton: ['Quito', Validators.required],
      parroquia: ['', Validators.required],
      nombre: ['', Validators.required],
      cantidad_jrv: [2, [Validators.required, Validators.min(1)]]
    });

    this.coordForm = this.fb.group({
      cedula: ['', [Validators.required, cedulaValidator()]],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      telefono: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      recinto_id: [null, Validators.required]
    });
  }

  async ngOnInit() {
    await this.electoral.cargarDatosIniciales();
    await this.electoral.cargarPersonalPorRol('coordinador_recinto');
  }

  async crearRecinto() {
    if (this.recintoForm.invalid) return;
    try {
      await this.electoral.crearRecinto(this.recintoForm.value);
      this.recintoForm.reset({ provincia: 'Pichincha', canton: 'Quito', cantidad_jrv: 2 });
      const t = await this.toast.create({ message: 'Recinto y JRV creados.', duration: 2000, color: 'success' });
      t.present();
    } catch (e: any) {
      const t = await this.toast.create({ message: e.message, duration: 2500, color: 'danger' });
      t.present();
    }
  }

  async crearCoordinador() {
    if (this.coordForm.invalid) return;
    try {
      await this.auth.crearUsuarioJerarquico({
        ...this.coordForm.value,
        rol: 'coordinador_recinto'
      });
      await this.electoral.cargarDatosIniciales();
      await this.electoral.cargarPersonalPorRol('coordinador_recinto');
      this.coordForm.reset();
      const t = await this.toast.create({ message: 'Coordinador creado (clave: Ecuador2026).', duration: 2500, color: 'success' });
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