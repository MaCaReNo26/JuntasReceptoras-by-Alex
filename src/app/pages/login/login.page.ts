import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonItem, IonInput, IonButton, IonSpinner, IonText,
  AlertController, ToastController
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { cedulaValidator } from '../../validators/electoral.validators';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonItem, IonInput, IonButton, IonSpinner, IonText]
})
export class LoginPage {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    this.form = this.fb.group({
      cedula: ['', [Validators.required, cedulaValidator()]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async ingresar() {
    if (this.form.invalid) return;
    try {
      const { cedula, password } = this.form.value;
      const perfil = await this.auth.loginConCedula(cedula, password);

      if (perfil.debe_cambiar_clave) {
        this.router.navigateByUrl('/cambiar-clave');
        return;
      }

      if (perfil.rol === 'coordinador_provincial') this.router.navigateByUrl('/provincial');
      if (perfil.rol === 'coordinador_recinto') this.router.navigateByUrl('/recinto');
      if (perfil.rol === 'veedor') this.router.navigateByUrl('/veedor');
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: e.message, duration: 2500, color: 'danger' });
      t.present();
    }
  }

  async abrirRecuperacion() {
    const alert = await this.alertCtrl.create({
      header: 'Recuperar Contraseña',
      inputs: [{ name: 'correo', type: 'email', placeholder: 'Ingrese su correo registrado' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async (data) => {
            try {
              await this.auth.recuperarClave(data.correo);
              const t = await this.toastCtrl.create({ message: 'Enlace de recuperación enviado al correo.', duration: 2500, color: 'success' });
              t.present();
            } catch (err: any) {
              const t = await this.toastCtrl.create({ message: err.message, duration: 2500, color: 'danger' });
              t.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }
}