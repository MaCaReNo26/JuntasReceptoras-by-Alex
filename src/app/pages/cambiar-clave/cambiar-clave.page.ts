import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonItem, IonInput, IonButton, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cambiar-clave',
  templateUrl: './cambiar-clave.page.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonItem, IonInput, IonButton]
})
export class CambiarClavePage {
  form: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private toast: ToastController) {
    this.form = this.fb.group({
      nuevaClave: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  async guardar() {
    if (this.form.invalid || this.form.value.nuevaClave === 'Ecuador2026') {
      const t = await this.toast.create({ message: 'Debe elegir una clave distinta a Ecuador2026 (mín. 8 caracteres).', duration: 2500, color: 'warning' });
      t.present();
      return;
    }

    try {
      await this.auth.cambiarClaveObligatoria(this.form.value.nuevaClave);
      const rol = this.auth.perfil()?.rol;
      if (rol === 'coordinador_provincial') this.router.navigateByUrl('/provincial');
      if (rol === 'coordinador_recinto') this.router.navigateByUrl('/recinto');
      if (rol === 'veedor') this.router.navigateByUrl('/veedor');
    } catch (e: any) {
      const t = await this.toast.create({ message: e.message, duration: 2500, color: 'danger' });
      t.present();
    }
  }
}