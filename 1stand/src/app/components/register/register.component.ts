import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
      role: ['', [Validators.required]],
      phone: ['']
    });

    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      this.applyPhoneValidators(role);
    });

    this.applyPhoneValidators(this.registerForm.get('role')?.value);
  }

  private applyPhoneValidators(role: string | null | undefined): void {
    const phoneControl = this.registerForm.get('phone');
    if (!phoneControl) {
      return;
    }

    if (role === 'doctor') {
      phoneControl.setValidators([Validators.required, Validators.pattern('^[0-9]+$')]);
    } else {
      phoneControl.setValidators([Validators.pattern('^[0-9]+$')]);
    }
    phoneControl.updateValueAndValidity({ emitEvent: false });
  }

  onSubmit(): void {
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.value;
    const payload = {
      name: formValue.name?.trim(),
      email: formValue.email?.trim(),
      password: formValue.password,
      password_confirmation: formValue.password_confirmation,
      role: formValue.role,
      phone: this.normalizePhone(formValue.phone, formValue.role)
    };

    this.authService.register(payload).subscribe({
      next: response => {
        console.log('Registro exitoso', response);
        this.router.navigate(['/login']);
      },
      error: error => {
        console.error('Error en el registro', error);
      }
    });
  }

  private normalizePhone(phone: unknown, role: string): string | null {
    const normalized = typeof phone === 'string' ? phone.trim() : '';
    if (role === 'doctor') {
      return normalized;
    }
    return normalized.length > 0 ? normalized : null;
  }
}
