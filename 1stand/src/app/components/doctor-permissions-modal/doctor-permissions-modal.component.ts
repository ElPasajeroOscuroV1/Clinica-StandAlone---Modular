import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface DoctorPermission {
  id?: number;
  doctor_id: number;
  type: 'vacation' | 'permission';
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  doctor?: {
    name: string;
    specialty: string;
  };
  created_at?: string;
}

@Component({
  selector: 'app-doctor-permissions-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-permissions-modal.component.html',
  styleUrl: './doctor-permissions-modal.component.css'
})
export class DoctorPermissionsModalComponent {
  @Input() doctor: any;
  @ViewChild('modal', { static: false }) modal!: any;
  @Output() permissionsUpdated = new EventEmitter<void>();

  permissionForm: FormGroup;
  permissions: DoctorPermission[] = [];
  isEditing = false;
  editingPermissionId: number | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.permissionForm = this.fb.group({
      type: ['vacation', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      is_active: [true]
    });
  }

  openModal(doctor: any): void {
    this.doctor = doctor;
    this.loadPermissions();
    if (this.modal) {
      this.modal.nativeElement.classList.add('show');
      this.modal.nativeElement.style.display = 'block';
      document.body.classList.add('modal-open');
      setTimeout(() => {
        if (this.modal) {
          this.modal.nativeElement.style.opacity = '1';
        }
      }, 10);
    }
  }

  closeModal(): void {
    if (this.modal) {
      this.modal.nativeElement.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
    this.resetForm();
  }

  onSubmit(): void {
    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return;
    }

    const formData = {
      ...this.permissionForm.value,
      doctor_id: this.doctor.id
    };

    this.isLoading = true;

    if (this.isEditing && this.editingPermissionId) {
      this.http.put<DoctorPermission>(`http://localhost:8000/api/doctor-permissions/${this.editingPermissionId}`, formData)
        .subscribe({
          next: () => {
            this.loadPermissions();
            this.resetForm();
            this.permissionsUpdated.emit();
          },
          error: (error) => {
            console.error('Error updating permission:', error);
            this.isLoading = false;
          }
        });
    } else {
      this.http.post<DoctorPermission>('http://localhost:8000/api/doctor-permissions', formData)
        .subscribe({
          next: () => {
            this.loadPermissions();
            this.resetForm();
            this.permissionsUpdated.emit();
          },
          error: (error) => {
            console.error('Error creating permission:', error);
            this.isLoading = false;
          }
        });
    }
  }

  editPermission(permission: DoctorPermission): void {
    this.isEditing = true;
    this.editingPermissionId = permission.id!;

    this.permissionForm.patchValue({
      type: permission.type,
      title: permission.title,
      description: permission.description || '',
      start_date: new Date(permission.start_date).toISOString().split('T')[0],
      end_date: new Date(permission.end_date).toISOString().split('T')[0],
      is_active: permission.is_active
    });
  }

  deletePermission(permissionId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este permiso?')) {
      this.http.delete(`http://localhost:8000/api/doctor-permissions/${permissionId}`)
        .subscribe({
          next: () => {
            this.loadPermissions();
            this.permissionsUpdated.emit();
          },
          error: (error) => {
            console.error('Error deleting permission:', error);
          }
        });
    }
  }

  togglePermissionStatus(permission: DoctorPermission): void {
    const updatedPermission = {
      ...permission,
      is_active: !permission.is_active
    };

    this.http.put<DoctorPermission>(`http://localhost:8000/api/doctor-permissions/${permission.id}`, updatedPermission)
      .subscribe({
        next: () => {
          this.loadPermissions();
          this.permissionsUpdated.emit();
        },
        error: (error) => {
          console.error('Error updating permission status:', error);
        }
      });
  }

  getTypeLabel(type: string): string {
    return type === 'vacation' ? 'Vacaciones' : 'Permiso';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'badge bg-success' : 'badge bg-secondary';
  }

  private loadPermissions(): void {
    this.http.get<DoctorPermission[]>(`http://localhost:8000/api/doctor-permissions?doctor_id=${this.doctor.id}`)
      .subscribe({
        next: (permissions) => {
          this.permissions = permissions;
        },
        error: (error) => {
          console.error('Error loading permissions:', error);
        }
      });
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingPermissionId = null;
    this.permissionForm.reset({
      type: 'vacation',
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
    this.isLoading = false;
  }
}
